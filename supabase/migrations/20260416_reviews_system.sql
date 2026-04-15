-- Таблица отзывов: один отзыв на одну бронь
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  booking_id uuid references public.bookings(id) on delete set null,
  rating int not null check (rating between 1 and 5),
  text text not null default '',
  created_at timestamptz not null default now()
);

-- Если таблица уже существовала — идемпотентно добавляем недостающее
alter table public.reviews add column if not exists booking_id uuid references public.bookings(id) on delete set null;

-- Уникальность booking_id (но допускаем NULL для исторических отзывов без брони)
create unique index if not exists reviews_booking_unique
  on public.reviews(booking_id)
  where booking_id is not null;

create index if not exists reviews_listing_idx on public.reviews(listing_id);
create index if not exists reviews_author_idx on public.reviews(author_id);

-- Поле avg_rating в profiles (для агрегата по хосту)
alter table public.profiles add column if not exists avg_rating numeric(3, 2);

-- Функция: пересчитать рейтинг локации и средний рейтинг хоста
create or replace function public.update_listing_and_host_ratings()
returns trigger as $$
declare
  v_listing_id uuid;
  v_host_id uuid;
  v_avg numeric;
  v_count int;
  v_host_avg numeric;
begin
  -- В DELETE используем OLD, иначе NEW
  v_listing_id := coalesce(new.listing_id, old.listing_id);

  -- 1. Пересчёт рейтинга и количества отзывов локации
  select round(avg(rating)::numeric, 2), count(id)
    into v_avg, v_count
    from public.reviews
   where listing_id = v_listing_id;

  update public.listings
     set rating = coalesce(v_avg, 0),
         review_count = coalesce(v_count, 0)
   where id = v_listing_id;

  -- 2. Узнаём хоста этой локации
  select host_id into v_host_id from public.listings where id = v_listing_id;

  if v_host_id is not null then
    -- Средний рейтинг по всем локациям хоста, где есть отзывы
    select round(avg(r.rating)::numeric, 2)
      into v_host_avg
      from public.reviews r
      join public.listings l on l.id = r.listing_id
     where l.host_id = v_host_id;

    update public.profiles
       set avg_rating = v_host_avg
     where id = v_host_id;
  end if;

  return coalesce(new, old);
end $$ language plpgsql;

-- Триггер на INSERT/UPDATE/DELETE отзывов
drop trigger if exists trg_reviews_recompute on public.reviews;
create trigger trg_reviews_recompute
  after insert or update or delete on public.reviews
  for each row execute function public.update_listing_and_host_ratings();
