-- ==============================================================================
-- AgriFlow.ai: Migration 13 - RPC Authorization, State Machine Alignment & Storage RLS
-- File: supabase/migrations/13_rpc_authorization_and_storage_rls.sql
--
-- Core Invariants Enforced:
--   1. GRANT is not authorization: Every RPC explicitly checks auth.uid() against the table row
--   2. farmer_update_order_status verifies auth.uid() = order.farmer_id
--   3. driver_update_gps & driver_update_delivery_status verify auth.uid() = assignment.operator_id
--   4. consumer_cancel_order verifies auth.uid() = order.customer_id and restricts to early statuses
--   5. atomic_checkout_order takes buyer strictly from auth.uid(), rejects quantity <= 0, reads price from listing
--   6. Full 9-stage lifecycle constraint alignment on public.orders (Order Placed -> Delivered/Completed)
--   7. produce-images Storage RLS: Public read, but users can ONLY upload/edit/delete in their own {auth.uid()} folder
--   8. All routines marked SECURITY DEFINER with SET search_path = public
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. ORDER LIFECYCLE CHECK CONSTRAINT UPGRADE
-- ------------------------------------------------------------------------------
-- Lifecycle:
--   Order Placed (pending) -> Farmer Accepted (accepted) -> Preparing (preparing)
--   -> Ready for Pickup (ready_for_pickup) -> Pickup Assigned (pickup_assigned)
--   -> Picked Up (picked_up) -> In Transit (in_transit) -> Delivered (delivered)
--   -> Completed (completed)
--   Terminal: Cancelled (cancelled), Rejected (rejected), Failed Delivery (failed_delivery)

ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE public.orders ADD CONSTRAINT orders_status_check
  CHECK (status IN (
    'pending',
    'order_placed',
    'accepted',
    'confirmed',
    'preparing',
    'ready_for_pickup',
    'pickup_assigned',
    'picked_up',
    'in_transit',
    'dispatched',
    'delivered',
    'completed',
    'cancelled',
    'rejected',
    'failed_delivery'
  ));

-- ------------------------------------------------------------------------------
-- 2. ATOMIC CHECKOUT ORDER (BUYER FROM auth.uid(), QUANTITY > 0, DB-SOURCED PRICE)
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
  -- 1. Strict Authentication Enforcement: Buyer ALWAYS taken from auth.uid()
  v_customer_id := auth.uid();
  IF v_customer_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required: User must be signed in to place an order.' USING ERRCODE = '42501';
  END IF;

  -- 2. Quantity & Listing Validation
  IF p_listing_id IS NULL THEN
    RAISE EXCEPTION 'Produce listing ID is required.' USING ERRCODE = '22023';
  END IF;

  IF p_quantity IS NULL OR p_quantity <= 0 THEN
    RAISE EXCEPTION 'Order quantity must be greater than zero. Received: %', p_quantity USING ERRCODE = '22023';
  END IF;

  -- 3. Idempotency Replay Guard
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

  -- 4. Row-Level Lock on Specific Listing (Transaction-Safe Concurrency)
  SELECT * INTO v_listing
  FROM public.produce_listings
  WHERE id = p_listing_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Produce listing not found: %', p_listing_id USING ERRCODE = 'P0002';
  END IF;

  -- 5. Stock Invariant Verification
  IF LOWER(v_listing.status) NOT IN ('active') THEN
    RAISE EXCEPTION 'Produce listing is currently unavailable (Status: %).', v_listing.status USING ERRCODE = '22000';
  END IF;

  IF v_listing.available_quantity < p_quantity THEN
    RAISE EXCEPTION 'Insufficient inventory. Requested: % %, Available: % %',
      p_quantity, v_listing.unit, v_listing.available_quantity, v_listing.unit USING ERRCODE = '22000';
  END IF;

  -- 6. Atomic Stock Deduction
  v_new_available := v_listing.available_quantity - p_quantity;
  v_new_status := CASE WHEN v_new_available = 0 THEN 'sold_out' ELSE v_listing.status END;

  UPDATE public.produce_listings
  SET available_quantity = v_new_available,
      status = v_new_status,
      updated_at = now()
  WHERE id = p_listing_id;

  -- 7. Authoritative Fee Calculation: Price READ FROM LISTING, not client parameter
  v_unit_price := v_listing.price_per_unit;
  v_total_amount := ROUND(p_quantity * v_unit_price, 2);
  v_platform_fee := ROUND(v_total_amount * 0.05, 2);
  v_logistics_fee := ROUND(v_total_amount * 0.08, 2);
  v_farmer_realization := v_total_amount - v_platform_fee - v_logistics_fee;

  -- 8. Sequential Order Number Generation
  v_seq_val := nextval('public.order_seq');
  v_order_number := 'ORD-' || TO_CHAR(now(), 'YYYYMMDD') || '-' || LPAD(v_seq_val::TEXT, 4, '0');
  v_order_id := COALESCE(p_idempotency_key, v_order_number);

  -- 9. Order Creation: Initial status is 'pending' (Order Placed)
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

  -- 10. Auto-create Logistics Assignment in Queue (operator_id NULL until driver claims)
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

