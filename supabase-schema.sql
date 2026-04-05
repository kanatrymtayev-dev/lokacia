-- LOKACIA.KZ Database Schema
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New Query)

-- 1. Profiles (extends Supabase auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  name text not null,
  phone text,
  role text not null default 'renter' check (role in ('host', 'renter')),
  avatar_url text,
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Public profiles are viewable by everyone"
  on public.profiles for select using (true);

create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert with check (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', 'Пользователь'),
    coalesce(new.raw_user_meta_data->>'role', 'renter')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 2. Listings
create table public.listings (
  id uuid default gen_random_uuid() primary key,
  host_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  slug text unique not null,
  description text not null,
  space_type text not null,
  activity_types text[] not null default '{}',
  city text not null,
  district text not null,
  address text not null,
  lat double precision,
  lng double precision,
  area integer not null,
  capacity integer not null,
  ceiling_height numeric,
  price_per_hour integer not null,
  price_per_day integer,
  min_hours integer not null default 2,
  images text[] not null default '{}',
  styles text[] default '{}',
  amenities text[] default '{}',
  rules text[] default '{}',
  allows_alcohol boolean default false,
  allows_loud_music boolean default false,
  allows_pets boolean default false,
  allows_smoking boolean default false,
  allows_food boolean default true,
  rating numeric default 0,
  review_count integer default 0,
  instant_book boolean default false,
  superhost boolean default false,
  status text default 'active' check (status in ('active', 'draft', 'moderation', 'archived')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.listings enable row level security;

create policy "Listings are viewable by everyone"
  on public.listings for select using (true);

create policy "Hosts can insert own listings"
  on public.listings for insert with check (auth.uid() = host_id);

create policy "Hosts can update own listings"
  on public.listings for update using (auth.uid() = host_id);

create policy "Hosts can delete own listings"
  on public.listings for delete using (auth.uid() = host_id);

-- Index for search
create index listings_city_idx on public.listings(city);
create index listings_space_type_idx on public.listings(space_type);
create index listings_status_idx on public.listings(status);
create index listings_slug_idx on public.listings(slug);

-- 3. Bookings
create table public.bookings (
  id uuid default gen_random_uuid() primary key,
  listing_id uuid references public.listings(id) on delete cascade not null,
  renter_id uuid references public.profiles(id) on delete cascade not null,
  date date not null,
  start_time time not null,
  end_time time not null,
  guest_count integer not null,
  activity_type text not null,
  description text,
  total_price integer not null,
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'rejected', 'completed', 'cancelled')),
  created_at timestamptz default now()
);

alter table public.bookings enable row level security;

create policy "Renters can view own bookings"
  on public.bookings for select using (auth.uid() = renter_id);

create policy "Hosts can view bookings for their listings"
  on public.bookings for select using (
    auth.uid() in (select host_id from public.listings where id = listing_id)
  );

create policy "Renters can create bookings"
  on public.bookings for insert with check (auth.uid() = renter_id);

create policy "Hosts can update booking status"
  on public.bookings for update using (
    auth.uid() in (select host_id from public.listings where id = listing_id)
  );

create policy "Renters can cancel own bookings"
  on public.bookings for update using (auth.uid() = renter_id);

-- 4. Reviews
create table public.reviews (
  id uuid default gen_random_uuid() primary key,
  listing_id uuid references public.listings(id) on delete cascade not null,
  author_id uuid references public.profiles(id) on delete cascade not null,
  rating integer not null check (rating >= 1 and rating <= 5),
  text text not null,
  created_at timestamptz default now()
);

alter table public.reviews enable row level security;

create policy "Reviews are viewable by everyone"
  on public.reviews for select using (true);

create policy "Users can create reviews"
  on public.reviews for insert with check (auth.uid() = author_id);

-- Update listing rating on new review
create or replace function public.update_listing_rating()
returns trigger as $$
begin
  update public.listings
  set
    rating = (select avg(rating) from public.reviews where listing_id = new.listing_id),
    review_count = (select count(*) from public.reviews where listing_id = new.listing_id)
  where id = new.listing_id;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_review_created
  after insert on public.reviews
  for each row execute procedure public.update_listing_rating();

-- 5. Host applications (from landing page form)
create table public.host_applications (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  phone text not null,
  city text not null,
  space_type text not null,
  area integer,
  description text,
  status text default 'new' check (status in ('new', 'contacted', 'onboarded', 'rejected')),
  created_at timestamptz default now()
);

alter table public.host_applications enable row level security;

create policy "Anyone can submit application"
  on public.host_applications for insert with check (true);

-- 6. Storage bucket for listing images
insert into storage.buckets (id, name, public) values ('listings', 'listings', true);

create policy "Anyone can view listing images"
  on storage.objects for select using (bucket_id = 'listings');

create policy "Authenticated users can upload listing images"
  on storage.objects for insert with check (
    bucket_id = 'listings' and auth.role() = 'authenticated'
  );

create policy "Users can delete own listing images"
  on storage.objects for delete using (
    bucket_id = 'listings' and auth.uid()::text = (storage.foldername(name))[1]
  );
