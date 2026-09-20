-- ==============================================================================
-- AGRIFLOW.AI: MASTER LIVE SYNCHRONIZATION & HARDENED RLS MIGRATION
-- File: supabase/migrations/15_live_sync.sql
-- Description:
--   1. Immediate lockdown: Revokes ALL anonymous writes and default privileges.
--   2. Explicitly revokes anon SELECT on orders, profiles, logistics_assignments,
--      logistics_trips, produce, notifications, and produce_listings.
--   3. Canonical schema columns and driver verification flag (profiles.is_verified).
--   4. Role vocabulary reconciliation:
--      - Drops old role constraint and column default.
--      - Migrates existing 'buyer' rows to 'consumer'.
--      - Constrains role to ('farmer', 'consumer', 'logistics', 'admin').
--   5. Non-recursive SECURITY DEFINER helper functions:
--      - is_order_party(TEXT) and is_order_party(UUID)
--      - is_profile_counterparty(UUID)
--      - All search_path = public, revoked from PUBLIC and anon.
--   6. Normalizes 12-stage order lifecycle check constraint and migrates legacy rows.
--   7. Notifications table, trigger functions, and realtime publication.
--   8. Drops all legacy parameter-vulnerable RPC signatures.
--   9. Canonical SECURITY DEFINER RPCs with strict auth.uid() checks:
--      - atomic_checkout_order (creates assignment atomically)
--      - farmer_update_order_status
--      - driver_claim_assignment
--      - driver_update_gps
--      - driver_update_delivery_status (mandates proof photo when delivered)
--      - consumer_confirm_receipt
--      - consumer_cancel_order
--      - submit_verified_review
--      - set_my_role (for brand-new signups to choose allowed roles)
--  10. Storage buckets (produce-images, delivery-proofs) and storage RLS.
--  11. Row Level Security (RLS) on EVERY table in public schema:
--      - profiles: column-level permissions on safe fields only; role & wallet_balance
--        are never client-writable; SELECT self or counterparties only.
--      - orders: SELECT via is_order_party(); direct mutations blocked.
--      - produce_listings: UPDATE WITH CHECK (farmer_id = auth.uid()).
--      - logistics_assignments: unassigned pool visible only to VERIFIED drivers;
--        direct mutations blocked (RPC-only).
--      - logistics_trips: SELECT assigned driver and order parties only; mutations blocked.
--      - reviews & ratings: direct INSERT/UPDATE blocked (RPC-only).
--  12. Privacy-preserving views:
--      - public_profiles: farmers only, minimal safe fields.
--      - public_produce_catalog: active listings with real district/state; no exact addresses.
--      - unassigned_logistics_pool: for verified drivers; hides delivery address until claimed.
--  13. Cleanup audit test rows (TEST-%) and zero-UUID listings.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. EMERGENCY HARDENING: LOCK DOWN ANONYMOUS ACCESS
-- ------------------------------------------------------------------------------
-- Revoke all mutations from anon across all existing public tables
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON ALL TABLES IN SCHEMA public FROM anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE INSERT, UPDATE, DELETE ON TABLES FROM anon;

-- Revoke anonymous SELECT on sensitive tables
REVOKE SELECT ON TABLE public.orders FROM anon;
REVOKE SELECT ON TABLE public.profiles FROM anon;
REVOKE SELECT ON TABLE public.logistics_assignments FROM anon;
REVOKE SELECT ON TABLE public.produce_listings FROM anon;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'logistics_trips') THEN
    EXECUTE 'REVOKE ALL ON TABLE public.logistics_trips FROM anon';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'produce') THEN
    EXECUTE 'REVOKE ALL ON TABLE public.produce FROM anon';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'notifications') THEN
    EXECUTE 'REVOKE ALL ON TABLE public.notifications FROM anon';
  END IF;
END $$;

-- ------------------------------------------------------------------------------
-- 2. EXTENSIONS, SEQUENCES & SHARED HELPERS
-- ------------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE SEQUENCE IF NOT EXISTS public.order_seq START WITH 1000 INCREMENT BY 1;

-- ------------------------------------------------------------------------------
-- 3. ENSURE CANONICAL SCHEMA COLUMNS EXIST
-- ------------------------------------------------------------------------------
-- Profiles
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS district TEXT,
  ADD COLUMN IF NOT EXISTS state TEXT,
  ADD COLUMN IF NOT EXISTS place TEXT,
  ADD COLUMN IF NOT EXISTS village_or_area TEXT,
  ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Produce Listings
ALTER TABLE public.produce_listings
  ADD COLUMN IF NOT EXISTS variety TEXT,
  ADD COLUMN IF NOT EXISTS quality_grade TEXT DEFAULT 'A',
  ADD COLUMN IF NOT EXISTS district TEXT,
  ADD COLUMN IF NOT EXISTS state TEXT,
  ADD COLUMN IF NOT EXISTS location_lat DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS location_lng DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS location_address TEXT,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Orders
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS order_number TEXT,
  ADD COLUMN IF NOT EXISTS listing_id UUID REFERENCES public.produce_listings(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS buyer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS farmer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS quantity NUMERIC,
  ADD COLUMN IF NOT EXISTS quantity_kg NUMERIC,
  ADD COLUMN IF NOT EXISTS unit_price NUMERIC,
  ADD COLUMN IF NOT EXISTS delivery_lat DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS delivery_lng DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS delivery_address TEXT,
  ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'upi',
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Logistics Assignments
ALTER TABLE public.logistics_assignments
  ADD COLUMN IF NOT EXISTS proof_photo_path TEXT,
  ADD COLUMN IF NOT EXISTS current_lat DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS current_lng DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS current_temp NUMERIC,
  ADD COLUMN IF NOT EXISTS target_temp NUMERIC DEFAULT 4.0,
  ADD COLUMN IF NOT EXISTS humidity NUMERIC,
  ADD COLUMN IF NOT EXISTS spoilage_risk TEXT DEFAULT 'low',
  ADD COLUMN IF NOT EXISTS last_gps_update TIMESTAMPTZ DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Logistics Trips
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'logistics_trips') THEN
    ALTER TABLE public.logistics_trips
      ADD COLUMN IF NOT EXISTS operator_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
  END IF;
END $$;

-- ------------------------------------------------------------------------------
-- 4. ROLE VOCABULARY RECONCILIATION & PROFILE CONSTRAINTS
-- ------------------------------------------------------------------------------
-- 1. Drop old role check constraint
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

-- 2. Drop column default on role so brand-new signups can choose via set_my_role
ALTER TABLE public.profiles ALTER COLUMN role DROP DEFAULT;

-- 3. Migrate legacy 'buyer' and 'customer' rows to canonical 'consumer'
UPDATE public.profiles
SET role = 'consumer'
WHERE role IN ('buyer', 'customer') OR role IS NULL;

-- 4. Apply strict canonical role check constraint: farmer, consumer, logistics, admin
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('farmer', 'consumer', 'logistics', 'admin'));

-- ------------------------------------------------------------------------------
-- 5. ORDER STATUS NORMALIZATION & CHECK CONSTRAINT (12 CANONICAL STATUSES)
-- ------------------------------------------------------------------------------
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_status_check;

