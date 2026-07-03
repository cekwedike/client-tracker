-- Meridian: invite-only auth
-- Run after 003_robustness.sql
-- Also disable public signup in Supabase Dashboard: Authentication → Providers → Email → disable signups

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  profile_count INTEGER;
  is_invited BOOLEAN;
BEGIN
  is_invited := COALESCE(NEW.raw_user_meta_data->>'invited', 'false') = 'true';
  SELECT COUNT(*) INTO profile_count FROM profiles;

  -- Allow first bootstrap user; thereafter require admin invite metadata
  IF NOT is_invited AND profile_count > 0 THEN
    RETURN NEW;
  END IF;

  INSERT INTO profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'operator')
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
