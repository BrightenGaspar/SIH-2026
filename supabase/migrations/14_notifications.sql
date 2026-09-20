-- ==============================================================================
-- AgriFlow.ai: Migration 14 - Real-Time In-App Notifications & Delivery Proof Photo
-- File: supabase/migrations/14_notifications.sql
--
-- Features:
--   1. Authoritative public.notifications table with strict RLS (No client INSERT)
--   2. Real-time broadcast on public.notifications via supabase_realtime
--   3. Database Triggers for autonomous notification generation:
--      a) AFTER INSERT ON produce_listings -> Notify consumers in same district
--      b) AFTER INSERT ON orders -> Notify farmer (order_received)
--      c) AFTER UPDATE OF status ON orders -> Notify buyer/farmer/logistics
--      d) AFTER UPDATE OF status ON logistics_assignments -> Notify farmer + buyer
--   4. Private delivery-proofs storage bucket with scoped RLS
--   5. Mandatory delivery proof enforcement in driver_update_delivery_status
--   6. consumer_confirm_receipt routine to transition delivered -> completed
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. NOTIFICATIONS TABLE
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

-- Index for high-performance timeline queries
CREATE INDEX IF NOT EXISTS idx_notifications_user_created 
  ON public.notifications (user_id, created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Policy 1: Authenticated users can only read their own notifications
DROP POLICY IF EXISTS "read own" ON public.notifications;
CREATE POLICY "read own" ON public.notifications
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Policy 2: Authenticated users can only update read_at on their own notifications
DROP POLICY IF EXISTS "mark own read" ON public.notifications;
CREATE POLICY "mark own read" ON public.notifications
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Restrict update permission strictly to read_at column
REVOKE UPDATE ON public.notifications FROM authenticated;
GRANT UPDATE (read_at) ON public.notifications TO authenticated;

-- Ensure NO INSERT policy exists for clients (Notifications created ONLY via server-side triggers)
REVOKE INSERT ON public.notifications FROM PUBLIC, anon, authenticated;

-- Enable Supabase Realtime streaming on notifications table
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;
END $$;

-- ------------------------------------------------------------------------------
-- 2. NOTIFY HELPER FUNCTION (INTERNAL DATABASE ROUTINE)
-- ------------------------------------------------------------------------------
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
-- 3. DELIVERY PROOF STORAGE & ASSIGNMENT COLUMN
-- ------------------------------------------------------------------------------
ALTER TABLE public.logistics_assignments
  ADD COLUMN IF NOT EXISTS proof_photo_path TEXT;

-- Private delivery-proofs bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('delivery-proofs', 'delivery-proofs', false)
ON CONFLICT (id) DO UPDATE SET public = false;

-- Policy: Driver can only upload proof photo into their own folder: {driver_uid}/{assignment_id}/*
DROP POLICY IF EXISTS "Drivers upload delivery proofs" ON storage.objects;
CREATE POLICY "Drivers upload delivery proofs"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'delivery-proofs'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Policy: Driver, Farmer, and Buyer on that assignment can read the delivery proof
DROP POLICY IF EXISTS "Authorized users view delivery proof" ON storage.objects;
CREATE POLICY "Authorized users view delivery proof"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'delivery-proofs'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR EXISTS (
        SELECT 1 FROM public.logistics_assignments la
        JOIN public.orders o ON o.id = la.order_id
        WHERE la.id::text = (storage.foldername(name))[2]
          AND (o.farmer_id = auth.uid() OR o.customer_id = auth.uid() OR o.buyer_id = auth.uid())
      )
    )
  );

-- ------------------------------------------------------------------------------
-- 4. UPDATE DRIVER DELIVERY STATUS (MANDATORY PROOF PHOTO ON DELIVERED)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.driver_update_delivery_status(
  p_assignment_id UUID,
  p_new_status TEXT,
  p_proof_path TEXT DEFAULT NULL
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
  IF v_assignment.status = v_target_status AND (v_target_status <> 'delivered' OR v_assignment.proof_photo_path IS NOT NULL) THEN
    RETURN jsonb_build_object(
      'success', true,
      'assignment_id', p_assignment_id,
      'order_id', v_assignment.order_id,
      'logistics_status', v_target_status,
      'note', 'Idempotent duplicate update: Status already matched',
      'assignment', to_jsonb(v_assignment)
    );
  END IF;

  -- 5. Canonical Lifecycle Progression Rules
  IF v_target_status NOT IN ('assigned', 'heading_to_pickup', 'picked_up', 'in_transit', 'delivered', 'completed', 'cancelled', 'failed_delivery') THEN
    RAISE EXCEPTION 'Invalid logistics status: %', p_new_status;
  END IF;

  -- 6. MANDATORY PROOF PHOTO VALIDATION FOR DELIVERED STATUS
  IF v_target_status = 'delivered' THEN
    IF p_proof_path IS NULL OR TRIM(p_proof_path) = '' THEN
      RAISE EXCEPTION 'Delivery proof photo is required to mark shipment as delivered.' USING ERRCODE = '22023';
    END IF;

    -- Strict path validation: Must start with auth.uid()/assignment_id/
    IF NOT (p_proof_path LIKE v_operator_id::text || '/' || p_assignment_id::text || '/%') THEN
      RAISE EXCEPTION 'Invalid delivery proof path: Must begin with %/%', v_operator_id, p_assignment_id USING ERRCODE = '42501';
    END IF;
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

  -- 7. Synchronize Order Status to match Canonical Lifecycle
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

  -- 8. Update Assignment Status & Save Proof Photo Path
  UPDATE public.logistics_assignments
  SET status = v_target_status,
      proof_photo_path = COALESCE(p_proof_path, proof_photo_path),
      updated_at = now()
  WHERE id = p_assignment_id
  RETURNING * INTO v_assignment;

  RETURN jsonb_build_object(
    'success', true,
    'assignment_id', p_assignment_id,
    'order_id', v_assignment.order_id,
    'logistics_status', v_target_status,
    'order_status', COALESCE(v_order_status, v_order.status),
    'proof_photo_path', v_assignment.proof_photo_path,
    'assignment', to_jsonb(v_assignment)
  );
END;
$$;

-- ------------------------------------------------------------------------------
-- 5. CONSUMER CONFIRM RECEIPT (DELIVERED -> COMPLETED & ESCROW RELEASE)
-- ------------------------------------------------------------------------------
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
  -- 1. Strict Authentication Enforcement
  v_customer_id := auth.uid();
  IF v_customer_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required: User must be signed in to confirm receipt.' USING ERRCODE = '42501';
  END IF;

  -- 2. Locate and lock order
  SELECT * INTO v_order
  FROM public.orders
  WHERE id = p_order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found: %', p_order_id USING ERRCODE = 'P0002';
  END IF;

  -- 3. Strict Buyer Ownership Authorization
  IF COALESCE(v_order.customer_id, v_order.buyer_id) IS NULL 
     OR COALESCE(v_order.customer_id, v_order.buyer_id) <> v_customer_id THEN
    RAISE EXCEPTION 'Unauthorized: Caller does not own this order.' USING ERRCODE = '42501';
  END IF;

  -- 4. Idempotency Check
  IF v_order.status = 'completed' THEN
    RETURN jsonb_build_object(
      'success', true,
      'order_id', p_order_id,
      'status', 'completed',
      'note', 'Order is already marked as completed',
      'order', to_jsonb(v_order)
    );
  END IF;

  -- 5. Only DELIVERED orders can be confirmed
  IF v_order.status <> 'delivered' THEN
    RAISE EXCEPTION 'Cannot confirm receipt: Order status is "%". Only delivered orders can be confirmed.', v_order.status;
  END IF;

  -- 6. Transition Order to COMPLETED & Release Escrow
  UPDATE public.orders
  SET status = 'completed',
      payment_status = 'released_to_farmer',
      updated_at = now()
  WHERE id = p_order_id
  RETURNING * INTO v_order;

  -- 7. Transition linked logistics assignment
  UPDATE public.logistics_assignments
  SET status = 'completed',
      updated_at = now()
  WHERE order_id = p_order_id;

  RETURN jsonb_build_object(
    'success', true,
    'order_id', p_order_id,
    'status', 'completed',
    'payment_status', 'released_to_farmer',
    'order', to_jsonb(v_order)
  );
END;
$$;

-- ------------------------------------------------------------------------------
-- 6. TRIGGER 1: NEW LISTING -> NOTIFY REGIONAL CONSUMERS
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.trg_listing_created()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_farmer_name TEXT;
  v_farmer_district TEXT;
BEGIN
  -- Retrieve farmer profile details
  SELECT full_name, district INTO v_farmer_name, v_farmer_district
  FROM public.profiles
  WHERE id = NEW.farmer_id;

  -- Fan-out notification to consumers in the same district (or global buyers if district is null)
  INSERT INTO public.notifications (user_id, type, title, body, data)
  SELECT
    c.id,
    'new_listing',
    'Fresh produce available',
    format('%s: %s %s of %s at ₹%s/%s',
           COALESCE(v_farmer_name, 'Verified Farmer'),
           NEW.available_quantity,
           NEW.unit,
           NEW.produce_name,
           NEW.price_per_unit,
           NEW.unit),
    jsonb_build_object(
      'listing_id', NEW.id,
      'crop_name', NEW.produce_name,
      'farmer_name', COALESCE(v_farmer_name, 'Verified Farmer'),
      'quantity', NEW.available_quantity,
      'unit', NEW.unit,
      'price', NEW.price_per_unit,
      'district', COALESCE(v_farmer_district, '')
    )
  FROM public.profiles c
  WHERE c.role IN ('consumer', 'buyer')
    AND c.id <> NEW.farmer_id
    AND (
      v_farmer_district IS NULL 
      OR c.district IS NULL 
      OR LOWER(c.district) = LOWER(v_farmer_district)
    );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_listing_created ON public.produce_listings;
CREATE TRIGGER trigger_listing_created
  AFTER INSERT ON public.produce_listings
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_listing_created();

-- ------------------------------------------------------------------------------
-- 7. TRIGGER 2: ORDER PLACED -> NOTIFY SELLER FARMER
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.trg_order_placed()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.farmer_id IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, type, title, body, data)
    VALUES (
      NEW.farmer_id,
      'order_received',
      'New Order Received',
      format('New order #%s received for %s kg of %s (Total: ₹%s).',
             COALESCE(NEW.order_number, NEW.id),
             COALESCE(NEW.quantity, NEW.quantity_kg, 0),
             COALESCE(NEW.commodity, 'Produce'),
             NEW.total_amount),
      jsonb_build_object(
        'order_id', NEW.id,
        'order_number', COALESCE(NEW.order_number, NEW.id),
        'listing_id', NEW.listing_id,
        'commodity', NEW.commodity,
        'quantity', COALESCE(NEW.quantity, NEW.quantity_kg, 0),
        'total_amount', NEW.total_amount
      )
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_order_placed ON public.orders;
CREATE TRIGGER trigger_order_placed
  AFTER INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_order_placed();

-- ------------------------------------------------------------------------------
-- 8. TRIGGER 3: ORDER STATUS UPDATED -> NOTIFY BUYER / LOGISTICS / FARMER
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.trg_order_status_updated()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_buyer_id UUID;
  v_order_num TEXT;
  v_farmer_district TEXT;
BEGIN
  IF OLD.status IS NOT DISTINCT FROM NEW.status THEN
    RETURN NEW;
  END IF;

  v_buyer_id := COALESCE(NEW.customer_id, NEW.buyer_id);
  v_order_num := COALESCE(NEW.order_number, NEW.id);

  -- Farmer accepted order
  IF NEW.status IN ('accepted', 'confirmed') AND v_buyer_id IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, type, title, body, data)
    VALUES (
      v_buyer_id,
      'order_accepted',
      'Order Accepted',
      format('Farmer accepted your order #%s. Payment locked in escrow.', v_order_num),
      jsonb_build_object('order_id', NEW.id, 'order_number', v_order_num, 'status', NEW.status)
    );

  -- Farmer rejected order
  ELSIF NEW.status = 'rejected' AND v_buyer_id IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, type, title, body, data)
    VALUES (
      v_buyer_id,
      'order_rejected',
      'Order Rejected',
      format('Order #%s was rejected by the farmer. Full escrow refund processed.', v_order_num),
      jsonb_build_object('order_id', NEW.id, 'order_number', v_order_num, 'status', NEW.status)
    );

  -- Farmer preparing order
  ELSIF NEW.status = 'preparing' AND v_buyer_id IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, type, title, body, data)
    VALUES (
      v_buyer_id,
      'order_preparing',
      'Order Preparing',
      format('Order #%s is being harvested, graded, and packed for pickup.', v_order_num),
      jsonb_build_object('order_id', NEW.id, 'order_number', v_order_num, 'status', NEW.status)
    );

  -- Farmer marks Ready for Pickup -> Notify Regional Logistics Fleet Operators
  ELSIF NEW.status = 'ready_for_pickup' THEN
    -- A) Notify consumer
    IF v_buyer_id IS NOT NULL THEN
      INSERT INTO public.notifications (user_id, type, title, body, data)
      VALUES (
        v_buyer_id,
        'ready_for_pickup',
        'Ready for Pickup',
        format('Order #%s is packed and ready for logistics dispatch.', v_order_num),
        jsonb_build_object('order_id', NEW.id, 'order_number', v_order_num, 'status', NEW.status)
      );
    END IF;

    -- B) Notify nearby logistics operators
    SELECT district INTO v_farmer_district FROM public.profiles WHERE id = NEW.farmer_id;

    INSERT INTO public.notifications (user_id, type, title, body, data)
    SELECT
      p.id,
      'dispatch_ready',
      'Dispatch Available',
      format('Shipment available for pickup: %s kg of %s at %s.',
             COALESCE(NEW.quantity, NEW.quantity_kg, 0),
             COALESCE(NEW.commodity, 'Produce'),
             COALESCE(NEW.delivery_address, 'Origin Farm')),
      jsonb_build_object(
        'order_id', NEW.id,
        'order_number', v_order_num,
        'quantity', COALESCE(NEW.quantity, NEW.quantity_kg, 0),
        'commodity', NEW.commodity,
        'farmer_id', NEW.farmer_id,
        'district', v_farmer_district
      )
    FROM public.profiles p
    WHERE p.role IN ('logistics', 'logistics_operator')
      AND (
        v_farmer_district IS NULL 
        OR p.district IS NULL 
        OR LOWER(p.district) = LOWER(v_farmer_district)
      );

  -- Consumer confirmed receipt -> Notify Farmer
  ELSIF NEW.status = 'completed' AND NEW.farmer_id IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, type, title, body, data)
    VALUES (
      NEW.farmer_id,
      'order_completed',
      'Order Completed',
      format('Buyer confirmed receipt of order #%s! Escrow released to your account.', v_order_num),
      jsonb_build_object('order_id', NEW.id, 'order_number', v_order_num, 'status', NEW.status)
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_order_status_updated ON public.orders;
CREATE TRIGGER trigger_order_status_updated
  AFTER UPDATE OF status ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_order_status_updated();

-- ------------------------------------------------------------------------------
-- 9. TRIGGER 4: LOGISTICS ASSIGNMENT STATUS UPDATED -> NOTIFY FARMER & BUYER
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.trg_assignment_status_updated()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order RECORD;
  v_buyer_id UUID;
  v_order_num TEXT;
  v_driver_name TEXT;
BEGIN
  IF OLD.status IS NOT DISTINCT FROM NEW.status THEN
    RETURN NEW;
  END IF;

  SELECT * INTO v_order FROM public.orders WHERE id = NEW.order_id;
  IF NOT FOUND THEN
    RETURN NEW;
  END IF;

  v_buyer_id := COALESCE(v_order.customer_id, v_order.buyer_id);
  v_order_num := COALESCE(v_order.order_number, v_order.id);

  IF NEW.operator_id IS NOT NULL THEN
    SELECT full_name INTO v_driver_name FROM public.profiles WHERE id = NEW.operator_id;
  END IF;
  v_driver_name := COALESCE(v_driver_name, 'Assigned Driver');

  -- Driver assigned to pickup
  IF NEW.status IN ('assigned', 'heading_to_pickup') THEN
    IF v_order.farmer_id IS NOT NULL THEN
      INSERT INTO public.notifications (user_id, type, title, body, data)
      VALUES (
        v_order.farmer_id,
        'driver_assigned',
        'Driver Assigned',
        format('%s (%s) is heading to pick up order #%s.', v_driver_name, NEW.vehicle_number, v_order_num),
        jsonb_build_object('order_id', v_order.id, 'order_number', v_order_num, 'assignment_id', NEW.id, 'status', NEW.status)
      );
    END IF;

    IF v_buyer_id IS NOT NULL THEN
      INSERT INTO public.notifications (user_id, type, title, body, data)
      VALUES (
        v_buyer_id,
        'driver_assigned',
        'Driver Assigned',
        format('Reefer fleet driver %s is assigned to your order #%s.', v_driver_name, v_order_num),
        jsonb_build_object('order_id', v_order.id, 'order_number', v_order_num, 'assignment_id', NEW.id, 'status', NEW.status)
      );
    END IF;

  -- Picked up
  ELSIF NEW.status = 'picked_up' THEN
    IF v_order.farmer_id IS NOT NULL THEN
      INSERT INTO public.notifications (user_id, type, title, body, data)
      VALUES (
        v_order.farmer_id,
        'picked_up',
        'Produce Picked Up',
        format('Produce for order #%s was loaded onto reefer %s.', v_order_num, NEW.vehicle_number),
        jsonb_build_object('order_id', v_order.id, 'order_number', v_order_num, 'assignment_id', NEW.id, 'status', NEW.status)
      );
    END IF;

    IF v_buyer_id IS NOT NULL THEN
      INSERT INTO public.notifications (user_id, type, title, body, data)
      VALUES (
        v_buyer_id,
        'picked_up',
        'Produce Picked Up',
        format('Your order #%s has been loaded and dispatched from the farm.', v_order_num),
        jsonb_build_object('order_id', v_order.id, 'order_number', v_order_num, 'assignment_id', NEW.id, 'status', NEW.status)
      );
    END IF;

  -- In Transit
  ELSIF NEW.status = 'in_transit' THEN
    IF v_order.farmer_id IS NOT NULL THEN
      INSERT INTO public.notifications (user_id, type, title, body, data)
      VALUES (
        v_order.farmer_id,
        'in_transit',
        'Shipment In Transit',
        format('Order #%s is en route with live reefer telemetry active.', v_order_num),
        jsonb_build_object('order_id', v_order.id, 'order_number', v_order_num, 'assignment_id', NEW.id, 'status', NEW.status)
      );
    END IF;

    IF v_buyer_id IS NOT NULL THEN
      INSERT INTO public.notifications (user_id, type, title, body, data)
      VALUES (
        v_buyer_id,
        'in_transit',
        'Shipment In Transit',
        format('Order #%s is en route. Live GPS and cold-chain telemetry active.', v_order_num),
        jsonb_build_object('order_id', v_order.id, 'order_number', v_order_num, 'assignment_id', NEW.id, 'status', NEW.status)
      );
    END IF;

  -- Delivered (With Photo Proof)
  ELSIF NEW.status = 'delivered' THEN
    IF v_order.farmer_id IS NOT NULL THEN
      INSERT INTO public.notifications (user_id, type, title, body, data)
      VALUES (
        v_order.farmer_id,
        'delivered',
        'Shipment Delivered',
        format('Order #%s has been delivered at destination with proof photo.', v_order_num),
        jsonb_build_object(
          'order_id', v_order.id,
          'order_number', v_order_num,
          'assignment_id', NEW.id,
          'proof_photo_path', NEW.proof_photo_path,
          'status', NEW.status
        )
      );
    END IF;

    IF v_buyer_id IS NOT NULL THEN
      INSERT INTO public.notifications (user_id, type, title, body, data)
      VALUES (
        v_buyer_id,
        'delivered',
        'Shipment Delivered',
        format('Order #%s has arrived! Please inspect the delivery proof photo and confirm receipt.', v_order_num),
        jsonb_build_object(
          'order_id', v_order.id,
          'order_number', v_order_num,
          'assignment_id', NEW.id,
          'proof_photo_path', NEW.proof_photo_path,
          'status', NEW.status
        )
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_assignment_status_updated ON public.logistics_assignments;
CREATE TRIGGER trigger_assignment_status_updated
  AFTER UPDATE OF status ON public.logistics_assignments
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_assignment_status_updated();

-- ------------------------------------------------------------------------------
-- 10. GRANTS
-- ------------------------------------------------------------------------------
GRANT EXECUTE ON FUNCTION public.driver_update_delivery_status(UUID, TEXT, TEXT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.consumer_confirm_receipt(TEXT) TO authenticated, service_role;