UPDATE public.orders
SET status = CASE
  WHEN status = 'Escrow Locked'     THEN 'accepted'
  WHEN status = 'Confirmed'         THEN 'accepted'
  WHEN status = 'Farmer Accepted'   THEN 'accepted'
  WHEN status = 'Preparing'         THEN 'preparing'
  WHEN status = 'Ready for Pickup'  THEN 'ready_for_pickup'
  WHEN status = 'Pickup Assigned'   THEN 'pickup_assigned'
  WHEN status = 'Picked Up'         THEN 'picked_up'
  WHEN status = 'In Transit'        THEN 'in_transit'
  WHEN status = 'Dispatched'        THEN 'in_transit'
  WHEN status = 'Delivered'         THEN 'delivered'
  WHEN status = 'Complete'          THEN 'completed'
  WHEN status = 'Completed'         THEN 'completed'
  WHEN status = 'Cancelled'         THEN 'cancelled'
  WHEN status = 'Rejected'          THEN 'rejected'
  WHEN status = 'Failed Delivery'   THEN 'failed_delivery'
  WHEN status = 'Order Placed'      THEN 'pending'
  WHEN status IS NULL               THEN 'pending'
  ELSE LOWER(status)
END;

ALTER TABLE public.orders ADD CONSTRAINT orders_status_check
  CHECK (status IN (
    'pending',
    'accepted',
    'preparing',
    'ready_for_pickup',
    'pickup_assigned',
    'picked_up',
    'in_transit',
    'delivered',
    'completed',
    'cancelled',
    'rejected',
    'failed_delivery'
  ));

-- ------------------------------------------------------------------------------
-- 6. NON-RECURSIVE SECURITY DEFINER HELPERS (PREVENTS POSTGRES ERROR 42P17)
-- ------------------------------------------------------------------------------

-- Helper 1: Determine if caller is an order party without triggering RLS recursion
CREATE OR REPLACE FUNCTION public.is_order_party(p_order_id TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = p_order_id
      AND (
        o.farmer_id = auth.uid()
        OR COALESCE(o.customer_id, o.buyer_id) = auth.uid()
      )
  )
  OR EXISTS (
    SELECT 1 FROM public.logistics_assignments a
    WHERE a.order_id = p_order_id
      AND a.operator_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public.logistics_trips t
    WHERE t.order_id = p_order_id
      AND t.operator_id = auth.uid()
  );
$$;

