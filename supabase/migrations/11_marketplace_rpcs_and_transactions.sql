-- ==============================================================================
-- AgriFlow.ai: Migration 11 - Marketplace RPCs & ACID Transactions
-- File: supabase/migrations/11_marketplace_rpcs_and_transactions.sql
-- 
-- Summary:
--   1. Sequence for human-readable order numbers (ORD-YYYYMMDD-XXXX)
--   2. Authoritative Centralized Stock Release Helper (internal_restore_produce_stock)
--   3. atomic_checkout_order: Single-transaction row-locked stock deduction, fee calculation, order creation
--   4. farmer_update_order_status: Order lifecycle progression & stock refund on rejection
--   5. driver_claim_assignment: Concurrency-safe pickup assignment claim
--   6. driver_update_gps: Real phone GPS ingestion, reefer telemetry & high-temp alerts
--   7. driver_update_delivery_status: Idempotent logistics progression & delivery settlement
--   8. consumer_cancel_order: Consumer cancellation & single-source stock restoration
--   9. submit_verified_review: Post-delivery verified review submission & deduplication
--  10. reconcile_listing_stock: Protected administrative stock reconciliation routine
--  11. Strict Execution Grants (anon revoked, authenticated only for client RPCs, service_role for internal)
--
-- Phase 6 Technical Debt Checklist:
--   [ ] Review whether delivered should release escrow immediately, or whether a completed/customer-confirmed state should gate release.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. ORDER SEQUENCE SETUP
-- ------------------------------------------------------------------------------
CREATE SEQUENCE IF NOT EXISTS public.order_seq START 1000;

-- ------------------------------------------------------------------------------
-- 2. CENTRALIZED AUTHORITATIVE STOCK RELEASE ROUTINE
-- ------------------------------------------------------------------------------
-- Internal database routine. Revoked from PUBLIC/anon/authenticated.
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
  IF p_listing_id IS NOT NULL AND p_quantity > 0 THEN
    UPDATE public.produce_listings
    SET available_quantity = LEAST(total_quantity, available_quantity + p_quantity),
        status = 'active',
        updated_at = now()
    WHERE id = p_listing_id;
  END IF;
END;
$$;

-- ------------------------------------------------------------------------------
-- 3. ATOMIC CHECKOUT ORDER
-- ------------------------------------------------------------------------------
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
  -- 1. Strict Authentication Enforcement (No production fallback)
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

  -- 2. Idempotency Guard (Check by idempotency key)
  IF p_idempotency_key IS NOT NULL THEN
    SELECT * INTO v_created_order
    FROM public.orders
    WHERE customer_id = v_customer_id 
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

  -- 3. Row-Level Lock on Specific Listing (Transaction-Safe Concurrency)
  SELECT * INTO v_listing
  FROM public.produce_listings
  WHERE id = p_listing_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Produce listing not found: %', p_listing_id USING ERRCODE = 'P0002';
  END IF;

  -- 4. Stock Invariant Verification
  IF LOWER(v_listing.status) NOT IN ('active') THEN
    RAISE EXCEPTION 'Produce listing is currently unavailable (Status: %).', v_listing.status USING ERRCODE = '22000';
  END IF;

  IF v_listing.available_quantity < p_quantity THEN
    RAISE EXCEPTION 'Insufficient inventory. Requested: % %, Available: % %',
      p_quantity, v_listing.unit, v_listing.available_quantity, v_listing.unit USING ERRCODE = '22000';
  END IF;

  -- 5. Atomic Stock Deduction
  v_new_available := v_listing.available_quantity - p_quantity;
  v_new_status := CASE WHEN v_new_available = 0 THEN 'sold_out' ELSE v_listing.status END;

  UPDATE public.produce_listings
  SET available_quantity = v_new_available,
      status = v_new_status,
      updated_at = now()
  WHERE id = p_listing_id;

  -- 6. Fee Calculations (5% Platform Fee, 8% Logistics Fee)
  v_unit_price := v_listing.price_per_unit;
  v_total_amount := ROUND(p_quantity * v_unit_price, 2);
  v_platform_fee := ROUND(v_total_amount * 0.05, 2);
  v_logistics_fee := ROUND(v_total_amount * 0.08, 2);
  v_farmer_realization := v_total_amount - v_platform_fee - v_logistics_fee;

  -- 7. Sequential Order Number Generation
  v_seq_val := nextval('public.order_seq');
  v_order_number := 'ORD-' || TO_CHAR(now(), 'YYYYMMDD') || '-' || LPAD(v_seq_val::TEXT, 4, '0');
  v_order_id := COALESCE(p_idempotency_key, v_order_number);

  -- 8. Order Record Creation
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

  -- 9. Auto-create Logistics Assignment in Queue (operator_id initially NULL until claimed)
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

  -- 10. Return Structured Order JSON
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

