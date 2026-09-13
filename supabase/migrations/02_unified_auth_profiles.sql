-- Migration: 02_unified_auth_profiles.sql
-- Description: Unified Authentication, Profile Persistence, Case-Insensitive Unique Username,
-- Strict RLS Policies, and Secure Username Resolution Functions for AgriFlow.

-- 1. Safely add missing columns to public.profiles
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS username TEXT,
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS area TEXT,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- 2. Case-Insensitive Unique Index on Username (e.g. 'Nikhil123' == 'nikhil123')
CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_lower_idx 
  ON public.profiles (LOWER(username));

-- 3. Strict Row Level Security (RLS) on public.profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop overly permissive public policies
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

-- Strict: Authenticated users can only select their own profile
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- Strict: Authenticated users can only insert their own profile linked to their auth user ID
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Strict: Authenticated users can only update their own profile
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 4. Secure RPC: Check Username Availability (Returns strictly BOOLEAN without exposing profiles)
CREATE OR REPLACE FUNCTION public.check_username_available(username_to_check TEXT, current_user_id UUID DEFAULT NULL)
RETURNS BOOLEAN AS $$
BEGIN
  IF username_to_check IS NULL OR length(trim(username_to_check)) = 0 THEN
    RETURN false;
  END IF;

  RETURN NOT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE LOWER(username) = LOWER(trim(username_to_check))
      AND (current_user_id IS NULL OR id <> current_user_id)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.check_username_available(TEXT, UUID) TO anon, authenticated, service_role;

-- 5. Secure RPC: Resolve Username to Auth Email (Returns ONLY email for signInWithPassword)
CREATE OR REPLACE FUNCTION public.resolve_username_to_email(username_input TEXT)
RETURNS TEXT AS $$
DECLARE
  matched_email TEXT;
BEGIN
  IF username_input IS NULL OR length(trim(username_input)) = 0 THEN
    RETURN NULL;
  END IF;

  SELECT email INTO matched_email
  FROM public.profiles
  WHERE LOWER(username) = LOWER(trim(username_input))
  LIMIT 1;

  RETURN matched_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.resolve_username_to_email(TEXT) TO anon, authenticated, service_role;

-- 6. Safe Profile Trigger on auth.users: Auto-link auth.users.id -> public.profiles.id
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role, phone, email, place, area, username)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'consumer'),
    COALESCE(NEW.phone, NEW.raw_user_meta_data->>'phone', ''),
    COALESCE(NEW.email, NEW.raw_user_meta_data->>'email', ''),
    COALESCE(NEW.raw_user_meta_data->>'place', ''),
    COALESCE(NEW.raw_user_meta_data->>'area', ''),
    NULLIF(trim(COALESCE(NEW.raw_user_meta_data->>'username', '')), '')
  )
  ON CONFLICT (id) DO UPDATE
  SET
    full_name = CASE WHEN EXCLUDED.full_name <> '' AND (public.profiles.full_name IS NULL OR public.profiles.full_name = '') THEN EXCLUDED.full_name ELSE public.profiles.full_name END,
    phone = CASE WHEN EXCLUDED.phone <> '' AND (public.profiles.phone IS NULL OR public.profiles.phone = '') THEN EXCLUDED.phone ELSE public.profiles.phone END,
    email = CASE WHEN EXCLUDED.email <> '' AND (public.profiles.email IS NULL OR public.profiles.email = '') THEN EXCLUDED.email ELSE public.profiles.email END,
    updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
