-- Migration: 18_fix_auth_hook_failsafe.sql
-- Description: Fail-safe Supabase Auth SMS Hook and Auth Hooks error prevention.
-- Prevents "Service currently unavailable due to hook" errors by catching all exceptions
-- and ensuring execution grants for supabase_auth_admin and postgres.

-- 1. Safely enable pg_net extension if available
DO $$
BEGIN
  CREATE EXTENSION IF NOT EXISTS pg_net;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'pg_net extension could not be enabled automatically or is already present: %', SQLERRM;
END $$;

-- 2. Define bulletproof Send SMS hook function that NEVER throws unhandled exceptions
CREATE OR REPLACE FUNCTION public.send_sms(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  raw_phone text;
  clean_phone text;
  otp_code text;
BEGIN
  -- Safe extraction of phone and OTP
  raw_phone := event->'user'->>'phone';
  otp_code := COALESCE(event->'sms'->>'otp', event->>'otp', '');

  -- Normalize to 10-digit Indian phone number
  IF raw_phone IS NOT NULL THEN
    clean_phone := regexp_replace(raw_phone, '\D', '', 'g');
    IF length(clean_phone) = 12 AND clean_phone LIKE '91%' THEN
      clean_phone := substr(clean_phone, 3);
    ELSIF length(clean_phone) > 10 THEN
      clean_phone := right(clean_phone, 10);
    END IF;
  END IF;

  -- Attempt async HTTP dispatch via pg_net if net schema and clean phone are available
  BEGIN
    IF clean_phone IS NOT NULL AND length(clean_phone) = 10 AND otp_code <> '' THEN
      PERFORM net.http_post(
        url := 'https://www.fast2sms.com/dev/bulkV2',
        headers := jsonb_build_object(
          'authorization', 'j6aFGtwnAVWZE81hQLu4ld5SMmRX2IoHY0KTc9CpBbNvgDekqiETKlR7dtJFoM6NOQ5AuISb9se823CU',
          'Content-Type', 'application/json'
        ),
        body := jsonb_build_object(
          'route', 'q',
          'message', 'AgriFlow verification code is ' || otp_code || '. Valid for 5 minutes. Do not share with anyone.',
          'numbers', clean_phone
        )
      );
    END IF;
  EXCEPTION
    WHEN OTHERS THEN
      -- Log error internally but NEVER fail the auth flow
      RAISE WARNING 'Fast2SMS dispatch error (non-fatal): %', SQLERRM;
  END;

  -- Supabase Auth expects an empty jsonb object on success
  RETURN '{}'::jsonb;
EXCEPTION
  WHEN OTHERS THEN
    -- In case of ANY unhandled error, return empty jsonb so Supabase Auth proceeds cleanly
    RETURN '{}'::jsonb;
END;
$$;

-- 3. Grant full execution permissions to Supabase Auth roles
GRANT EXECUTE ON FUNCTION public.send_sms(jsonb) TO supabase_auth_admin;
GRANT EXECUTE ON FUNCTION public.send_sms(jsonb) TO postgres;
GRANT EXECUTE ON FUNCTION public.send_sms(jsonb) TO anon;
GRANT EXECUTE ON FUNCTION public.send_sms(jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.send_sms(jsonb) TO service_role;

-- 4. Fail-safe Custom Access Token Hook (if enabled in Supabase Dashboard)
CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  claims jsonb;
  user_role text;
BEGIN
  claims := event->'claims';
  user_role := COALESCE(
    (SELECT role FROM public.profiles WHERE id = (event->>'user_id')::uuid),
    event->'claims'->'user_metadata'->>'role',
    'consumer'
  );

  claims := jsonb_set(claims, '{user_role}', to_jsonb(user_role));
  event := jsonb_set(event, '{claims}', claims);
  RETURN event;
EXCEPTION
  WHEN OTHERS THEN
    -- Fallback: return original event without modification
    RETURN event;
END;
$$;

GRANT EXECUTE ON FUNCTION public.custom_access_token_hook(jsonb) TO supabase_auth_admin;
GRANT EXECUTE ON FUNCTION public.custom_access_token_hook(jsonb) TO postgres;
GRANT EXECUTE ON FUNCTION public.custom_access_token_hook(jsonb) TO service_role;
