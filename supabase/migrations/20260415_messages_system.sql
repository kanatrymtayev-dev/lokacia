-- Conversations table (если ещё не создана)
create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid references public.listings(id) on delete cascade,
  guest_id uuid references public.profiles(id) on delete cascade,
  host_id uuid references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (listing_id, guest_id)
);

create index if not exists conversations_guest_idx on public.conversations(guest_id);
create index if not exists conversations_host_idx on public.conversations(host_id);

-- Messages table c системными сообщениями
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  content text not null,
  is_read boolean not null default false,
  type text not null default 'text' check (type in ('text', 'system')),
  booking_id uuid references public.bookings(id) on delete set null,
  created_at timestamptz not null default now()
);

-- Если таблица была раньше — добавляем недостающие колонки идемпотентно
alter table public.messages add column if not exists type text not null default 'text';
alter table public.messages add column if not exists booking_id uuid references public.bookings(id) on delete set null;
do $$ begin
  alter table public.messages add constraint messages_type_check check (type in ('text', 'system'));
exception when duplicate_object then null; end $$;

create index if not exists messages_conv_idx on public.messages(conversation_id, created_at);
create index if not exists messages_booking_idx on public.messages(booking_id);

-- Связь bookings <-> conversations: помогает чату подтянуть бронь
alter table public.bookings add column if not exists conversation_id uuid references public.conversations(id) on delete set null;

-- Поля доверия в профиле хоста
alter table public.profiles add column if not exists response_rate int;
alter table public.profiles add column if not exists response_time text;

-- Триггер обновления updated_at у conversations при новом сообщении
create or replace function public.bump_conversation_updated_at() returns trigger as $$
begin
  update public.conversations set updated_at = now() where id = new.conversation_id;
  return new;
end $$ language plpgsql;

drop trigger if exists messages_bump_conv on public.messages;
create trigger messages_bump_conv after insert on public.messages
  for each row execute function public.bump_conversation_updated_at();
