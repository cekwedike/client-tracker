-- Meridian: Message templates + team soft-delete
-- Run after 001_initial_schema.sql

-- Soft-delete flag for team members (admin sets inactive instead of deleting auth users)
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

-- Message templates
CREATE TABLE message_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  body TEXT NOT NULL,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_message_templates_name ON message_templates(name);
CREATE INDEX idx_message_templates_created_by ON message_templates(created_by);

-- Many-to-many: templates assigned to clients
CREATE TABLE client_templates (
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  template_id UUID NOT NULL REFERENCES message_templates(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (client_id, template_id)
);

CREATE INDEX idx_client_templates_template_id ON client_templates(template_id);

CREATE TRIGGER message_templates_updated_at
  BEFORE UPDATE ON message_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE message_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_templates ENABLE ROW LEVEL SECURITY;

-- Templates: all authenticated users can read
CREATE POLICY "Authenticated users can view message_templates" ON message_templates
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can create message_templates" ON message_templates
  FOR INSERT TO authenticated
  WITH CHECK (get_user_role() IN ('admin', 'manager', 'operator'));

CREATE POLICY "Authenticated users can update message_templates" ON message_templates
  FOR UPDATE TO authenticated
  USING (get_user_role() IN ('admin', 'manager', 'operator'))
  WITH CHECK (get_user_role() IN ('admin', 'manager', 'operator'));

CREATE POLICY "Admins can delete message_templates" ON message_templates
  FOR DELETE TO authenticated USING (get_user_role() = 'admin');

-- Client-template junction
CREATE POLICY "Authenticated users can view client_templates" ON client_templates
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Managers can manage client_templates" ON client_templates
  FOR ALL TO authenticated
  USING (get_user_role() IN ('admin', 'manager', 'operator'))
  WITH CHECK (get_user_role() IN ('admin', 'manager', 'operator'));

-- Admins can deactivate profiles (soft remove)
CREATE POLICY "Admins can deactivate profiles" ON profiles
  FOR UPDATE TO authenticated
  USING (get_user_role() = 'admin');
