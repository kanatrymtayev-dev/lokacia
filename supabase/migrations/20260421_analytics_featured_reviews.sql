-- ──────────────────────────────────────────────────────────────────────
-- Listing views (для аналитики хоста)
-- ──────────────────────────────────────────────────────────────────────
create table if not exists public.listing_views (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  viewer_id uuid references public.profiles(id) on delete set null,
  viewed_at timestamptz not null default now()
);

create index if not exists listing_views_listing_idx
  on public.listing_views(listing_id, viewed_at desc);

alter table public.listing_views enable row level security;

-- INSERT — все, включая anon (трекинг просмотров)
drop policy if exists listing_views_insert_all on public.listing_views;
create policy listing_views_insert_all on public.listing_views
  for insert with check (true);

-- SELECT — только хост этой локации
drop policy if exists listing_views_select_host on public.listing_views;
create policy listing_views_select_host on public.listing_views
  for select using (
    exists (
      select 1 from public.listings l
      where l.id = listing_id and l.host_id = auth.uid()
    )
  );

-- ──────────────────────────────────────────────────────────────────────
-- Featured listings
-- ──────────────────────────────────────────────────────────────────────
alter table public.listings add column if not exists featured_until timestamptz;
create index if not exists listings_featured_idx
  on public.listings(featured_until)
  where featured_until is not null;

-- ──────────────────────────────────────────────────────────────────────
-- Двусторонние отзывы: расширяем reviews
-- ──────────────────────────────────────────────────────────────────────
alter table public.reviews add column if not exists target_type text not null default 'listing';
do $$ begin
  alter table public.reviews add constraint reviews_target_type_check
    check (target_type in ('listing','guest'));
exception when duplicate_object then null; end $$;

alter table public.reviews add column if not exists target_user_id uuid references public.profiles(id) on delete cascade;
create index if not exists reviews_target_user_idx on public.reviews(target_user_id) where target_user_id is not null;

-- listing_id может быть null для guest-отзывов? Нет — мы оставляем listing_id
-- для контекста. Но check, что для guest target_user_id обязателен:
do $$ begin
  alter table public.reviews add constraint reviews_target_user_required
    check (
      (target_type = 'listing' and target_user_id is null)
      or (target_type = 'guest' and target_user_id is not null)
    );
exception when duplicate_object then null; end $$;

-- Уникальность: одна бронь = один отзыв каждого типа
drop index if exists reviews_booking_unique;
create unique index if not exists reviews_booking_target_unique
  on public.reviews(booking_id, target_type)
  where booking_id is not null;
