-- Unified notification system
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('broadcast', 'booking', 'system')),
  is_read BOOLEAN NOT NULL DEFAULT false,
  link TEXT,
  broadcast_id UUID REFERENCES broadcasts(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_broadcast ON notifications(broadcast_id);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- User can read own notifications
CREATE POLICY "User can read own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

-- User can update own notifications (mark read)
CREATE POLICY "User can update own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- Service role / admin can insert (via API routes)
CREATE POLICY "Admin can insert notifications"
  ON notifications FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true
  ));

-- Allow service_role full access (for API routes)
CREATE POLICY "Service role full access notifications"
  ON notifications FOR ALL
  USING (auth.role() = 'service_role');