-- ------------------------------------------------------------------------------
-- 3. FARMER UPDATE ORDER STATUS (STRICT SELLER OWNERSHIP & LIFECYCLE RULES)
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

  -- 3. Strict Seller Ownership Authorization: auth.uid() MUST match order.farmer_id
  IF v_order.farmer_id IS NULL OR v_order.farmer_id <> v_farmer_id THEN
    RAISE EXCEPTION 'Unauthorized: Caller is not the seller on this order.' USING ERRCODE = '42501';
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

  -- 5. Strict Lifecycle Transition Rules (Farmer Domain):
  --   Order Placed (pending) -> Farmer Accepted (accepted) OR Rejected (rejected)
  --   Farmer Accepted (accepted) -> Preparing (preparing)
  --   Preparing (preparing) -> Ready for Pickup (ready_for_pickup)
  --   All other stages (pickup_assigned, picked_up, in_transit, delivered, completed) belong to Carrier/Driver/Buyer
  IF v_order.status IN ('pending', 'order_placed') AND v_target_status NOT IN ('accepted', 'confirmed', 'rejected') THEN
    RAISE EXCEPTION 'Invalid transition: Placed orders can only be accepted or rejected by the farmer.';
  ELSIF v_order.status IN ('accepted', 'confirmed') AND v_target_status NOT IN ('preparing') THEN
    RAISE EXCEPTION 'Invalid transition: Accepted orders can only move to preparing.';
  ELSIF v_order.status = 'preparing' AND v_target_status NOT IN ('ready_for_pickup') THEN
    RAISE EXCEPTION 'Invalid transition: Preparing orders can only move to ready_for_pickup.';
  ELSIF v_order.status IN ('ready_for_pickup', 'pickup_assigned', 'picked_up', 'in_transit', 'delivered', 'completed', 'cancelled', 'rejected', 'failed_delivery') THEN
    RAISE EXCEPTION 'Farmer cannot transition orders in status "%".', v_order.status;
  END IF;

  -- 6. Stock Restoration on Rejection
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
        WHEN v_target_status IN ('accepted', 'confirmed') THEN 'escrow_locked'
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
-- 4. DRIVER UPDATE GPS TELEMETRY (STRICT ASSIGNED DRIVER OWNERSHIP)
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

  -- 4. Strict Driver Ownership Authorization: Assignment MUST belong to auth.uid()
  IF v_assignment.operator_id IS NULL OR v_assignment.operator_id <> v_operator_id THEN
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

  -- 7. Audit log insert if table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'shipment_telemetry_logs') THEN
    INSERT INTO public.shipment_telemetry_logs (
      trip_id, temperature, humidity, latitude, longitude,
      speed_kmh, gps_accuracy_meters, telemetry_source, created_at
    ) VALUES (
      v_assignment.order_id, v_temp, p_humidity, p_lat, p_lng,
      p_speed_kmh, p_gps_accuracy, 'Driver Phone GPS', now()
    );
  END IF;

  -- 8. Trigger alert on critical temperature threshold
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
-- 5. DRIVER UPDATE DELIVERY STATUS (STRICT ASSIGNED DRIVER OWNERSHIP & LIFECYCLE)
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

  -- 3. Strict Driver Ownership Authorization
  IF v_assignment.operator_id IS NULL OR v_assignment.operator_id <> v_operator_id THEN
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
  IF v_target_status NOT IN ('assigned', 'heading_to_pickup', 'picked_up', 'in_transit', 'delivered', 'completed', 'cancelled', 'failed_delivery') THEN
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

  -- 6. Synchronize Order Status to match Lifecycle
  IF v_target_status = 'heading_to_pickup' THEN
    v_order_status := 'pickup_assigned';
    UPDATE public.orders SET status = 'pickup_assigned', updated_at = now() WHERE id = v_assignment.order_id;
  ELSIF v_target_status = 'picked_up' THEN
    v_order_status := 'picked_up';
    UPDATE public.orders SET status = 'picked_up', updated_at = now() WHERE id = v_assignment.order_id;
  ELSIF v_target_status = 'in_transit' THEN
    v_order_status := 'in_transit';
    UPDATE public.orders SET status = 'in_transit', updated_at = now() WHERE id = v_assignment.order_id;
  ELSIF v_target_status = 'delivered' THEN
    v_order_status := 'delivered';
    UPDATE public.orders
    SET status = 'delivered',
        payment_status = CASE 
          WHEN payment_status <> 'released_to_farmer' THEN 'released_to_farmer'
          ELSE payment_status
        END,
        updated_at = now()
    WHERE id = v_assignment.order_id;
  ELSIF v_target_status = 'completed' THEN
    v_order_status := 'completed';
    UPDATE public.orders
    SET status = 'completed',
        payment_status = 'released_to_farmer',
        updated_at = now()
    WHERE id = v_assignment.order_id;
  ELSIF v_target_status = 'failed_delivery' THEN
    v_order_status := 'failed_delivery';
    UPDATE public.orders
    SET status = 'failed_delivery',
        payment_status = 'refunded',
        updated_at = now()
    WHERE id = v_assignment.order_id;

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
-- 6. CONSUMER CANCEL ORDER (STRICT BUYER OWNERSHIP & EARLY-STAGE ENFORCEMENT)
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
  -- 1. Strict Authentication Enforcement: Caller MUST be signed in
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

  -- 3. Strict Buyer Ownership Authorization: auth.uid() MUST match customer_id or buyer_id
  IF COALESCE(v_order.customer_id, v_order.buyer_id) IS NULL OR COALESCE(v_order.customer_id, v_order.buyer_id) <> v_customer_id THEN
    RAISE EXCEPTION 'Unauthorized: Caller does not own this order.' USING ERRCODE = '42501';
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
  -- Allowed ONLY in: pending, order_placed, accepted, confirmed
  -- Blocked in: preparing, ready_for_pickup, pickup_assigned, picked_up, in_transit, delivered, completed, rejected, failed_delivery
  IF v_order.status NOT IN ('pending', 'order_placed', 'accepted', 'confirmed') THEN
    RAISE EXCEPTION 'Cancellation denied: Order is in status "%". Cancellations are permitted only before farmer preparation begins.', v_order.status;
  END IF;

  -- 6. Atomically Restore Inventory back to produce_listings
  PERFORM public.internal_restore_produce_stock(v_order.listing_id, v_order.quantity);

  -- 7. Cancel Order and Logistics Assignment
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
    'restored_quantity', v_order.quantity,
    'order', to_jsonb(v_order)
  );
