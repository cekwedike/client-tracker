-- Meridian: PLNITUDE Client Ops Platform
-- Run this in Supabase SQL Editor or via `supabase db push`

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enums
CREATE TYPE user_role AS ENUM ('admin', 'manager', 'operator', 'viewer');
CREATE TYPE billing_model AS ENUM ('ppl', 'ppm');
CREATE TYPE client_status AS ENUM ('active', 'paused', 'churned');
CREATE TYPE contact_role AS ENUM ('primary', 'cc_manager', 'billing', 'escalation');
CREATE TYPE task_status AS ENUM ('backlog', 'in_progress', 'waiting_on_client', 'done');
CREATE TYPE task_priority AS ENUM ('low', 'medium', 'high', 'urgent');
CREATE TYPE channel_type AS ENUM ('general', 'client', 'handoff');
CREATE TYPE report_type AS ENUM ('daily_handoff', 'weekly_client');

-- Profiles (extends auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  role user_role NOT NULL DEFAULT 'operator',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Clients
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_name TEXT NOT NULL,
  primary_contact_name TEXT,
  industry TEXT,
  status client_status NOT NULL DEFAULT 'active',
  billing_model billing_model NOT NULL DEFAULT 'ppl',
  billing_notes TEXT,
  city TEXT,
  state_region TEXT,
  country TEXT DEFAULT 'US',
  timezone TEXT NOT NULL DEFAULT 'America/New_York',
  service_area_notes TEXT,
  website TEXT,
  services_offered TEXT,
  icp_notes TEXT,
  competitor_positioning TEXT,
  internal_notes TEXT,
  smartlead_campaign_name TEXT,
  smartlead_inbox_url TEXT,
  smartlead_operator_notes TEXT,
  primary_owner_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  do_not_contact_before TIME,
  do_not_contact_after TIME,
  holiday_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_clients_status ON clients(status);
CREATE INDEX idx_clients_billing_model ON clients(billing_model);
CREATE INDEX idx_clients_primary_owner ON clients(primary_owner_id);
CREATE INDEX idx_clients_company_name ON clients(company_name);

-- Contacts
CREATE TABLE contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  role contact_role NOT NULL DEFAULT 'primary',
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  cc_alias TEXT,
  special_instructions TEXT,
  is_default_cc BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_contacts_client_id ON contacts(client_id);

-- Business hours (per weekday: 0=Sunday .. 6=Saturday)
CREATE TABLE business_hours (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  day_of_week SMALLINT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time TIME NOT NULL DEFAULT '09:00',
  end_time TIME NOT NULL DEFAULT '17:00',
  is_closed BOOLEAN NOT NULL DEFAULT FALSE,
  UNIQUE (client_id, day_of_week)
);

CREATE INDEX idx_business_hours_client_id ON business_hours(client_id);

-- Client notes (activity timeline)
CREATE TABLE client_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  author_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_client_notes_client_id ON client_notes(client_id);

-- Audit log
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  action TEXT NOT NULL,
  changed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  old_data JSONB,
  new_data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_record ON audit_logs(table_name, record_id);

-- Tasks
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status task_status NOT NULL DEFAULT 'backlog',
  priority task_priority NOT NULL DEFAULT 'medium',
  assignee_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  due_at TIMESTAMPTZ,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tasks_client_id ON tasks(client_id);
CREATE INDEX idx_tasks_assignee_id ON tasks(assignee_id);
CREATE INDEX idx_tasks_status ON tasks(status);

-- Channels
CREATE TABLE channels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  type channel_type NOT NULL DEFAULT 'general',
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_channels_client_id ON channels(client_id);

-- Messages
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  channel_id UUID NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
  author_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_messages_channel_id ON messages(channel_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);

-- Reports
CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type report_type NOT NULL,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  author_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  content JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_reports_type ON reports(type);
CREATE INDEX idx_reports_client_id ON reports(client_id);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER clients_updated_at BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER contacts_updated_at BEFORE UPDATE ON contacts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tasks_updated_at BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER messages_updated_at BEFORE UPDATE ON messages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'operator')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Audit trigger for clients
CREATE OR REPLACE FUNCTION audit_clients_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    INSERT INTO audit_logs (table_name, record_id, action, changed_by, old_data, new_data)
    VALUES ('clients', NEW.id, 'update', auth.uid(), to_jsonb(OLD), to_jsonb(NEW));
  ELSIF TG_OP = 'INSERT' THEN
    INSERT INTO audit_logs (table_name, record_id, action, changed_by, new_data)
    VALUES ('clients', NEW.id, 'insert', auth.uid(), to_jsonb(NEW));
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO audit_logs (table_name, record_id, action, changed_by, old_data)
    VALUES ('clients', OLD.id, 'delete', auth.uid(), to_jsonb(OLD));
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER clients_audit
  AFTER INSERT OR UPDATE OR DELETE ON clients
  FOR EACH ROW EXECUTE FUNCTION audit_clients_changes();

