-- Meridian: superadmin role — step 1 of 2 (enum value only)
-- Run after 005_client_assignment.sql
--
-- IMPORTANT (Supabase SQL Editor): Run this file ALONE first, then run
-- 006b_superadmin_roles.sql in a separate execution. PostgreSQL cannot use a
-- new enum value in the same transaction that adds it.
--
-- If you previously ran 006_superadmin.sql and saw error 55P04, the enum value
-- may already exist — IF NOT EXISTS makes this safe to re-run.

ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'superadmin';
