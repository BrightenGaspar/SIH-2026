-- Migration: 03_fast2sms_auth_hook.sql
-- Description: Native Supabase Auth Send SMS Hook with dedicated Fast2SMS OTP route.

-- 1. Enable pg_net extension
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 2. Define bulletproof Send SMS hook function returning jsonb
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

  -- Dispatch real SMS via Fast2SMS Quick Route (q) asynchronously using pg_net
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
      RAISE WARNING 'Fast2SMS dispatch error (non-fatal): %', SQLERRM;
  END;

  RETURN '{}'::jsonb;
EXCEPTION
  WHEN OTHERS THEN
    RETURN '{}'::jsonb;
END;
$$;

-- 3. Grant necessary execution permissions to Supabase Auth admin
GRANT EXECUTE ON FUNCTION public.send_sms(jsonb) TO supabase_auth_admin;
GRANT EXECUTE ON FUNCTION public.send_sms(jsonb) TO postgres;
GRANT EXECUTE ON FUNCTION public.send_sms(jsonb) TO anon;
GRANT EXECUTE ON FUNCTION public.send_sms(jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.send_sms(jsonb) TO service_role;

