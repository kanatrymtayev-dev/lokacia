-- Гибкое ценообразование и доп. услуги локации (хранится JSONB прямо в listings)
alter table public.listings
  add column if not exists pricing_tiers jsonb not null default '[]'::jsonb,
  add column if not exists add_ons jsonb not null default '[]'::jsonb;

-- В bookings храним выбор клиента (тир + ID допов + базовая ставка на момент брони)
alter table public.bookings
  add column if not exists metadata jsonb not null default '{}'::jsonb;

-- Индекс по add_ons на случай аналитики (опционально, можно убрать)
create index if not exists listings_add_ons_gin on public.listings using gin (add_ons);

-- Пример валидных данных:
-- pricing_tiers: [{"max_guests":15,"price_per_hour":10000},{"max_guests":30,"price_per_hour":15000}]
-- add_ons: [
--   {"id":"smoke","name":"Дым-машина","price":5000,"charge_type":"flat"},
--   {"id":"steadicam","name":"Аренда стедикама","price":10000,"charge_type":"per_hour"}
-- ]
-- bookings.metadata: {"selected_add_ons":["smoke"], "base_price": 10000, "selected_tier": {"max_guests":15,"price_per_hour":10000}}
