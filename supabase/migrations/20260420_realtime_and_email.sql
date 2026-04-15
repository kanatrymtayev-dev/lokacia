-- ──────────────────────────────────────────────────────────────────────
-- Realtime: включаем подписку на messages
-- ──────────────────────────────────────────────────────────────────────
do $$ begin
  alter publication supabase_realtime add table public.messages;
exception when duplicate_object then null; end $$;

-- ──────────────────────────────────────────────────────────────────────
-- Email в profiles + автозаполнение из auth.users
-- ──────────────────────────────────────────────────────────────────────
alter table public.profiles add column if not exists email text;

-- Бэкфил из auth.users
update public.profiles p
   set email = u.email
  from auth.users u
 where u.id = p.id and p.email is null;

-- Триггер: при создании auth.users → копируем email в profiles (если профайл уже есть)
-- На случай если профайл создаётся позже — синхронизируем при upsert профайла тоже
create or replace function public.sync_profile_email()
returns trigger as $$
begin
  new.email := coalesce(new.email, (select email from auth.users where id = new.id));
  return new;
end $$ language plpgsql security definer;

drop trigger if exists profiles_sync_email on public.profiles;
create trigger profiles_sync_email
  before insert or update on public.profiles
  for each row execute function public.sync_profile_email();
