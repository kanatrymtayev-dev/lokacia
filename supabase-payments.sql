-- LOKACIA.KZ Payments & Payouts Schema
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New Query)

-- 1. Add referral and payment fields to bookings
alter table public.bookings
  add column if not exists referral_code text,
  add column if not exists commission_rate numeric not null default 0.15,
  add column if not exists payment_status text not null default 'unpaid'
    check (payment_status in ('unpaid', 'paid', 'refunded'));

create index if not exists bookings_payment_status_idx on public.bookings(payment_status);
create index if not exists bookings_date_idx on public.bookings(date);

-- 2. Payments table (incoming payments from renters)
create table public.payments (
  id uuid default gen_random_uuid() primary key,
  booking_id uuid references public.bookings(id) on delete cascade not null,
  amount integer not null, -- total amount paid by renter (incl. service fee)
  service_fee integer not null, -- 7.5% service fee from renter
  commission_amount integer not null, -- 15% or 3% from host's share
  host_amount integer not null, -- what host receives
  commission_rate numeric not null default 0.15,
  method text not null default 'kaspi_pay' check (method in ('kaspi_pay', 'card', 'manual')),
  status text not null default 'pending'
    check (status in ('pending', 'completed', 'refunded', 'failed')),
  kaspi_txn_id text, -- Kaspi Pay transaction ID
  paid_at timestamptz,
  created_at timestamptz default now()
);

alter table public.payments enable row level security;

create policy "Admins and involved users can view payments"
  on public.payments for select using (
    auth.uid() in (
      select renter_id from public.bookings where id = booking_id
      union
      select l.host_id from public.bookings b join public.listings l on l.id = b.listing_id where b.id = booking_id
    )
  );

create policy "System can insert payments"
  on public.payments for insert with check (true);

create policy "System can update payments"
  on public.payments for update using (true);

-- 3. Payouts table (outgoing payments to hosts)
create table public.payouts (
  id uuid default gen_random_uuid() primary key,
  host_id uuid references public.profiles(id) on delete cascade not null,
  amount integer not null,
  booking_ids uuid[] not null default '{}',
  status text not null default 'pending'
    check (status in ('pending', 'processing', 'completed', 'failed')),
  method text not null default 'kaspi_transfer',
  kaspi_phone text, -- host's Kaspi phone for transfer
  processed_at timestamptz,
  created_at timestamptz default now()
);

alter table public.payouts enable row level security;

create policy "Hosts can view own payouts"
  on public.payouts for select using (auth.uid() = host_id);

create policy "System can insert payouts"
  on public.payouts for insert with check (true);

create policy "System can update payouts"
  on public.payouts for update using (true);

-- 4. Admin role for the platform owner
-- Add admin flag to profiles
alter table public.profiles
  add column if not exists is_admin boolean default false;

-- 5. Admin policies - admin can see everything
create policy "Admin can view all payments"
  on public.payments for select using (
    auth.uid() in (select id from public.profiles where is_admin = true)
  );

create policy "Admin can view all payouts"
  on public.payouts for select using (
    auth.uid() in (select id from public.profiles where is_admin = true)
  );

create policy "Admin can view all bookings"
  on public.bookings for select using (
    auth.uid() in (select id from public.profiles where is_admin = true)
  );

create policy "Admin can update all bookings"
  on public.bookings for update using (
    auth.uid() in (select id from public.profiles where is_admin = true)
  );