-- UUID overload for is_order_party
CREATE OR REPLACE FUNCTION public.is_order_party(p_order_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_order_party(p_order_id::TEXT);
$$;

REVOKE ALL ON FUNCTION public.is_order_party(TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_order_party(TEXT) TO authenticated;
REVOKE ALL ON FUNCTION public.is_order_party(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_order_party(UUID) TO authenticated;

-- Helper 2: Determine if a profile belongs to an order counterparty without recursion
CREATE OR REPLACE FUNCTION public.is_profile_counterparty(p_profile_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.orders o
    WHERE (
      -- 1. Caller is customer/buyer: profile is seller or assigned carrier
      (COALESCE(o.customer_id, o.buyer_id) = auth.uid() AND (
        o.farmer_id = p_profile_id 
        OR EXISTS (SELECT 1 FROM public.logistics_assignments a WHERE a.order_id = o.id AND a.operator_id = p_profile_id)
      ))
      OR
      -- 2. Caller is farmer: profile is buyer or assigned carrier
      (o.farmer_id = auth.uid() AND (
        COALESCE(o.customer_id, o.buyer_id) = p_profile_id
        OR EXISTS (SELECT 1 FROM public.logistics_assignments a WHERE a.order_id = o.id AND a.operator_id = p_profile_id)
      ))
      OR
      -- 3. Caller is assigned driver: profile is buyer or seller
      (
        EXISTS (SELECT 1 FROM public.logistics_assignments a WHERE a.order_id = o.id AND a.operator_id = auth.uid())
        AND (
          COALESCE(o.customer_id, o.buyer_id) = p_profile_id
          OR o.farmer_id = p_profile_id
        )
      )
    )
  );
$$;

REVOKE ALL ON FUNCTION public.is_profile_counterparty(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_profile_counterparty(UUID) TO authenticated;

-- Helper 3: Internal stock restore helper (Trigger / RPC internal use only)
CREATE OR REPLACE FUNCTION public.internal_restore_produce_stock(
  p_listing_id UUID,
  p_quantity NUMERIC
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_listing_id IS NOT NULL AND p_quantity IS NOT NULL AND p_quantity > 0 THEN
    UPDATE public.produce_listings
    SET available_quantity = available_quantity + p_quantity,
        status = CASE WHEN status = 'sold_out' THEN 'active' ELSE status END,
        updated_at = now()
    WHERE id = p_listing_id;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.internal_restore_produce_stock FROM PUBLIC, anon, authenticated;

-- ------------------------------------------------------------------------------
-- 7. NOTIFICATIONS TABLE & REALTIME PUBLICATION
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  data JSONB NOT NULL DEFAULT '{}'::JSONB,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_created 
  ON public.notifications (user_id, created_at DESC);

-- Enable Realtime for notifications
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;
END $$;

-- Internal notify function (SECURITY DEFINER, only called by triggers)
CREATE OR REPLACE FUNCTION public.notify(
  p_user UUID,
  p_type TEXT,
  p_title TEXT,
  p_body TEXT,
  p_data JSONB DEFAULT '{}'::JSONB
)
RETURNS VOID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  INSERT INTO public.notifications (user_id, type, title, body, data)
  VALUES (p_user, p_type, p_title, p_body, p_data);
$$;

REVOKE ALL ON FUNCTION public.notify FROM PUBLIC, anon, authenticated;

-- ------------------------------------------------------------------------------
-- 8. DROP ALL LEGACY RPC SIGNATURES
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (
    SELECT oid::regprocedure AS func_sig
    FROM pg_proc
    WHERE pronamespace = 'public'::regnamespace
      AND proname IN (
        'atomic_checkout_order',
        'farmer_update_order_status',
        'driver_claim_assignment',
        'driver_update_gps',
        'driver_update_delivery_status',
        'consumer_confirm_receipt',
        'consumer_cancel_order',
        'submit_verified_review',
        'set_my_role'
      )
  ) LOOP
    EXECUTE 'DROP FUNCTION IF EXISTS ' || r.func_sig || ' CASCADE';
  END LOOP;
END $$;

-- ------------------------------------------------------------------------------
-- 9. CANONICAL RPC ROUTINES (SECURITY DEFINER + auth.uid() ENFORCED)
-- ------------------------------------------------------------------------------

-- RPC 1: atomic_checkout_order (CREATES logistics_assignments ROW ATOMICALLY)
CREATE OR REPLACE FUNCTION public.atomic_checkout_order(
  p_listing_id UUID,
  p_quantity NUMERIC,
  p_delivery_address TEXT DEFAULT '',
  p_delivery_lat DOUBLE PRECISION DEFAULT NULL,
  p_delivery_lng DOUBLE PRECISION DEFAULT NULL,
  p_payment_method TEXT DEFAULT 'upi',
  p_idempotency_key TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_customer_id UUID;
  v_listing RECORD;
  v_new_available NUMERIC;
  v_new_status TEXT;
  v_unit_price NUMERIC;
  v_total_amount NUMERIC;
  v_platform_fee NUMERIC;
  v_logistics_fee NUMERIC;
  v_farmer_realization NUMERIC;
  v_seq_val BIGINT;
  v_order_number TEXT;
  v_order_id TEXT;
  v_created_order RECORD;
  v_assignment_id UUID;
BEGIN
  -- Caller is ALWAYS auth.uid()
  v_customer_id := auth.uid();
  IF v_customer_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required: User must be signed in to place an order.' USING ERRCODE = '42501';
  END IF;

  IF p_listing_id IS NULL THEN
    RAISE EXCEPTION 'Produce listing ID is required.' USING ERRCODE = '22023';
  END IF;

  IF p_quantity IS NULL OR p_quantity <= 0 THEN
    RAISE EXCEPTION 'Order quantity must be greater than zero. Received: %', p_quantity USING ERRCODE = '22023';
  END IF;

  -- Idempotency check: match on customer_id OR buyer_id
  IF p_idempotency_key IS NOT NULL THEN
    SELECT * INTO v_created_order
    FROM public.orders
    WHERE (customer_id = v_customer_id OR buyer_id = v_customer_id)
      AND listing_id = p_listing_id 
      AND id = p_idempotency_key;

    IF FOUND THEN
      RETURN jsonb_build_object(
        'success', true,
        'order_id', v_created_order.id,
        'order_number', v_created_order.order_number,
        'status', v_created_order.status,
        'note', 'Idempotent duplicate replay',
        'order', to_jsonb(v_created_order)
      );
    END IF;
  END IF;

  -- Row lock on listing to prevent overselling
  SELECT * INTO v_listing
  FROM public.produce_listings
  WHERE id = p_listing_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Produce listing not found: %', p_listing_id USING ERRCODE = 'P0002';
  END IF;

  IF LOWER(v_listing.status) NOT IN ('active') THEN
    RAISE EXCEPTION 'Produce listing is unavailable (Status: %).', v_listing.status USING ERRCODE = '22000';
  END IF;

  IF v_listing.available_quantity < p_quantity THEN
    RAISE EXCEPTION 'Insufficient inventory. Requested: % %, Available: % %',
      p_quantity, v_listing.unit, v_listing.available_quantity, v_listing.unit USING ERRCODE = '22000';
  END IF;

  -- Stock deduction
  v_new_available := v_listing.available_quantity - p_quantity;
  v_new_status := CASE WHEN v_new_available = 0 THEN 'sold_out' ELSE v_listing.status END;

  UPDATE public.produce_listings
  SET available_quantity = v_new_available,
      status = v_new_status,
      updated_at = now()
  WHERE id = p_listing_id;

  -- Authoritative pricing from listing
  v_unit_price := v_listing.price_per_unit;
  v_total_amount := ROUND(p_quantity * v_unit_price, 2);
  v_platform_fee := ROUND(v_total_amount * 0.05, 2);
  v_logistics_fee := ROUND(v_total_amount * 0.08, 2);
  v_farmer_realization := v_total_amount - v_platform_fee - v_logistics_fee;

  v_seq_val := nextval('public.order_seq');
  v_order_number := 'ORD-' || TO_CHAR(now(), 'YYYYMMDD') || '-' || LPAD(v_seq_val::TEXT, 4, '0');
  v_order_id := COALESCE(p_idempotency_key, v_order_number);

  -- Dual-write customer_id & buyer_id for schema consistency
  INSERT INTO public.orders (
    id, order_number, listing_id, customer_id, buyer_id, farmer_id,
    commodity, quantity, quantity_kg, unit_price, total_amount,
    farmer_realization, logistics_fee, platform_fee, status,
    delivery_address, delivery_lat, delivery_lng,
    payment_status, payment_method, created_at, updated_at
  ) VALUES (
    v_order_id, v_order_number, v_listing.id, v_customer_id, v_customer_id, v_listing.farmer_id,
    v_listing.produce_name, p_quantity, p_quantity, v_unit_price, v_total_amount,
    v_farmer_realization, v_logistics_fee, v_platform_fee, 'pending',
    COALESCE(p_delivery_address, 'Market APMC Hub'), p_delivery_lat, p_delivery_lng,
    'pending', LOWER(COALESCE(p_payment_method, 'upi')), now(), now()
  ) RETURNING * INTO v_created_order;

  -- SECURITY DEFINER creates assignment row with operator_id = NULL
  -- Unassigned jobs are visible strictly to VERIFIED drivers in unassigned pool
  INSERT INTO public.logistics_assignments (
    order_id, operator_id,
    pickup_lat, pickup_lng,
    delivery_lat, delivery_lng,
    current_lat, current_lng,
    status, vehicle_number, vehicle_type,
    current_temp, target_temp, humidity, spoilage_risk,
    created_at, updated_at
  ) VALUES (
    v_order_id, NULL,
    COALESCE(v_listing.location_lat, 17.0600), COALESCE(v_listing.location_lng, 78.2000),
    COALESCE(p_delivery_lat, 17.4700), COALESCE(p_delivery_lng, 78.4900),
    COALESCE(v_listing.location_lat, 17.0600), COALESCE(v_listing.location_lng, 78.2000),
    'assigned', 'TS 08 UB 4192', 'Tata 407 Reefer',
    4.5, 4.0, 85, 'low',
    now(), now()
  ) RETURNING id INTO v_assignment_id;

  RETURN jsonb_build_object(
    'success', true,
    'order_id', v_order_id,
    'order_number', v_order_number,
    'status', 'pending',
    'total_amount', v_total_amount,
    'farmer_realization', v_farmer_realization,
    'logistics_fee', v_logistics_fee,
    'platform_fee', v_platform_fee,
    'quantity', p_quantity,
    'available_quantity_remaining', v_new_available,
    'assignment_id', v_assignment_id,
    'order', to_jsonb(v_created_order)
  );
END;
$$;

-- RPC 2: farmer_update_order_status
CREATE OR REPLACE FUNCTION public.farmer_update_order_status(
  p_order_id TEXT,
  p_new_status TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_farmer_id UUID;
  v_order RECORD;
  v_target_status TEXT;
BEGIN
  v_farmer_id := auth.uid();
  IF v_farmer_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required: User must be signed in as a farmer.' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_order
  FROM public.orders
  WHERE id = p_order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found: %', p_order_id USING ERRCODE = 'P0002';
  END IF;

  IF v_order.farmer_id IS NULL OR v_order.farmer_id <> v_farmer_id THEN
    RAISE EXCEPTION 'Unauthorized: Caller is not the seller on this order.' USING ERRCODE = '42501';
  END IF;

  v_target_status := LOWER(TRIM(p_new_status));

  IF v_order.status = v_target_status THEN
    RETURN jsonb_build_object(
      'success', true,
      'order_id', p_order_id,
      'status', v_target_status,
      'note', 'Idempotent replay',
      'order', to_jsonb(v_order)
    );
  END IF;

  -- Farmer allowed lifecycle transitions
  IF v_order.status IN ('pending') AND v_target_status NOT IN ('accepted', 'rejected') THEN
    RAISE EXCEPTION 'Invalid transition: Placed orders can only be accepted or rejected by the farmer.';
  ELSIF v_order.status IN ('accepted') AND v_target_status NOT IN ('preparing') THEN
    RAISE EXCEPTION 'Invalid transition: Accepted orders can only move to preparing.';
  ELSIF v_order.status = 'preparing' AND v_target_status NOT IN ('ready_for_pickup') THEN
    RAISE EXCEPTION 'Invalid transition: Preparing orders can only move to ready_for_pickup.';
  ELSIF v_order.status NOT IN ('pending', 'accepted', 'preparing') THEN
    RAISE EXCEPTION 'Farmer cannot transition orders in status "%".', v_order.status;
  END IF;

  IF v_target_status = 'rejected' THEN
    PERFORM public.internal_restore_produce_stock(v_order.listing_id, v_order.quantity);
  END IF;

  UPDATE public.orders
  SET status = v_target_status,
      updated_at = now()
  WHERE id = p_order_id
  RETURNING * INTO v_order;

  RETURN jsonb_build_object(
    'success', true,
    'order_id', p_order_id,
    'status', v_target_status,
    'payment_status', v_order.payment_status,
    'order', to_jsonb(v_order)
  );
END;
$$;

-- RPC 3: driver_claim_assignment
CREATE OR REPLACE FUNCTION public.driver_claim_assignment(
  p_assignment_id UUID,
  p_vehicle_number TEXT DEFAULT NULL,
  p_vehicle_type TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_operator_id UUID;
  v_assignment RECORD;
  v_is_verified BOOLEAN;
BEGIN
  v_operator_id := auth.uid();
  IF v_operator_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required: Driver must be signed in.' USING ERRCODE = '42501';
  END IF;

  -- Enforce driver verification
  SELECT is_verified INTO v_is_verified
  FROM public.profiles
  WHERE id = v_operator_id;

  IF v_is_verified IS NOT TRUE THEN
    RAISE EXCEPTION 'Verification required: Only verified logistics operators can claim delivery assignments.' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_assignment
  FROM public.logistics_assignments
  WHERE id = p_assignment_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Assignment not found: %', p_assignment_id USING ERRCODE = 'P0002';
  END IF;

  IF v_assignment.operator_id IS NOT NULL AND v_assignment.operator_id <> v_operator_id THEN
    RAISE EXCEPTION 'Assignment already claimed by another driver.' USING ERRCODE = '42501';
  END IF;

  UPDATE public.logistics_assignments
  SET operator_id = v_operator_id,
      status = 'heading_to_pickup',
      vehicle_number = COALESCE(p_vehicle_number, vehicle_number, 'TS 08 UB 4192'),
      vehicle_type = COALESCE(p_vehicle_type, vehicle_type, 'Tata 407 Reefer'),
      updated_at = now()
  WHERE id = p_assignment_id
  RETURNING * INTO v_assignment;

  UPDATE public.orders
  SET status = 'pickup_assigned', updated_at = now()
  WHERE id = v_assignment.order_id;

  RETURN jsonb_build_object(
    'success', true,
    'assignment_id', p_assignment_id,
    'operator_id', v_operator_id,
    'status', 'heading_to_pickup',
    'assignment', to_jsonb(v_assignment)
  );
END;
$$;

-- RPC 4: driver_update_gps
CREATE OR REPLACE FUNCTION public.driver_update_gps(
  p_assignment_id UUID,
  p_lat DOUBLE PRECISION,
  p_lng DOUBLE PRECISION,
  p_current_temp NUMERIC DEFAULT NULL,
  p_humidity NUMERIC DEFAULT NULL,
  p_speed_kmh NUMERIC DEFAULT NULL,
  p_gps_accuracy NUMERIC DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_operator_id UUID;
  v_assignment RECORD;
  v_temp NUMERIC;
  v_target_temp NUMERIC;
  v_spoilage TEXT;
BEGIN
  v_operator_id := auth.uid();
  IF v_operator_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required: Driver must be signed in.' USING ERRCODE = '42501';
  END IF;

  IF p_lat IS NULL OR p_lng IS NULL OR p_lat < -90.0 OR p_lat > 90.0 OR p_lng < -180.0 OR p_lng > 180.0 THEN
    RAISE EXCEPTION 'Invalid GPS coordinates: (%, %)', p_lat, p_lng USING ERRCODE = '22023';
  END IF;

  SELECT * INTO v_assignment
  FROM public.logistics_assignments
  WHERE id = p_assignment_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Assignment not found: %', p_assignment_id USING ERRCODE = 'P0002';
  END IF;

  IF v_assignment.operator_id IS NULL OR v_assignment.operator_id <> v_operator_id THEN
    RAISE EXCEPTION 'Unauthorized: Operator is not assigned to this shipment.' USING ERRCODE = '42501';
  END IF;

  v_temp := COALESCE(p_current_temp, v_assignment.current_temp, 4.5);
  v_target_temp := COALESCE(v_assignment.target_temp, 4.0);

  IF v_temp > (v_target_temp + 4.0) THEN
    v_spoilage := 'high';
  ELSIF v_temp > (v_target_temp + 2.0) THEN
    v_spoilage := 'medium';
  ELSE
    v_spoilage := 'low';
  END IF;

  UPDATE public.logistics_assignments
  SET current_lat = p_lat,
      current_lng = p_lng,
      current_temp = v_temp,
      humidity = COALESCE(p_humidity, humidity),
      spoilage_risk = v_spoilage,
      last_gps_update = now(),
      updated_at = now()
  WHERE id = p_assignment_id
  RETURNING * INTO v_assignment;

  RETURN jsonb_build_object(
    'success', true,
    'assignment_id', p_assignment_id,
    'order_id', v_assignment.order_id,
    'current_lat', p_lat,
    'current_lng', p_lng,
    'current_temp', v_temp,
    'spoilage_risk', v_spoilage,
    'last_gps_update', now()
  );
END;
$$;

-- RPC 5: driver_update_delivery_status (Mandates proof photo when delivered)
CREATE OR REPLACE FUNCTION public.driver_update_delivery_status(
  p_assignment_id UUID,
  p_new_status TEXT,
  p_proof_photo_path TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_operator_id UUID;
  v_assignment RECORD;
  v_target_status TEXT;
  v_order_status TEXT;
BEGIN
  v_operator_id := auth.uid();
  IF v_operator_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required: Driver must be signed in.' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_assignment
  FROM public.logistics_assignments
  WHERE id = p_assignment_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Assignment not found: %', p_assignment_id USING ERRCODE = 'P0002';
  END IF;

  IF v_assignment.operator_id IS NULL OR v_assignment.operator_id <> v_operator_id THEN
    RAISE EXCEPTION 'Unauthorized: Caller is not the assigned operator for this shipment.' USING ERRCODE = '42501';
  END IF;

  v_target_status := LOWER(TRIM(p_new_status));

  -- MANDATORY DELIVERY PROOF CHECK
  IF v_target_status = 'delivered' THEN
    IF p_proof_photo_path IS NULL OR TRIM(p_proof_photo_path) = '' THEN
      RAISE EXCEPTION 'Proof of delivery photo is required before marking assignment as delivered.' USING ERRCODE = '22000';
    END IF;
  END IF;

  CASE v_target_status
    WHEN 'picked_up' THEN v_order_status := 'picked_up';
    WHEN 'in_transit' THEN v_order_status := 'in_transit';
    WHEN 'delivered' THEN v_order_status := 'delivered';
    WHEN 'failed_delivery' THEN v_order_status := 'failed_delivery';
    ELSE v_order_status := v_target_status;
  END CASE;

  UPDATE public.logistics_assignments
  SET status = v_target_status,
      proof_photo_path = COALESCE(p_proof_photo_path, proof_photo_path),
      updated_at = now()
  WHERE id = p_assignment_id
  RETURNING * INTO v_assignment;

  UPDATE public.orders
  SET status = v_order_status,
      updated_at = now()
  WHERE id = v_assignment.order_id;

  RETURN jsonb_build_object(
    'success', true,
    'assignment_id', p_assignment_id,
    'status', v_target_status,
    'order_id', v_assignment.order_id,
    'order_status', v_order_status,
    'proof_photo_path', v_assignment.proof_photo_path
  );
END;
$$;

-- RPC 6: consumer_confirm_receipt
CREATE OR REPLACE FUNCTION public.consumer_confirm_receipt(
  p_order_id TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_customer_id UUID;
  v_order RECORD;
BEGIN
  v_customer_id := auth.uid();
  IF v_customer_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required: User must be signed in to confirm receipt.' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_order
  FROM public.orders
  WHERE id = p_order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found: %', p_order_id USING ERRCODE = 'P0002';
  END IF;

  IF COALESCE(v_order.customer_id, v_order.buyer_id) IS NULL OR COALESCE(v_order.customer_id, v_order.buyer_id) <> v_customer_id THEN
    RAISE EXCEPTION 'Unauthorized: Caller is not the buyer for this order.' USING ERRCODE = '42501';
  END IF;

  IF v_order.status NOT IN ('delivered', 'in_transit') THEN
    RAISE EXCEPTION 'Cannot complete order: Current status is "%". Must be delivered.', v_order.status;
  END IF;

  UPDATE public.orders
  SET status = 'completed',
      payment_status = 'released_to_farmer',
      updated_at = now()
  WHERE id = p_order_id
  RETURNING * INTO v_order;

  RETURN jsonb_build_object(
    'success', true,
    'order_id', p_order_id,
    'status', 'completed',
    'payment_status', 'released_to_farmer',
    'order', to_jsonb(v_order)
  );
END;
$$;

-- RPC 7: consumer_cancel_order
CREATE OR REPLACE FUNCTION public.consumer_cancel_order(
  p_order_id TEXT,
  p_reason TEXT DEFAULT ''
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_customer_id UUID;
  v_order RECORD;
BEGIN
  v_customer_id := auth.uid();
  IF v_customer_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required: User must be signed in to cancel.' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_order
  FROM public.orders
  WHERE id = p_order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found: %', p_order_id USING ERRCODE = 'P0002';
  END IF;

  IF COALESCE(v_order.customer_id, v_order.buyer_id) IS NULL OR COALESCE(v_order.customer_id, v_order.buyer_id) <> v_customer_id THEN
    RAISE EXCEPTION 'Unauthorized: Caller does not own this order.' USING ERRCODE = '42501';
  END IF;

  IF v_order.status = 'cancelled' THEN
    RETURN jsonb_build_object(
      'success', true,
      'order_id', p_order_id,
      'status', 'cancelled',
      'note', 'Idempotent replay',
      'order', to_jsonb(v_order)
    );
  END IF;

  IF v_order.status NOT IN ('pending', 'accepted') THEN
    RAISE EXCEPTION 'Cancellation denied: Order is in status "%". Cancellations are permitted only before farmer preparation begins.', v_order.status;
  END IF;

  PERFORM public.internal_restore_produce_stock(v_order.listing_id, v_order.quantity);

  UPDATE public.orders
  SET status = 'cancelled',
      payment_status = 'refunded',
      updated_at = now()
  WHERE id = p_order_id
  RETURNING * INTO v_order;

  UPDATE public.logistics_assignments
  SET status = 'cancelled',
      updated_at = now()
  WHERE order_id = p_order_id;

  RETURN jsonb_build_object(
    'success', true,
    'order_id', p_order_id,
    'status', 'cancelled',
    'payment_status', 'refunded',
    'order', to_jsonb(v_order)
  );
END;
$$;

-- RPC 8: submit_verified_review (Only way reviews are authored)
CREATE OR REPLACE FUNCTION public.submit_verified_review(
  p_order_id TEXT,
  p_reviewee_id UUID,
  p_rating INTEGER,
  p_comment TEXT DEFAULT NULL,
  p_role_perspective TEXT DEFAULT 'consumer_to_farmer',
  p_category_ratings JSONB DEFAULT '{}'::JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_reviewer_id UUID;
  v_order RECORD;
  v_review_id UUID;
BEGIN
  v_reviewer_id := auth.uid();
  IF v_reviewer_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required.' USING ERRCODE = '42501';
  END IF;

  IF p_rating < 1 OR p_rating > 5 THEN
    RAISE EXCEPTION 'Rating must be between 1 and 5.' USING ERRCODE = '22023';
  END IF;

  IF v_reviewer_id = p_reviewee_id THEN
    RAISE EXCEPTION 'Cannot rate yourself.' USING ERRCODE = '22023';
  END IF;

  SELECT * INTO v_order
  FROM public.orders
  WHERE id = p_order_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Referenced order not found: %', p_order_id USING ERRCODE = 'P0002';
  END IF;

  -- Ensure caller was buyer or farmer on this order
  IF COALESCE(v_order.customer_id, v_order.buyer_id) <> v_reviewer_id AND v_order.farmer_id <> v_reviewer_id THEN
    RAISE EXCEPTION 'Unauthorized: Caller was not a participant in this order.' USING ERRCODE = '42501';
  END IF;

  INSERT INTO public.reviews (
    order_id, reviewer_id, reviewee_id, rating, comment,
    role_perspective, category_ratings, is_verified, moderation_status
  ) VALUES (
    p_order_id, v_reviewer_id, p_reviewee_id, p_rating, p_comment,
    p_role_perspective, p_category_ratings, true, 'PUBLISHED'
  )
  ON CONFLICT (order_id, reviewer_id, reviewee_id)
  DO UPDATE SET
    rating = EXCLUDED.rating,
    comment = EXCLUDED.comment,
    category_ratings = EXCLUDED.category_ratings,
    updated_at = now()
  RETURNING id INTO v_review_id;

  RETURN jsonb_build_object(
    'success', true,
    'review_id', v_review_id,
    'rating', p_rating
  );
END;
$$;

-- RPC 9: set_my_role (Allows brand-new signup to choose farmer/consumer/logistics)
CREATE OR REPLACE FUNCTION public.set_my_role(
  p_role TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_normalized_role TEXT;
  v_existing_role TEXT;
  v_created_at TIMESTAMPTZ;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required.' USING ERRCODE = '42501';
  END IF;

  v_normalized_role := LOWER(TRIM(p_role));
  IF v_normalized_role NOT IN ('farmer', 'consumer', 'logistics') THEN
    RAISE EXCEPTION 'Invalid role: "%". Allowed roles are farmer, consumer, logistics.', p_role USING ERRCODE = '22023';
  END IF;

  SELECT role, created_at INTO v_existing_role, v_created_at
  FROM public.profiles
  WHERE id = v_user_id;

  -- Allow choosing role if currently unset/empty, or within 15 minutes of profile creation
  IF v_existing_role IS NOT NULL AND v_existing_role <> '' AND v_existing_role <> v_normalized_role THEN
    IF v_created_at IS NOT NULL AND (now() - v_created_at) > INTERVAL '15 minutes' THEN
      RAISE EXCEPTION 'Role is already assigned to "%" and cannot be modified directly.', v_existing_role USING ERRCODE = '42501';
    END IF;
  END IF;

  UPDATE public.profiles
  SET role = v_normalized_role,
      updated_at = now()
  WHERE id = v_user_id;

  RETURN jsonb_build_object(
    'success', true,
    'user_id', v_user_id,
    'role', v_normalized_role
  );
END;
$$;

-- Grant EXECUTE to authenticated, revoke from anon/public
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_order_party(TEXT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_order_party(UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_profile_counterparty(UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.set_my_role(TEXT) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.is_order_party(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_order_party(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_profile_counterparty(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.atomic_checkout_order(UUID, NUMERIC, TEXT, DOUBLE PRECISION, DOUBLE PRECISION, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.farmer_update_order_status(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.driver_claim_assignment(UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.driver_update_gps(UUID, DOUBLE PRECISION, DOUBLE PRECISION, NUMERIC, NUMERIC, NUMERIC, NUMERIC) TO authenticated;
GRANT EXECUTE ON FUNCTION public.driver_update_delivery_status(UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.consumer_confirm_receipt(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.consumer_cancel_order(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.submit_verified_review(TEXT, UUID, INTEGER, TEXT, TEXT, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_my_role(TEXT) TO authenticated;

-- ------------------------------------------------------------------------------
-- 10. STORAGE BUCKETS & STORAGE RLS POLICIES
-- ------------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('produce-images', 'produce-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

INSERT INTO storage.buckets (id, name, public)
VALUES ('delivery-proofs', 'delivery-proofs', false)
ON CONFLICT (id) DO UPDATE SET public = false;

DROP POLICY IF EXISTS "Public access to produce images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users upload produce images" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read produce-images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users upload to own folder" ON storage.objects;
DROP POLICY IF EXISTS "Driver upload delivery proof" ON storage.objects;
DROP POLICY IF EXISTS "Driver view delivery proof" ON storage.objects;

-- Produce images (Public read, authenticated uploads to auth.uid() folder)
CREATE POLICY "Allow public read produce-images" ON storage.objects
  FOR SELECT USING (bucket_id = 'produce-images');

CREATE POLICY "Authenticated users upload to own folder" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'produce-images' 
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Delivery proofs (Private, drivers upload, parties view)
CREATE POLICY "Driver upload delivery proof" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'delivery-proofs' 
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Driver view delivery proof" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'delivery-proofs'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR EXISTS (
        SELECT 1 FROM public.orders o
        JOIN public.logistics_assignments a ON a.order_id = o.id
        WHERE a.proof_photo_path LIKE '%' || name || '%'
          AND (o.customer_id = auth.uid() OR o.buyer_id = auth.uid() OR o.farmer_id = auth.uid())
      )
    )
  );

-- ------------------------------------------------------------------------------
-- 11. NOTIFICATION TRIGGERS
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.trg_notify_order_events()
RETURNS TRIGGER AS $$
DECLARE
  v_buyer_id UUID;
  v_farmer_id UUID;
  v_commodity TEXT;
BEGIN
  v_buyer_id := COALESCE(NEW.customer_id, NEW.buyer_id);
  v_farmer_id := NEW.farmer_id;
  v_commodity := COALESCE(NEW.commodity, 'produce');

  IF TG_OP = 'INSERT' THEN
    IF v_farmer_id IS NOT NULL THEN
      PERFORM public.notify(
        v_farmer_id,
        'order_placed',
        'New Order Received! 🛒',
        'New order #' || NEW.id || ' placed for ' || NEW.quantity || ' ' || v_commodity || '.',
        jsonb_build_object('order_id', NEW.id, 'status', NEW.status, 'amount', NEW.total_amount)
      );
    END IF;
  ELSIF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    IF v_buyer_id IS NOT NULL THEN
      PERFORM public.notify(
        v_buyer_id,
        'order_status_' || NEW.status,
        'Order Update: ' || UPPER(SUBSTRING(NEW.status, 1, 1)) || SUBSTRING(NEW.status, 2),
        'Your order #' || NEW.id || ' is now ' || REPLACE(NEW.status, '_', ' ') || '.',
        jsonb_build_object('order_id', NEW.id, 'status', NEW.status)
      );
    END IF;
    IF v_farmer_id IS NOT NULL AND NEW.status IN ('pickup_assigned', 'picked_up', 'in_transit', 'delivered', 'completed', 'cancelled') THEN
      PERFORM public.notify(
        v_farmer_id,
        'order_status_' || NEW.status,
        'Order #' || NEW.id || ' Status: ' || UPPER(SUBSTRING(NEW.status, 1, 1)) || SUBSTRING(NEW.status, 2),
        'Order #' || NEW.id || ' status progressed to ' || REPLACE(NEW.status, '_', ' ') || '.',
        jsonb_build_object('order_id', NEW.id, 'status', NEW.status)
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_notify_order_events ON public.orders;
CREATE TRIGGER trg_notify_order_events
  AFTER INSERT OR UPDATE OF status ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_notify_order_events();

CREATE OR REPLACE FUNCTION public.trg_notify_consumers_on_listing()
RETURNS TRIGGER AS $$
DECLARE
  v_consumer RECORD;
  v_target_district TEXT;
BEGIN
  v_target_district := NEW.district;
  IF v_target_district IS NULL AND NEW.farmer_id IS NOT NULL THEN
    SELECT district INTO v_target_district FROM public.profiles WHERE id = NEW.farmer_id;
  END IF;

  IF v_target_district IS NOT NULL THEN
    FOR v_consumer IN
      SELECT id FROM public.profiles
      WHERE role = 'consumer' AND district = v_target_district AND id <> NEW.farmer_id
      LIMIT 100
    LOOP
      PERFORM public.notify(
        v_consumer.id,
        'new_listing',
        'Fresh Harvest in ' || v_target_district || '! 🌾',
        NEW.produce_name || ' just listed at ₹' || NEW.price_per_unit || '/' || NEW.unit || '.',
        jsonb_build_object('listing_id', NEW.id, 'produce_name', NEW.produce_name, 'district', v_target_district)
      );
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_notify_listing_insert ON public.produce_listings;
CREATE TRIGGER trg_notify_listing_insert
  AFTER INSERT ON public.produce_listings
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_notify_consumers_on_listing();

-- ------------------------------------------------------------------------------
-- 12. ROW LEVEL SECURITY (RLS) ON EVERY PUBLIC TABLE (NON-RECURSIVE)
-- ------------------------------------------------------------------------------

-- ==============================================================================
-- TABLE 1: profiles
-- Column-level grants ensure role and wallet_balance are NEVER client-writable.
-- User can read own profile OR counterparties from active/historical orders.
-- ==============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public profiles read" ON public.profiles;
DROP POLICY IF EXISTS "Users update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_authenticated" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete_own" ON public.profiles;

-- 1. Revoke table-level mutation privileges from authenticated
REVOKE INSERT, UPDATE, DELETE ON TABLE public.profiles FROM authenticated;

-- 2. Grant column-level INSERT on safe columns only (role & wallet_balance are NEVER client-writable)
GRANT INSERT (id, full_name, phone, language, state, district, place, village_or_area, area, username, email, fpo_name)
  ON TABLE public.profiles TO authenticated;

-- 3. Grant column-level UPDATE on safe columns only (role & wallet_balance are NEVER client-writable)
GRANT UPDATE (full_name, phone, language, state, district, place, village_or_area, area, username, email, fpo_name, updated_at)
  ON TABLE public.profiles TO authenticated;

-- 4. RLS policies enforce ownership on the permitted columns
CREATE POLICY "profiles_select_policy" ON public.profiles
  FOR SELECT TO authenticated
  USING (
    id = auth.uid() 
    OR public.is_profile_counterparty(id)
  );

CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());

CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "profiles_delete_own" ON public.profiles
  FOR DELETE TO authenticated
  USING (id = auth.uid());

-- ==============================================================================
-- TABLE 2: orders
-- SELECT uses SECURITY DEFINER is_order_party() (NO RECURSION).
-- Direct client INSERT / UPDATE / DELETE are strictly BLOCKED (mutations via RPC).
-- ==============================================================================
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Participants view orders" ON public.orders;
DROP POLICY IF EXISTS "No direct order client insert" ON public.orders;
DROP POLICY IF EXISTS "No direct order client delete" ON public.orders;
DROP POLICY IF EXISTS "orders_select_policy" ON public.orders;
DROP POLICY IF EXISTS "orders_insert_blocked" ON public.orders;
DROP POLICY IF EXISTS "orders_update_blocked" ON public.orders;
DROP POLICY IF EXISTS "orders_delete_blocked" ON public.orders;

CREATE POLICY "orders_select_policy" ON public.orders
  FOR SELECT TO authenticated
  USING (public.is_order_party(id));

CREATE POLICY "orders_insert_blocked" ON public.orders
  FOR INSERT TO authenticated
  WITH CHECK (false);

CREATE POLICY "orders_update_blocked" ON public.orders
  FOR UPDATE TO authenticated
  USING (false);

CREATE POLICY "orders_delete_blocked" ON public.orders
  FOR DELETE TO authenticated
  USING (false);

-- ==============================================================================
-- TABLE 3: produce_listings
-- Active listings visible to authenticated users; draft/sold-out visible only to farmer.
-- UPDATE includes WITH CHECK (farmer_id = auth.uid()).
-- Anonymous visitors access exclusively through public_produce_catalog view.
-- ==============================================================================
ALTER TABLE public.produce_listings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Active listings public read" ON public.produce_listings;
DROP POLICY IF EXISTS "Farmers insert own listings" ON public.produce_listings;
DROP POLICY IF EXISTS "Farmers update own listings" ON public.produce_listings;
DROP POLICY IF EXISTS "Farmers delete own listings" ON public.produce_listings;
DROP POLICY IF EXISTS "produce_listings_select" ON public.produce_listings;
DROP POLICY IF EXISTS "produce_listings_insert" ON public.produce_listings;
DROP POLICY IF EXISTS "produce_listings_update" ON public.produce_listings;
DROP POLICY IF EXISTS "produce_listings_delete" ON public.produce_listings;

CREATE POLICY "produce_listings_select" ON public.produce_listings
  FOR SELECT TO authenticated
  USING (status = 'active' OR auth.uid() = farmer_id);

CREATE POLICY "produce_listings_insert" ON public.produce_listings
  FOR INSERT TO authenticated
  WITH CHECK (farmer_id = auth.uid());

CREATE POLICY "produce_listings_update" ON public.produce_listings
  FOR UPDATE TO authenticated
  USING (farmer_id = auth.uid())
  WITH CHECK (farmer_id = auth.uid());

CREATE POLICY "produce_listings_delete" ON public.produce_listings
  FOR DELETE TO authenticated
  USING (farmer_id = auth.uid());

-- ==============================================================================
-- TABLE 4: logistics_assignments
-- SELECT uses is_order_party() (NO RECURSION).
-- Unassigned jobs are visible strictly to VERIFIED logistics operators (is_verified = true).
-- Direct client INSERT / UPDATE / DELETE are strictly BLOCKED (RPC-only).
-- ==============================================================================
ALTER TABLE public.logistics_assignments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Participants view assignments" ON public.logistics_assignments;
DROP POLICY IF EXISTS "logistics_assignments_select" ON public.logistics_assignments;
DROP POLICY IF EXISTS "logistics_assignments_update" ON public.logistics_assignments;
DROP POLICY IF EXISTS "logistics_assignments_insert" ON public.logistics_assignments;
DROP POLICY IF EXISTS "logistics_assignments_delete" ON public.logistics_assignments;
DROP POLICY IF EXISTS "logistics_assignments_update_blocked" ON public.logistics_assignments;
DROP POLICY IF EXISTS "logistics_assignments_insert_blocked" ON public.logistics_assignments;
DROP POLICY IF EXISTS "logistics_assignments_delete_blocked" ON public.logistics_assignments;

CREATE POLICY "logistics_assignments_select" ON public.logistics_assignments
  FOR SELECT TO authenticated
  USING (
    operator_id = auth.uid()
    OR (
      operator_id IS NULL 
      AND EXISTS (
        SELECT 1 FROM public.profiles p 
        WHERE p.id = auth.uid() 
          AND p.role IN ('logistics', 'logistics_operator', 'driver')
          AND p.is_verified = true
      )
    )
    OR public.is_order_party(order_id)
  );

CREATE POLICY "logistics_assignments_insert_blocked" ON public.logistics_assignments
  FOR INSERT TO authenticated
  WITH CHECK (false);

CREATE POLICY "logistics_assignments_update_blocked" ON public.logistics_assignments
  FOR UPDATE TO authenticated
  USING (false);

CREATE POLICY "logistics_assignments_delete_blocked" ON public.logistics_assignments
  FOR DELETE TO authenticated
  USING (false);

-- ==============================================================================
-- TABLE 5: logistics_trips
-- Direct client mutations blocked; queries restricted to assigned driver and order parties.
-- ==============================================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'logistics_trips') THEN
    ALTER TABLE public.logistics_trips ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "logistics_trips_select" ON public.logistics_trips;
    DROP POLICY IF EXISTS "logistics_trips_update" ON public.logistics_trips;
    DROP POLICY IF EXISTS "logistics_trips_insert" ON public.logistics_trips;
    DROP POLICY IF EXISTS "logistics_trips_delete" ON public.logistics_trips;
    DROP POLICY IF EXISTS "logistics_trips_update_blocked" ON public.logistics_trips;
    DROP POLICY IF EXISTS "logistics_trips_insert_blocked" ON public.logistics_trips;
    DROP POLICY IF EXISTS "logistics_trips_delete_blocked" ON public.logistics_trips;

    CREATE POLICY "logistics_trips_select" ON public.logistics_trips
      FOR SELECT TO authenticated
      USING (
        operator_id = auth.uid()
        OR public.is_order_party(order_id)
      );

    CREATE POLICY "logistics_trips_insert_blocked" ON public.logistics_trips
      FOR INSERT TO authenticated
      WITH CHECK (false);

    CREATE POLICY "logistics_trips_update_blocked" ON public.logistics_trips
      FOR UPDATE TO authenticated
      USING (false);

    CREATE POLICY "logistics_trips_delete_blocked" ON public.logistics_trips
      FOR DELETE TO authenticated
      USING (false);
  END IF;
END $$;

-- ==============================================================================
-- TABLE 6: notifications
-- Users view, mark read, or delete only their own notifications.
-- Direct client INSERT is blocked (triggers only).
-- ==============================================================================
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "read own" ON public.notifications;
DROP POLICY IF EXISTS "mark own read" ON public.notifications;
DROP POLICY IF EXISTS "notifications_select" ON public.notifications;
DROP POLICY IF EXISTS "notifications_update" ON public.notifications;
DROP POLICY IF EXISTS "notifications_insert_blocked" ON public.notifications;
DROP POLICY IF EXISTS "notifications_delete" ON public.notifications;

CREATE POLICY "notifications_select" ON public.notifications
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "notifications_update" ON public.notifications
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

REVOKE UPDATE ON public.notifications FROM authenticated;
GRANT UPDATE (read_at) ON public.notifications TO authenticated;

CREATE POLICY "notifications_insert_blocked" ON public.notifications
  FOR INSERT TO authenticated
  WITH CHECK (false);

CREATE POLICY "notifications_delete" ON public.notifications
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- ==============================================================================
-- TABLE 7: reviews
-- Published reviews are public; draft/moderated visible only to reviewer.
-- Direct INSERT and UPDATE are strictly BLOCKED (RPC submit_verified_review only).
-- ==============================================================================
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Published reviews public read" ON public.reviews;
DROP POLICY IF EXISTS "Reviewers create reviews" ON public.reviews;
DROP POLICY IF EXISTS "reviews_select" ON public.reviews;
DROP POLICY IF EXISTS "reviews_insert" ON public.reviews;
DROP POLICY IF EXISTS "reviews_update" ON public.reviews;
DROP POLICY IF EXISTS "reviews_delete" ON public.reviews;
DROP POLICY IF EXISTS "reviews_insert_blocked" ON public.reviews;
DROP POLICY IF EXISTS "reviews_update_blocked" ON public.reviews;

CREATE POLICY "reviews_select" ON public.reviews
  FOR SELECT
  USING (moderation_status = 'PUBLISHED' OR reviewer_id = auth.uid());

CREATE POLICY "reviews_insert_blocked" ON public.reviews
  FOR INSERT TO authenticated
  WITH CHECK (false);

CREATE POLICY "reviews_update_blocked" ON public.reviews
  FOR UPDATE TO authenticated
  USING (false);

CREATE POLICY "reviews_delete" ON public.reviews
  FOR DELETE TO authenticated
  USING (reviewer_id = auth.uid());

-- ==============================================================================
-- TABLE 8: ratings
-- Direct client INSERT / UPDATE blocked; aggregate public read.
-- ==============================================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'ratings') THEN
    ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "ratings_select" ON public.ratings;
    DROP POLICY IF EXISTS "ratings_insert" ON public.ratings;
    DROP POLICY IF EXISTS "ratings_update" ON public.ratings;
    DROP POLICY IF EXISTS "ratings_insert_blocked" ON public.ratings;
    DROP POLICY IF EXISTS "ratings_update_blocked" ON public.ratings;
    DROP POLICY IF EXISTS "ratings_delete_blocked" ON public.ratings;

    CREATE POLICY "ratings_select" ON public.ratings
      FOR SELECT
      USING (true);

    CREATE POLICY "ratings_insert_blocked" ON public.ratings
      FOR INSERT TO authenticated
      WITH CHECK (false);

    CREATE POLICY "ratings_update_blocked" ON public.ratings
      FOR UPDATE TO authenticated
      USING (false);

    CREATE POLICY "ratings_delete_blocked" ON public.ratings
      FOR DELETE TO authenticated
      USING (false);
  END IF;
END $$;

-- ==============================================================================
-- TABLE 9: produce (legacy table protection)
-- ==============================================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'produce') THEN
    ALTER TABLE public.produce ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "produce_select_policy" ON public.produce;
    DROP POLICY IF EXISTS "produce_write_blocked" ON public.produce;

    CREATE POLICY "produce_select_policy" ON public.produce
      FOR SELECT TO authenticated
      USING (farmer_id = auth.uid() OR user_id = auth.uid()::text);

    CREATE POLICY "produce_write_blocked" ON public.produce
      FOR ALL TO authenticated
      USING (false);
  END IF;
END $$;

-- ------------------------------------------------------------------------------
-- 13. PRIVACY-PRESERVING PUBLIC VIEWS
-- ------------------------------------------------------------------------------

-- View 1: public_profiles
-- Farmers only, minimal columns (no phone, email, address, role, wallet_balance, or timestamps).
DROP VIEW IF EXISTS public.public_profiles;
CREATE VIEW public.public_profiles AS
SELECT 
  id,
  full_name,
  district,
  state,
  fpo_name
FROM public.profiles
WHERE role = 'farmer';

GRANT SELECT ON public.public_profiles TO anon, authenticated;

-- View 2: public_produce_catalog
-- Exposes active marketplace listings with district/state level location only.
-- Real data only; zero fabricated COALESCE fallback defaults ('Telangana', 'Regional Hub' removed).
-- Exact address/coordinates are never exposed to anonymous catalog visitors.
DROP VIEW IF EXISTS public.public_produce_catalog;
CREATE VIEW public.public_produce_catalog AS
SELECT 
  id,
  farmer_id,
  produce_name,
  variety,
  category,
  total_quantity,
  available_quantity,
  price_per_unit,
  unit,
  harvest_date,
  quality_grade,
  shelf_life_days,
  district,
  state,
  images,
  status,
  created_at,
  updated_at
FROM public.produce_listings
WHERE status = 'active';

GRANT SELECT ON public.public_produce_catalog TO anon, authenticated;

-- View 3: unassigned_logistics_pool
-- Available ONLY to verified logistics operators (profiles.is_verified = true).
-- Exposes strictly: assignment_id, pickup district/state, produce commodity, weight, target temp.
-- Full delivery address and buyer details remain hidden until claimed via driver_claim_assignment.
DROP VIEW IF EXISTS public.unassigned_logistics_pool;
CREATE VIEW public.unassigned_logistics_pool AS
SELECT 
  la.id AS assignment_id,
  la.order_id,
  o.commodity,
  COALESCE(o.quantity_kg, o.quantity) AS weight_kg,
  COALESCE(pl.district, split_part(pl.location_address, ',', 1)) AS pickup_district,
  COALESCE(pl.state, split_part(pl.location_address, ',', 2)) AS pickup_state,
  COALESCE(split_part(o.delivery_address, ',', 2), 'Regional Hub') AS delivery_district,
  la.target_temp,
  la.status,
  la.created_at
FROM public.logistics_assignments la
JOIN public.orders o ON o.id = la.order_id
LEFT JOIN public.produce_listings pl ON pl.id = o.listing_id
WHERE la.operator_id IS NULL
  AND la.status = 'assigned'
  AND EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.role IN ('logistics', 'logistics_operator', 'driver')
      AND p.is_verified = true
  );

GRANT SELECT ON public.unassigned_logistics_pool TO authenticated;

-- ------------------------------------------------------------------------------
-- 14. CLEANUP AUDIT TEST ROWS & ZERO-UUID LISTINGS
-- ------------------------------------------------------------------------------
DELETE FROM public.logistics_assignments WHERE order_id LIKE 'TEST-%';
DELETE FROM public.orders WHERE id LIKE 'TEST-%';
DELETE FROM public.produce_listings WHERE id::text LIKE '00000000-0000-0000-0000-%' OR produce_name LIKE 'TEST-%';

-- ------------------------------------------------------------------------------
-- 15. RELOAD SCHEMA CACHE
-- ------------------------------------------------------------------------------
NOTIFY pgrst, 'reload schema';
