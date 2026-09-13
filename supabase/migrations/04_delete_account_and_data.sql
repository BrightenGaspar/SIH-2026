-- Migration: 04_delete_account_and_data.sql
-- Description: Secure server-side function to delete all user-owned data,
-- anonymize shared transaction records, and delete the user account from auth.users.
-- Executes as SECURITY DEFINER so it can manage auth.users without client-side admin privileges.

CREATE OR REPLACE FUNCTION public.delete_user_account()
RETURNS JSONB
SECURITY DEFINER
SET search_path = public, auth
LANGUAGE plpgsql AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- 1. Derive user identity strictly from the authenticated Supabase session
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated: Cannot delete user account without an active session.';
  END IF;

  -- 2. Delete user-owned produce listings (Farmer listings)
  DELETE FROM public.produce 
  WHERE farmer_id = v_user_id;

  -- 3. Anonymize shared transaction records (Orders)
  -- Orders are business-critical financial records shared with farmers and logistics providers.
  -- We preserve the transaction history and quantities but strip personal delivery details.
  UPDATE public.orders
  SET 
    delivery_address = '[Deleted User Account]',
    delivery_city = '[Redacted]'
  WHERE buyer_id = v_user_id::text;

  -- 4. Delete user companion profile
  DELETE FROM public.profiles
  WHERE id = v_user_id;

  -- 5. Delete authentication record from auth.users
  DELETE FROM auth.users
  WHERE id = v_user_id;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'User account and personal data successfully deleted.'
  );
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$$;

-- Grant execution privilege strictly to authenticated users
GRANT EXECUTE ON FUNCTION public.delete_user_account() TO authenticated;
