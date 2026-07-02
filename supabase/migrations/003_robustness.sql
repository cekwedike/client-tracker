-- Meridian robustness: activity log
-- Run after 002_templates.sql

CREATE TABLE activity_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  details JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_activity_log_created_at ON activity_log(created_at DESC);
CREATE INDEX idx_activity_log_client_id ON activity_log(client_id);
CREATE INDEX idx_activity_log_user_id ON activity_log(user_id);
CREATE INDEX idx_activity_log_action ON activity_log(action);

ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

-- Team can read all activity
CREATE POLICY "Authenticated users can view activity_log" ON activity_log
  FOR SELECT TO authenticated USING (true);

-- Users insert their own entries
CREATE POLICY "Authenticated users can insert own activity_log" ON activity_log
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
