-- Meridian: backfill profiles for auth users missing a row
-- Run after 006b_superadmin_roles.sql
--
-- Some projects had auth.users created before handle_new_user was deployed, or the
-- trigger failed silently. This repairs orphan accounts so invite-only checks work.

INSERT INTO profiles (id, email, full_name, role)
SELECT
  u.id,
  u.email,
  COALESCE(u.raw_user_meta_data->>'full_name', split_part(u.email, '@', 1)),
  CASE
    WHEN NOT EXISTS (SELECT 1 FROM profiles)
      AND u.id = (
        SELECT id FROM auth.users ORDER BY created_at ASC LIMIT 1
      )
    THEN 'superadmin'::user_role
    WHEN COALESCE(u.raw_user_meta_data->>'invited', 'false') = 'true'
    THEN COALESCE((u.raw_user_meta_data->>'role')::user_role, 'operator')
    ELSE 'operator'::user_role
  END
FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM profiles p WHERE p.id = u.id)
ON CONFLICT (id) DO NOTHING;

-- Promote platform owner when profile already exists but role was not set
UPDATE profiles
SET role = 'superadmin', updated_at = NOW()
WHERE role <> 'superadmin'
  AND (
    full_name ILIKE 'Chidiebere Ekwedike%'
    OR email ILIKE '%ekwedike%'
  );
