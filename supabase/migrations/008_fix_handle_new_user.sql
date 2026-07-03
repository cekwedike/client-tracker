-- Meridian: fix handle_new_user trigger failures on invite / admin user create
-- Run after 007_backfill_orphan_profiles.sql
--
-- Symptom: inviteUserByEmail returns 500 "Database error saving new user"
-- and the JS client surfaces error.message as "{}".

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  profile_count INTEGER;
  is_invited BOOLEAN;
  assigned_role user_role;
BEGIN
  is_invited := COALESCE(NEW.raw_user_meta_data->>'invited', 'false') = 'true';
  SELECT COUNT(*) INTO profile_count FROM public.profiles;

  -- Invite-only: block self-signup after the first profile exists
  IF NOT is_invited AND profile_count > 0 THEN
    RETURN NEW;
  END IF;

  IF profile_count = 0 THEN
    assigned_role := 'superadmin';
  ELSE
    BEGIN
      assigned_role := COALESCE(
        (NEW.raw_user_meta_data->>'role')::user_role,
        'operator'
      );
    EXCEPTION
      WHEN invalid_text_representation THEN
        assigned_role := 'operator';
    END;
  END IF;

  INSERT INTO public.profiles (id, email, full_name, role, is_active)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    assigned_role,
    true
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'handle_new_user failed for %: %', NEW.email, SQLERRM;
    RAISE;
END;
$$;

-- Ensure auth can execute the trigger function
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO supabase_auth_admin;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;
