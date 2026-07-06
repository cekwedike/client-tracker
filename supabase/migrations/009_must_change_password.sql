-- Meridian: flag new teammates to change password on first login
-- Run after 008_fix_handle_new_user.sql

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN NOT NULL DEFAULT false;

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
  must_change_pw BOOLEAN;
BEGIN
  is_invited := COALESCE(NEW.raw_user_meta_data->>'invited', 'false') = 'true';
  must_change_pw := COALESCE(NEW.raw_user_meta_data->>'must_change_password', 'false') = 'true';
  SELECT COUNT(*) INTO profile_count FROM public.profiles;

  IF NOT is_invited AND profile_count > 0 THEN
    RETURN NEW;
  END IF;

  IF profile_count = 0 THEN
    assigned_role := 'superadmin';
    must_change_pw := false;
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

  INSERT INTO public.profiles (id, email, full_name, role, is_active, must_change_password)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    assigned_role,
    true,
    must_change_pw
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'handle_new_user failed for %: %', NEW.email, SQLERRM;
    RAISE;
END;
$$;
