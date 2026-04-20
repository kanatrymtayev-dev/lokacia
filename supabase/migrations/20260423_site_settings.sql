-- Site settings: key-value store for admin-configurable site data
CREATE TABLE IF NOT EXISTS site_settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS: anyone can read, only admins can update
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read site_settings"
  ON site_settings FOR SELECT
  USING (true);

CREATE POLICY "Only admins can modify site_settings"
  ON site_settings FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Seed default values
INSERT INTO site_settings (key, value) VALUES
  ('site_name',    'LOKACIA.KZ'),
  ('site_tagline', 'Маркетплейс аренды локаций для съёмок, мероприятий и встреч в Казахстане'),
  ('email',        'hello@lokacia.kz'),
  ('phone',        '+7 700 123 45 67'),
  ('address',      'Алматы, Казахстан'),
  ('instagram',    ''),
  ('telegram',     ''),
  ('whatsapp',     '')
ON CONFLICT (key) DO NOTHING;