-- ------------------------------------------------------------------------------
-- 4. FARMER UPDATE ORDER STATUS
-- ------------------------------------------------------------------------------
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
  -- 1. Strict Authentication Enforcement
  v_farmer_id := auth.uid();
  IF v_farmer_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required: User must be signed in as a farmer.' USING ERRCODE = '42501';
  END IF;

  -- 2. Locate and lock order row
  SELECT * INTO v_order
  FROM public.orders
  WHERE id = p_order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found: %', p_order_id USING ERRCODE = 'P0002';
  END IF;

  -- 3. Ownership Validation
  IF v_order.farmer_id IS NOT NULL AND v_order.farmer_id <> v_farmer_id THEN
    RAISE EXCEPTION 'Unauthorized: Farmer does not own this order.' USING ERRCODE = '42501';
  END IF;

  v_target_status := LOWER(TRIM(p_new_status));

  -- 4. Idempotency Guard
  IF v_order.status = v_target_status THEN
    RETURN jsonb_build_object(
      'success', true,
      'order_id', p_order_id,
      'status', v_target_status,
      'note', 'Idempotent replay: Status already matches target',
      'order', to_jsonb(v_order)
    );
  END IF;

  -- 5. State Machine Transition Rules
  IF v_order.status = 'pending' AND v_target_status NOT IN ('accepted', 'rejected') THEN
    RAISE EXCEPTION 'Invalid transition: Pending orders can only be accepted or rejected by farmer.';
  ELSIF v_order.status = 'accepted' AND v_target_status NOT IN ('preparing') THEN
    RAISE EXCEPTION 'Invalid transition: Accepted orders can only move to preparing.';
  ELSIF v_order.status = 'preparing' AND v_target_status NOT IN ('ready_for_pickup') THEN
    RAISE EXCEPTION 'Invalid transition: Preparing orders can only move to ready_for_pickup.';
  ELSIF v_order.status IN ('ready_for_pickup', 'in_transit', 'delivered', 'cancelled', 'rejected', 'failed_delivery') THEN
    RAISE EXCEPTION 'Farmer cannot transition orders in status "%".', v_order.status;
  END IF;

  -- 6. Stock Compensation on Rejection (Using Centralized Routine)
  IF v_target_status = 'rejected' THEN
    PERFORM public.internal_restore_produce_stock(v_order.listing_id, v_order.quantity);

    UPDATE public.logistics_assignments
    SET status = 'cancelled', updated_at = now()
    WHERE order_id = p_order_id;
  END IF;

  -- 7. Apply Status Update
  UPDATE public.orders
  SET status = v_target_status,
      payment_status = CASE
        WHEN v_target_status = 'accepted' THEN 'escrow_locked'
        WHEN v_target_status = 'rejected' THEN 'refunded'
        ELSE payment_status
      END,
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