END;
$$;

-- ------------------------------------------------------------------------------
-- 7. STORAGE RLS: PRODUCE-IMAGES (PUBLIC READ, SCOPED UPLOADS TO {auth.uid()}/*)
-- ------------------------------------------------------------------------------
-- Bucket ensure
INSERT INTO storage.buckets (id, name, public)
VALUES ('produce-images', 'produce-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Policy 1: Public Read
DROP POLICY IF EXISTS "Public access to produce images" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read produce-images" ON storage.objects;
CREATE POLICY "Public access to produce images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'produce-images');

-- Policy 2: Authenticated users can ONLY insert into their own folder ({auth.uid()}/*)
DROP POLICY IF EXISTS "Allow produce image uploads" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users upload to own folder" ON storage.objects;
CREATE POLICY "Authenticated users upload to own folder"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'produce-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Policy 3: Authenticated users can ONLY update files in their own folder
DROP POLICY IF EXISTS "Allow produce image updates" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users update own produce images" ON storage.objects;
CREATE POLICY "Authenticated users update own produce images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'produce-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Policy 4: Authenticated users can ONLY delete files in their own folder
DROP POLICY IF EXISTS "Allow produce image deletes" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users delete own produce images" ON storage.objects;
CREATE POLICY "Authenticated users delete own produce images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'produce-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- ------------------------------------------------------------------------------
-- 8. STRICT EXECUTION GRANTS (Revoke from public/anon, grant to authenticated & service_role)
-- ------------------------------------------------------------------------------
REVOKE ALL ON FUNCTION public.atomic_checkout_order(UUID, NUMERIC, TEXT, DOUBLE PRECISION, DOUBLE PRECISION, TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.atomic_checkout_order(UUID, NUMERIC, TEXT, DOUBLE PRECISION, DOUBLE PRECISION, TEXT, TEXT) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.farmer_update_order_status(TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.farmer_update_order_status(TEXT, TEXT) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.driver_update_gps(UUID, DOUBLE PRECISION, DOUBLE PRECISION, NUMERIC, NUMERIC, NUMERIC, NUMERIC) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.driver_update_gps(UUID, DOUBLE PRECISION, DOUBLE PRECISION, NUMERIC, NUMERIC, NUMERIC, NUMERIC) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.driver_update_delivery_status(UUID, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.driver_update_delivery_status(UUID, TEXT) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.consumer_cancel_order(TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.consumer_cancel_order(TEXT, TEXT) TO authenticated, service_role;
