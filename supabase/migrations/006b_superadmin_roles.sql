-- Meridian: superadmin role — step 2 of 2 (RLS, bootstrap, profile promotion)
-- Run after 006a_superadmin_enum.sql (must be a separate transaction / query run)
--
-- IMPORTANT (Supabase SQL Editor): Run 006a_superadmin_enum.sql first, wait for
-- success, then run this file.

-- Treat superadmin like admin in RLS checks
CREATE OR REPLACE FUNCTION is_platform_admin()
RETURNS BOOLEAN AS $$
  SELECT get_user_role() IN ('admin', 'superadmin');
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION has_manager_access()
RETURNS BOOLEAN AS $$
  SELECT get_user_role() IN ('superadmin', 'admin', 'manager');
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION has_ops_access()
RETURNS BOOLEAN AS $$
  SELECT get_user_role() IN ('superadmin', 'admin', 'manager', 'operator');
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Profiles
DROP POLICY IF EXISTS "Admins can update any profile" ON profiles;
CREATE POLICY "Admins can update any profile" ON profiles
  FOR UPDATE TO authenticated USING (is_platform_admin());

DROP POLICY IF EXISTS "Admins can deactivate profiles" ON profiles;
CREATE POLICY "Admins can deactivate profiles" ON profiles
  FOR UPDATE TO authenticated USING (is_platform_admin());

-- Clients
DROP POLICY IF EXISTS "Operators can insert clients" ON clients;
CREATE POLICY "Operators can insert clients" ON clients
  FOR INSERT TO authenticated WITH CHECK (has_ops_access());

DROP POLICY IF EXISTS "Managers and admins can update any client" ON clients;
CREATE POLICY "Managers and admins can update any client" ON clients
  FOR UPDATE TO authenticated USING (has_manager_access());

DROP POLICY IF EXISTS "Admins can delete clients" ON clients;
CREATE POLICY "Admins can delete clients" ON clients
  FOR DELETE TO authenticated USING (is_platform_admin());

-- Contacts
DROP POLICY IF EXISTS "Authenticated users can manage contacts" ON contacts;
CREATE POLICY "Authenticated users can manage contacts" ON contacts
  FOR ALL TO authenticated
  USING (has_ops_access())
  WITH CHECK (has_ops_access());

-- Business hours
DROP POLICY IF EXISTS "Authenticated users can manage business_hours" ON business_hours;
CREATE POLICY "Authenticated users can manage business_hours" ON business_hours
  FOR ALL TO authenticated
  USING (has_ops_access())
  WITH CHECK (has_ops_access());

-- Audit logs
DROP POLICY IF EXISTS "Managers can view audit_logs" ON audit_logs;
CREATE POLICY "Managers can view audit_logs" ON audit_logs
  FOR SELECT TO authenticated USING (has_manager_access());

-- Tasks
DROP POLICY IF EXISTS "Authenticated users can create tasks" ON tasks;
CREATE POLICY "Authenticated users can create tasks" ON tasks
  FOR INSERT TO authenticated WITH CHECK (has_ops_access());

DROP POLICY IF EXISTS "Users can update tasks" ON tasks;
CREATE POLICY "Users can update tasks" ON tasks
  FOR UPDATE TO authenticated
  USING (
    has_manager_access()
    OR assignee_id = auth.uid()
    OR created_by = auth.uid()
  );

DROP POLICY IF EXISTS "Managers can delete tasks" ON tasks;
CREATE POLICY "Managers can delete tasks" ON tasks
  FOR DELETE TO authenticated USING (has_manager_access());

-- Channels
DROP POLICY IF EXISTS "Managers can manage channels" ON channels;
CREATE POLICY "Managers can manage channels" ON channels
  FOR ALL TO authenticated
  USING (has_manager_access())
  WITH CHECK (has_manager_access());

-- Message templates
DROP POLICY IF EXISTS "Authenticated users can create message_templates" ON message_templates;
CREATE POLICY "Authenticated users can create message_templates" ON message_templates
  FOR INSERT TO authenticated WITH CHECK (has_ops_access());

DROP POLICY IF EXISTS "Authenticated users can update message_templates" ON message_templates;
CREATE POLICY "Authenticated users can update message_templates" ON message_templates
  FOR UPDATE TO authenticated
  USING (has_ops_access())
  WITH CHECK (has_ops_access());

DROP POLICY IF EXISTS "Admins can delete message_templates" ON message_templates;
CREATE POLICY "Admins can delete message_templates" ON message_templates
  FOR DELETE TO authenticated USING (is_platform_admin());

-- Client-template junction
DROP POLICY IF EXISTS "Managers can manage client_templates" ON client_templates;
CREATE POLICY "Managers can manage client_templates" ON client_templates
  FOR ALL TO authenticated
  USING (has_ops_access())
  WITH CHECK (has_ops_access());

-- First user becomes superadmin; invited users keep metadata role
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  profile_count INTEGER;
  is_invited BOOLEAN;
  assigned_role user_role;
BEGIN
  is_invited := COALESCE(NEW.raw_user_meta_data->>'invited', 'false') = 'true';
  SELECT COUNT(*) INTO profile_count FROM profiles;

  IF NOT is_invited AND profile_count > 0 THEN
    RETURN NEW;
  END IF;

  IF profile_count = 0 THEN
    assigned_role := 'superadmin';
  ELSE
    assigned_role := COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'operator');
  END IF;

  INSERT INTO profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    assigned_role
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Promote platform owner if already signed up
UPDATE profiles
SET role = 'superadmin', updated_at = NOW()
WHERE full_name ILIKE 'Chidiebere Ekwedike%'
   OR email ILIKE '%ekwedike%';

-- Fallback: promote earliest profile when no superadmin exists yet
UPDATE profiles
SET role = 'superadmin', updated_at = NOW()
WHERE id = (SELECT id FROM profiles ORDER BY created_at ASC LIMIT 1)
  AND NOT EXISTS (SELECT 1 FROM profiles WHERE role = 'superadmin');