-- ------------------------------------------------------------------------------
-- 5. DRIVER CLAIM ASSIGNMENT (CONCURRENCY-SAFE PICKUP CLAIM)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.driver_claim_assignment(
  p_assignment_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_operator_id UUID;
  v_assignment RECORD;
BEGIN
  -- 1. Strict Authentication Enforcement
  v_operator_id := auth.uid();
  IF v_operator_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required: Operator must be signed in.' USING ERRCODE = '42501';
  END IF;

  -- 2. Row lock on assignment to prevent concurrent double-claim
  SELECT * INTO v_assignment
  FROM public.logistics_assignments
  WHERE id = p_assignment_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Logistics assignment not found: %', p_assignment_id USING ERRCODE = 'P0002';
  END IF;

  IF v_assignment.operator_id IS NOT NULL THEN
    RAISE EXCEPTION 'Assignment conflict: Shipment has already been claimed by another operator.' USING ERRCODE = '23505';
  END IF;

  UPDATE public.logistics_assignments
  SET operator_id = v_operator_id,
      status = 'assigned',
      updated_at = now()
  WHERE id = p_assignment_id
  RETURNING * INTO v_assignment;

  RETURN jsonb_build_object(
    'success', true,
    'assignment_id', p_assignment_id,
    'operator_id', v_operator_id,
    'status', 'assigned',
    'assignment', to_jsonb(v_assignment)
  );
END;
$$;

-- ------------------------------------------------------------------------------
-- 6. DRIVER UPDATE GPS TELEMATICS
-- ------------------------------------------------------------------------------
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
  -- 1. Strict Authentication Enforcement
  v_operator_id := auth.uid();
  IF v_operator_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required: Driver must be signed in.' USING ERRCODE = '42501';
  END IF;

  -- 2. Validate GPS coordinates
  IF p_lat IS NULL OR p_lng IS NULL OR p_lat < -90.0 OR p_lat > 90.0 OR p_lng < -180.0 OR p_lng > 180.0 THEN
    RAISE EXCEPTION 'Invalid GPS coordinates: (%, %)', p_lat, p_lng USING ERRCODE = '22023';
  END IF;

  -- 3. Locate and lock assignment
  SELECT * INTO v_assignment
  FROM public.logistics_assignments
  WHERE id = p_assignment_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Logistics assignment not found: %', p_assignment_id USING ERRCODE = 'P0002';
  END IF;

  -- 4. Ownership Verification
  IF v_assignment.operator_id IS NOT NULL AND v_assignment.operator_id <> v_operator_id THEN
    RAISE EXCEPTION 'Unauthorized: Operator is not assigned to this shipment.' USING ERRCODE = '42501';
  END IF;

  -- 5. Calculate Spoilage Risk
  v_temp := COALESCE(p_current_temp, v_assignment.current_temp, 4.5);
  v_target_temp := COALESCE(v_assignment.target_temp, 4.0);

  IF v_temp > (v_target_temp + 4.0) THEN
    v_spoilage := 'high';
  ELSIF v_temp > (v_target_temp + 2.0) THEN
    v_spoilage := 'medium';
  ELSE
    v_spoilage := 'low';
  END IF;

  -- 6. Update Real-Time Location
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

  -- 7. Append Immutable Audit Record
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'shipment_telemetry_logs') THEN
    INSERT INTO public.shipment_telemetry_logs (
      trip_id, temperature, humidity, latitude, longitude,
      speed_kmh, gps_accuracy_meters, telemetry_source, created_at
    ) VALUES (
      v_assignment.order_id, v_temp, p_humidity, p_lat, p_lng,
      p_speed_kmh, p_gps_accuracy, 'Driver Phone GPS', now()
    );
  END IF;

  -- 8. Trigger Active Alert on Threshold Breach
  IF v_spoilage = 'high' AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'temperature_alerts') THEN
    INSERT INTO public.temperature_alerts (
      trip_id, actual_temperature, safe_threshold, severity,
      current_lat, current_lng, telemetry_source, status, created_at
    ) VALUES (
      v_assignment.order_id, v_temp, v_target_temp + 2.0, 'HIGH',
      p_lat, p_lng, 'Reefer Sensor Ping', 'ACTIVE', now()
    );
  END IF;

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

