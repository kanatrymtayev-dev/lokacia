-- ──────────────────────────────────────────────────────────────────────
-- ID-верификация хоста
-- ──────────────────────────────────────────────────────────────────────
create table if not exists public.host_verifications (
  id uuid primary key default gen_random_uuid(),
  host_id uuid not null references public.profiles(id) on delete cascade,
  id_doc_url text,
  selfie_url text,
  status text not null default 'pending'
    check (status in ('pending','verified','rejected')),
  reviewer_note text,
  submitted_at timestamptz not null default now(),
  reviewed_at timestamptz
);

create unique index if not exists host_verifications_host_unique
  on public.host_verifications(host_id);

alter table public.host_verifications enable row level security;

-- SELECT — свою + admin видит все
drop policy if exists hv_select_own_or_admin on public.host_verifications;
create policy hv_select_own_or_admin on public.host_verifications
  for select using (
    auth.uid() = host_id
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true)
  );

-- INSERT — только сам пользователь (свою)
drop policy if exists hv_insert_own on public.host_verifications;
create policy hv_insert_own on public.host_verifications
  for insert with check (auth.uid() = host_id);

-- UPDATE — пользователь обновляет свою (для перезаливки), либо admin меняет статус
drop policy if exists hv_update_own_or_admin on public.host_verifications;
create policy hv_update_own_or_admin on public.host_verifications
  for update using (
    auth.uid() = host_id
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true)
  );

-- Дублирующий быстрый флаг в profiles
alter table public.profiles add column if not exists id_verified boolean not null default false;

-- Триггер: при verified → ставим profiles.id_verified = true; при rejected/pending → false
create or replace function public.sync_id_verified()
returns trigger as $$
begin
  update public.profiles
     set id_verified = (new.status = 'verified')
   where id = new.host_id;
  return new;
end $$ language plpgsql security definer;

drop trigger if exists hv_sync_verified on public.host_verifications;
create trigger hv_sync_verified
  after insert or update of status on public.host_verifications
  for each row execute function public.sync_id_verified();

-- ──────────────────────────────────────────────────────────────────────
-- Production-поля для листингов
-- ──────────────────────────────────────────────────────────────────────
alter table public.listings add column if not exists power_kw int;
alter table public.listings add column if not exists parking_capacity int;
alter table public.listings add column if not exists has_freight_access boolean not null default false;
alter table public.listings add column if not exists has_loading_dock boolean not null default false;
alter table public.listings add column if not exists has_white_cyc boolean not null default false;

-- ──────────────────────────────────────────────────────────────────────
-- B2B-данные у профиля (для инвойсов)
-- ──────────────────────────────────────────────────────────────────────
alter table public.profiles add column if not exists company_name text;
alter table public.profiles add column if not exists company_bin text;
alter table public.profiles add column if not exists company_address text;

-- ──────────────────────────────────────────────────────────────────────
-- Storage: bucket 'verifications' (private)
-- Бакет нужно создать в Dashboard → Storage → New bucket → name: verifications, public: off
-- Затем policies:
-- ──────────────────────────────────────────────────────────────────────
do $$ begin
  -- INSERT — пользователь может загружать только в свою папку {user_id}/...
  drop policy if exists verifications_insert_own on storage.objects;
  create policy verifications_insert_own on storage.objects
    for insert with check (
      bucket_id = 'verifications'
      and auth.uid()::text = (storage.foldername(name))[1]
    );

  drop policy if exists verifications_update_own on storage.objects;
  create policy verifications_update_own on storage.objects
    for update using (
      bucket_id = 'verifications'
      and auth.uid()::text = (storage.foldername(name))[1]
    );

  drop policy if exists verifications_select_own_or_admin on storage.objects;
  create policy verifications_select_own_or_admin on storage.objects
    for select using (
      bucket_id = 'verifications'
      and (
        auth.uid()::text = (storage.foldername(name))[1]
        or exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true)
      )
    );
exception when others then
  raise notice 'Storage policies skipped (бакет verifications ещё не создан, либо политики уже есть): %', sqlerrm;
end $$;
