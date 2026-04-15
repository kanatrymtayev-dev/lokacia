-- ──────────────────────────────────────────────────────────────────────
-- Blackouts: даты, заблокированные хостом (отпуск/ремонт/частное событие)
-- ──────────────────────────────────────────────────────────────────────
create table if not exists public.listing_blackouts (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  start_date date not null,
  end_date date not null,
  reason text,
  created_at timestamptz not null default now(),
  constraint listing_blackouts_dates_check check (end_date >= start_date)
);

create index if not exists listing_blackouts_listing_idx
  on public.listing_blackouts(listing_id, start_date, end_date);

alter table public.listing_blackouts enable row level security;

-- SELECT — все (нужно арендатору для подсказок в booking-sidebar)
drop policy if exists blackouts_select_all on public.listing_blackouts;
create policy blackouts_select_all on public.listing_blackouts
  for select using (true);

-- INSERT/UPDATE/DELETE — только хост этой локации
drop policy if exists blackouts_insert_host on public.listing_blackouts;
create policy blackouts_insert_host on public.listing_blackouts
  for insert with check (
    exists (
      select 1 from public.listings l
      where l.id = listing_id and l.host_id = auth.uid()
    )
  );

drop policy if exists blackouts_update_host on public.listing_blackouts;
create policy blackouts_update_host on public.listing_blackouts
  for update using (
    exists (
      select 1 from public.listings l
      where l.id = listing_id and l.host_id = auth.uid()
    )
  );

drop policy if exists blackouts_delete_host on public.listing_blackouts;
create policy blackouts_delete_host on public.listing_blackouts
  for delete using (
    exists (
      select 1 from public.listings l
      where l.id = listing_id and l.host_id = auth.uid()
    )
  );

-- ──────────────────────────────────────────────────────────────────────
-- Custom quotes: новый тип сообщения 'quote' + metadata jsonb
-- ──────────────────────────────────────────────────────────────────────
alter table public.messages add column if not exists metadata jsonb not null default '{}'::jsonb;

-- Снимаем старый check на type и ставим новый с 'quote'
do $$ begin
  alter table public.messages drop constraint if exists messages_type_check;
exception when undefined_object then null; end $$;

alter table public.messages
  add constraint messages_type_check
  check (type in ('text', 'system', 'quote'));

-- Пример metadata для quote:
-- { "price": 35000, "hours": 4, "valid_until": "2026-05-01", "status": "pending" }