-- ------------------------------------------------------------------------------
-- 7. DRIVER UPDATE DELIVERY STATUS (IDEMPOTENT ESCROW RELEASE & FAILURE HANDLING)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.driver_update_delivery_status(
  p_assignment_id UUID,
  p_new_status TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_operator_id UUID;
  v_assignment RECORD;
  v_order RECORD;
  v_target_status TEXT;
  v_order_status TEXT;
BEGIN
  -- 1. Strict Authentication Enforcement
  v_operator_id := auth.uid();
  IF v_operator_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required: Driver must be signed in.' USING ERRCODE = '42501';
  END IF;

  -- 2. Locate and lock assignment
  SELECT * INTO v_assignment
  FROM public.logistics_assignments
  WHERE id = p_assignment_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Logistics assignment not found: %', p_assignment_id USING ERRCODE = 'P0002';
  END IF;

  -- 3. Ownership Verification
  IF v_assignment.operator_id IS NOT NULL AND v_assignment.operator_id <> v_operator_id THEN
    RAISE EXCEPTION 'Unauthorized: Operator is not assigned to this shipment.' USING ERRCODE = '42501';
  END IF;

  v_target_status := LOWER(TRIM(p_new_status));

  -- 4. Idempotency Guard
  IF v_assignment.status = v_target_status THEN
    RETURN jsonb_build_object(
      'success', true,
      'assignment_id', p_assignment_id,
      'order_id', v_assignment.order_id,
      'logistics_status', v_target_status,
      'note', 'Idempotent duplicate update: Status already matched',
      'assignment', to_jsonb(v_assignment)
    );
  END IF;

  -- 5. State Progression Rules
  IF v_target_status NOT IN ('assigned', 'heading_to_pickup', 'picked_up', 'in_transit', 'delivered', 'cancelled', 'failed_delivery') THEN
    RAISE EXCEPTION 'Invalid logistics status: %', p_new_status;
  END IF;

  SELECT * INTO v_order
  FROM public.orders
  WHERE id = v_assignment.order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Referenced order not found: %', v_assignment.order_id;
  END IF;

  IF v_order.status IN ('cancelled', 'rejected', 'failed_delivery') THEN
    RAISE EXCEPTION 'Cannot update delivery on an order that has already been %.', v_order.status;
  END IF;

  -- 6. Synchronize Order Status & Escrow Release
  IF v_target_status IN ('picked_up', 'in_transit') THEN
    v_order_status := 'in_transit';
    UPDATE public.orders
    SET status = 'in_transit', updated_at = now()
    WHERE id = v_assignment.order_id;
  ELSIF v_target_status = 'delivered' THEN
    v_order_status := 'delivered';
    -- Escrow release trigger (idempotent, single-release)
    UPDATE public.orders
    SET status = 'delivered',
        payment_status = CASE 
          WHEN payment_status <> 'released_to_farmer' THEN 'released_to_farmer'
          ELSE payment_status
        END,
        updated_at = now()
    WHERE id = v_assignment.order_id;
  ELSIF v_target_status = 'failed_delivery' THEN
    v_order_status := 'failed_delivery';
    -- Refund payment on delivery failure
    UPDATE public.orders
    SET status = 'failed_delivery',
        payment_status = 'refunded',
        updated_at = now()
    WHERE id = v_assignment.order_id;

    -- Only restore stock if produce was NOT spoiled (temperature stayed within threshold)
    IF v_assignment.spoilage_risk <> 'high' THEN
      PERFORM public.internal_restore_produce_stock(v_order.listing_id, v_order.quantity);
    END IF;
  END IF;

  -- 7. Update Assignment Status
  UPDATE public.logistics_assignments
  SET status = v_target_status,
      updated_at = now()
  WHERE id = p_assignment_id
  RETURNING * INTO v_assignment;

  RETURN jsonb_build_object(
    'success', true,
    'assignment_id', p_assignment_id,
    'order_id', v_assignment.order_id,
    'logistics_status', v_target_status,
    'order_status', COALESCE(v_order_status, v_order.status),
    'assignment', to_jsonb(v_assignment)
  );
END;
$$;

-- ------------------------------------------------------------------------------
-- 8. CONSUMER CANCEL ORDER (EXPLICIT POLICY)
-- ------------------------------------------------------------------------------
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
  -- 1. Strict Authentication Enforcement
  v_customer_id := auth.uid();
  IF v_customer_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required: User must be signed in to cancel an order.' USING ERRCODE = '42501';
  END IF;

  -- 2. Locate and lock order
  SELECT * INTO v_order
  FROM public.orders
  WHERE id = p_order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found: %', p_order_id USING ERRCODE = 'P0002';
  END IF;

  -- 3. Ownership Verification
  IF v_order.customer_id IS NOT NULL AND v_order.customer_id <> v_customer_id THEN
    RAISE EXCEPTION 'Unauthorized: Consumer does not own this order.' USING ERRCODE = '42501';
  END IF;

  -- 4. Idempotency Check
  IF v_order.status = 'cancelled' THEN
    RETURN jsonb_build_object(
      'success', true,
      'order_id', p_order_id,
      'status', 'cancelled',
      'note', 'Idempotent replay: Order was already cancelled',
      'order', to_jsonb(v_order)
    );
  END IF;

  -- 5. Exact Cancellation Policy Enforcement:
  -- Allowed ONLY in: pending, accepted
  -- Blocked in: preparing, ready_for_pickup, pickup_assigned, in_transit, delivered, rejected, failed_delivery
  IF v_order.status NOT IN ('pending', 'accepted') THEN
    RAISE EXCEPTION 'Cancellation denied: Order is in status "%". Cancellations are permitted only before farmer preparation begins.', v_order.status;
  END IF;

  -- 6. Atomically Restore Inventory via Centralized Routine
  PERFORM public.internal_restore_produce_stock(v_order.listing_id, v_order.quantity);

  -- 7. Cancel Order and Logistics Assignment
  UPDATE public.orders
  SET status = 'cancelled',
      payment_status = 'refunded',
      updated_at = now()
  WHERE id = p_order_id
  RETURNING * INTO v_order;

  UPDATE public.logistics_assignments
  SET status = 'cancelled', updated_at = now()
  WHERE order_id = p_order_id;

  RETURN jsonb_build_object(
    'success', true,
    'order_id', p_order_id,
    'status', 'cancelled',
    'payment_status', 'refunded',
    'inventory_restored', v_order.quantity,
    'order', to_jsonb(v_order)
  );
END;
$$;

-- ------------------------------------------------------------------------------
-- 9. SUBMIT VERIFIED REVIEW
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.submit_verified_review(
  p_order_id TEXT,
  p_reviewee_id UUID,
  p_rating INTEGER,
  p_comment TEXT DEFAULT '',
  p_role_perspective TEXT DEFAULT 'VERIFIED_PURCHASE',
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
  v_created_review RECORD;
BEGIN
  -- 1. Strict Authentication Enforcement
  v_reviewer_id := auth.uid();
  IF v_reviewer_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required: User must be signed in to submit a review.' USING ERRCODE = '42501';
  END IF;

  -- 2. Rating Range Invariant
  IF p_rating IS NULL OR p_rating < 1 OR p_rating > 5 THEN
    RAISE EXCEPTION 'Rating must be an integer between 1 and 5.' USING ERRCODE = '22023';
  END IF;

  -- 3. Anti-Self-Rating Guard
  IF v_reviewer_id = p_reviewee_id THEN
    RAISE EXCEPTION 'Anti-Self-Rating Guard: You cannot review yourself.' USING ERRCODE = '22000';
  END IF;

  -- 4. Order Existence and Delivery Status
  SELECT * INTO v_order
  FROM public.orders
  WHERE id = p_order_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found: %', p_order_id USING ERRCODE = 'P0002';
  END IF;

  IF LOWER(v_order.status) <> 'delivered' THEN
    RAISE EXCEPTION 'Reviews can only be submitted for completed/delivered orders (Current status: %).', v_order.status;
  END IF;

  -- 5. Participant Verification
  IF v_reviewer_id <> v_order.customer_id AND v_reviewer_id <> v_order.farmer_id THEN
    RAISE EXCEPTION 'Unauthorized: Only participants in this transaction may submit a review.' USING ERRCODE = '42501';
  END IF;

  -- 6. Deduplication Check
  IF EXISTS (
    SELECT 1 FROM public.reviews
    WHERE order_id = p_order_id AND reviewer_id = v_reviewer_id AND reviewee_id = p_reviewee_id
  ) THEN
    RAISE EXCEPTION 'Duplicate review: You have already submitted a review for this transaction.' USING ERRCODE = '23505';
  END IF;

  -- 7. Insert Verified Review
  INSERT INTO public.reviews (
    order_id, transaction_id, reviewer_id, reviewee_id,
    rating, comment, role_perspective, category_ratings,
    verification_badge, is_verified, moderation_status,
    created_at, updated_at
  ) VALUES (
    p_order_id, p_order_id, v_reviewer_id, p_reviewee_id,
    p_rating, TRIM(p_comment), p_role_perspective, COALESCE(p_category_ratings, '{}'::JSONB),
    'VERIFIED_PURCHASE', true, 'PUBLISHED',
    now(), now()
  ) RETURNING * INTO v_created_review;

  RETURN jsonb_build_object(
    'success', true,
    'review_id', v_created_review.id,
    'order_id', p_order_id,
    'rating', p_rating,
    'review', to_jsonb(v_created_review)
  );
END;
$$;

-- ------------------------------------------------------------------------------
-- 10. PROTECTED STOCK RECONCILIATION ROUTINE (SERVICE_ROLE ONLY)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.reconcile_listing_stock(
  p_listing_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_repaired_count INT := 0;
BEGIN
  -- Atomically sync cached available_quantity to authoritative order ledger truth
  WITH active_orders AS (
    SELECT listing_id, COALESCE(SUM(quantity), 0) AS reserved_qty
    FROM public.orders
    WHERE status NOT IN ('cancelled', 'rejected', 'failed_delivery')
    GROUP BY listing_id
  ),
  discrepancies AS (
    SELECT 
      pl.id,
      GREATEST(0, pl.total_quantity - COALESCE(ao.reserved_qty, 0)) AS target_available,
      CASE 
        WHEN GREATEST(0, pl.total_quantity - COALESCE(ao.reserved_qty, 0)) <= 0 THEN 'sold_out'
        ELSE 'active'
      END AS target_status
    FROM public.produce_listings pl
    LEFT JOIN active_orders ao ON pl.id = ao.listing_id
    WHERE (p_listing_id IS NULL OR pl.id = p_listing_id)
      AND pl.available_quantity <> GREATEST(0, pl.total_quantity - COALESCE(ao.reserved_qty, 0))
  ),
  updated AS (
    UPDATE public.produce_listings pl
    SET available_quantity = d.target_available,
        status = d.target_status,
        updated_at = now()
    FROM discrepancies d
    WHERE pl.id = d.id
    RETURNING pl.id
  )
  SELECT COUNT(*) INTO v_repaired_count FROM updated;

  RETURN jsonb_build_object(
    'success', true,
    'reconciled_listings_count', v_repaired_count,
    'timestamp', now()
  );
END;
$$;

-- ------------------------------------------------------------------------------
-- 11. STRICT EXECUTION PERMISSIONS & REVOCATIONS
-- ------------------------------------------------------------------------------
-- Sequence access
REVOKE ALL ON SEQUENCE public.order_seq FROM PUBLIC, anon;
GRANT USAGE, SELECT ON SEQUENCE public.order_seq TO authenticated, service_role;

-- Revoke ALL access from anon and PUBLIC across all mutating functions
REVOKE ALL ON FUNCTION public.internal_restore_produce_stock(UUID, NUMERIC) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.atomic_checkout_order(UUID, NUMERIC, TEXT, DOUBLE PRECISION, DOUBLE PRECISION, TEXT, TEXT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.farmer_update_order_status(TEXT, TEXT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.driver_claim_assignment(UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.driver_update_gps(UUID, DOUBLE PRECISION, DOUBLE PRECISION, NUMERIC, NUMERIC, NUMERIC, NUMERIC) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.driver_update_delivery_status(UUID, TEXT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.consumer_cancel_order(TEXT, TEXT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.submit_verified_review(TEXT, UUID, INTEGER, TEXT, TEXT, JSONB) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.reconcile_listing_stock(UUID) FROM PUBLIC, anon, authenticated;

-- Grant EXECUTE to authenticated users and service_role for client endpoints
GRANT EXECUTE ON FUNCTION public.atomic_checkout_order(UUID, NUMERIC, TEXT, DOUBLE PRECISION, DOUBLE PRECISION, TEXT, TEXT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.farmer_update_order_status(TEXT, TEXT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.driver_claim_assignment(UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.driver_update_gps(UUID, DOUBLE PRECISION, DOUBLE PRECISION, NUMERIC, NUMERIC, NUMERIC, NUMERIC) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.driver_update_delivery_status(UUID, TEXT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.consumer_cancel_order(TEXT, TEXT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.submit_verified_review(TEXT, UUID, INTEGER, TEXT, TEXT, JSONB) TO authenticated, service_role;

-- Strictly restricted to service_role (Administrative / internal routines)
GRANT EXECUTE ON FUNCTION public.internal_restore_produce_stock(UUID, NUMERIC) TO service_role;
GRANT EXECUTE ON FUNCTION public.reconcile_listing_stock(UUID) TO service_role;