-- Helper: get current user role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS user_role AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view all profiles" ON profiles
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE TO authenticated USING (id = auth.uid());

CREATE POLICY "Admins can update any profile" ON profiles
  FOR UPDATE TO authenticated USING (get_user_role() = 'admin');

-- Clients policies
CREATE POLICY "Authenticated users can view clients" ON clients
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Operators can insert clients" ON clients
  FOR INSERT TO authenticated
  WITH CHECK (get_user_role() IN ('admin', 'manager', 'operator'));

CREATE POLICY "Managers and admins can update any client" ON clients
  FOR UPDATE TO authenticated
  USING (get_user_role() IN ('admin', 'manager'));

CREATE POLICY "Operators can update assigned clients" ON clients
  FOR UPDATE TO authenticated
  USING (primary_owner_id = auth.uid() AND get_user_role() = 'operator');

CREATE POLICY "Admins can delete clients" ON clients
  FOR DELETE TO authenticated USING (get_user_role() = 'admin');

-- Contacts policies (inherit client access)
CREATE POLICY "Authenticated users can view contacts" ON contacts
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can manage contacts" ON contacts
  FOR ALL TO authenticated
  USING (get_user_role() IN ('admin', 'manager', 'operator'))
  WITH CHECK (get_user_role() IN ('admin', 'manager', 'operator'));

-- Business hours policies
CREATE POLICY "Authenticated users can view business_hours" ON business_hours
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can manage business_hours" ON business_hours
  FOR ALL TO authenticated
  USING (get_user_role() IN ('admin', 'manager', 'operator'))
  WITH CHECK (get_user_role() IN ('admin', 'manager', 'operator'));

-- Client notes policies
CREATE POLICY "Authenticated users can view client_notes" ON client_notes
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can create client_notes" ON client_notes
  FOR INSERT TO authenticated WITH CHECK (true);

-- Audit logs (read-only for managers+)
CREATE POLICY "Managers can view audit_logs" ON audit_logs
  FOR SELECT TO authenticated USING (get_user_role() IN ('admin', 'manager'));

-- Tasks policies
CREATE POLICY "Authenticated users can view tasks" ON tasks
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can create tasks" ON tasks
  FOR INSERT TO authenticated WITH CHECK (get_user_role() IN ('admin', 'manager', 'operator'));

CREATE POLICY "Users can update tasks" ON tasks
  FOR UPDATE TO authenticated
  USING (
    get_user_role() IN ('admin', 'manager')
    OR assignee_id = auth.uid()
    OR created_by = auth.uid()
  );

CREATE POLICY "Managers can delete tasks" ON tasks
  FOR DELETE TO authenticated USING (get_user_role() IN ('admin', 'manager'));

-- Channels policies
CREATE POLICY "Authenticated users can view channels" ON channels
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Managers can manage channels" ON channels
  FOR ALL TO authenticated
  USING (get_user_role() IN ('admin', 'manager'))
  WITH CHECK (get_user_role() IN ('admin', 'manager'));

-- Messages policies
CREATE POLICY "Authenticated users can view messages" ON messages
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can send messages" ON messages
  FOR INSERT TO authenticated WITH CHECK (author_id = auth.uid());

CREATE POLICY "Users can edit own messages" ON messages
  FOR UPDATE TO authenticated USING (author_id = auth.uid());

-- Reports policies
CREATE POLICY "Authenticated users can view reports" ON reports
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can create reports" ON reports
  FOR INSERT TO authenticated WITH CHECK (author_id = auth.uid());

-- Realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE messages;

-- Default channels
INSERT INTO channels (name, slug, type, description) VALUES
  ('General', 'general', 'general', 'Team-wide announcements and discussion'),
  ('Handoff', 'handoff', 'handoff', 'Shift handoffs and daily updates');
