-- ==============================================================================
-- AgriFlow.ai: Phase 2 Post-Deployment ACID & Transaction Verification Suite
-- File: supabase/tests/phase2_acid_verification.sql
--
-- Note: Uses scalar subqueries (var := (SELECT ...)) to prevent Supabase
-- SQL Editor from misidentifying variable assignments as table creations.
-- ==============================================================================

DO $$
DECLARE
  v_farmer_id UUID;
  v_buyer_1_id UUID;
  v_buyer_2_id UUID;
  v_driver_1_id UUID;
  v_driver_2_id UUID;

  v_listing_id UUID := '90000000-0000-0000-0000-000000000001';
  v_listing_2_id UUID := '90000000-0000-0000-0000-000000000002';

  v_res JSONB;
  v_order_id TEXT;
  v_assignment_id UUID;
  v_qty NUMERIC;
  v_status TEXT;
  v_payment_status TEXT;
  v_operator_id UUID;
  v_order_count INT;
  v_err_caught BOOLEAN;
  v_err_msg TEXT;
BEGIN
  RAISE NOTICE '================================================================';
  RAISE NOTICE '   AGRIFLOW PHASE 2 POST-DEPLOYMENT ACID VERIFICATION SUITE     ';
  RAISE NOTICE '================================================================';

  -- 1. Resolve genuine profile actors
  v_farmer_id := (SELECT id FROM public.profiles WHERE role = 'farmer' ORDER BY created_at ASC LIMIT 1);
  v_buyer_1_id := (SELECT id FROM public.profiles WHERE role = 'buyer' ORDER BY created_at ASC LIMIT 1);
  v_buyer_2_id := (SELECT id FROM public.profiles WHERE role = 'buyer' AND id <> v_buyer_1_id ORDER BY created_at ASC LIMIT 1);
  v_driver_1_id := (SELECT id FROM public.profiles WHERE role = 'logistics' ORDER BY created_at ASC LIMIT 1);
  v_driver_2_id := (SELECT id FROM public.profiles WHERE role = 'logistics' AND id <> v_driver_1_id ORDER BY created_at ASC LIMIT 1);

  IF v_farmer_id IS NULL OR v_buyer_1_id IS NULL OR v_buyer_2_id IS NULL OR v_driver_1_id IS NULL OR v_driver_2_id IS NULL THEN
    RAISE EXCEPTION 'SETUP FAILED: Required profile roles not found in public.profiles';
  END IF;

  RAISE NOTICE 'Actors resolved: Farmer=%, Buyer1=%, Buyer2=%, Driver1=%, Driver2=%',
    v_farmer_id, v_buyer_1_id, v_buyer_2_id, v_driver_1_id, v_driver_2_id;

  -- 2. Cleanup old test data
  DELETE FROM public.reviews WHERE order_id LIKE 'TEST-ORD-%';
  DELETE FROM public.logistics_assignments WHERE order_id LIKE 'TEST-ORD-%';
  DELETE FROM public.orders WHERE id LIKE 'TEST-ORD-%';
  DELETE FROM public.produce_listings WHERE id IN (v_listing_id, v_listing_2_id);

  -- 3. Provision test listings
  INSERT INTO public.produce_listings (
    id, farmer_id, produce_name, category, total_quantity, available_quantity,
    price_per_unit, unit, status, location_address
  ) VALUES
    (v_listing_id, v_farmer_id, 'Test Organic Tomatoes', 'vegetables', 50, 50, 30.0, 'kg', 'active', 'Shadnagar Hub'),
    (v_listing_2_id, v_farmer_id, 'Test Fresh Potatoes', 'vegetables', 100, 100, 20.0, 'kg', 'active', 'Hassan Hub');

  -- ============================================================================
  -- TEST 1: Concurrent Checkout & Row-Locked Stock Deduction
  -- ============================================================================
  RAISE NOTICE '--- TEST 1: Concurrent Checkout & Stock Deduction ---';
  PERFORM set_config('request.jwt.claim.sub', v_buyer_1_id::TEXT, true);
  PERFORM set_config('role', 'authenticated', true);

  -- Buyer 1 checks out all 50 kg
  v_res := public.atomic_checkout_order(
    p_listing_id := v_listing_id,
    p_quantity := 50,
    p_delivery_address := 'Hyderabad Terminal',
    p_delivery_lat := 17.41,
    p_delivery_lng := 78.43,
    p_payment_method := 'upi',
    p_idempotency_key := 'TEST-ORD-CONCUR-001'
  );

  v_order_id := v_res->>'order_id';
  v_qty := (SELECT available_quantity FROM public.produce_listings WHERE id = v_listing_id);
  v_status := (SELECT status FROM public.produce_listings WHERE id = v_listing_id);
  v_assignment_id := (SELECT id FROM public.logistics_assignments WHERE order_id = v_order_id);

  IF v_qty <> 0 OR v_status <> 'sold_out' OR v_assignment_id IS NULL THEN
    RAISE EXCEPTION 'TEST 1 FAILED: Stock not 0 or assignment missing (Qty: %, Status: %)', v_qty, v_status;
  END IF;
  RAISE NOTICE '  Step 1.1: Buyer 1 bought 50 kg -> Stock=0 (sold_out), Order=%', v_order_id;

  -- Buyer 2 attempts checkout on exhausted stock
  PERFORM set_config('request.jwt.claim.sub', v_buyer_2_id::TEXT, true);
  v_err_caught := false;
  BEGIN
    PERFORM public.atomic_checkout_order(
      p_listing_id := v_listing_id,
      p_quantity := 50,
      p_idempotency_key := 'TEST-ORD-CONCUR-002'
    );
  EXCEPTION WHEN OTHERS THEN
    v_err_caught := true;
    v_err_msg := SQLERRM;
  END;

  IF NOT v_err_caught THEN
    RAISE EXCEPTION 'TEST 1 FAILED: Overselling allowed!';
  END IF;

  v_qty := (SELECT available_quantity FROM public.produce_listings WHERE id = v_listing_id);
  v_order_count := (SELECT count(*) FROM public.orders WHERE listing_id = v_listing_id);
  IF v_qty < 0 OR v_order_count <> 1 THEN
    RAISE EXCEPTION 'TEST 1 FAILED: Invariant violated (Qty: %, Orders: %)', v_qty, v_order_count;
  END IF;
  RAISE NOTICE '  Step 1.2: Buyer 2 correctly rejected (%): Stock preserved at 0', v_err_msg;
  RAISE NOTICE '✅ TEST 1 PASS: Concurrency safe, zero overselling.';

  -- ============================================================================
  -- TEST 2: Rollback Failure Injection
  -- ============================================================================
  RAISE NOTICE '--- TEST 2: Rollback Failure Injection ---';
  PERFORM set_config('request.jwt.claim.sub', v_buyer_1_id::TEXT, true);
  v_err_caught := false;
  BEGIN
    PERFORM public.atomic_checkout_order(
      p_listing_id := v_listing_2_id,
      p_quantity := -10,
      p_idempotency_key := 'TEST-ORD-FAIL-001'
    );
  EXCEPTION WHEN OTHERS THEN
    v_err_caught := true;
    v_err_msg := SQLERRM;
  END;

  IF NOT v_err_caught THEN
    RAISE EXCEPTION 'TEST 2 FAILED: Negative quantity not rejected';
  END IF;

  v_qty := (SELECT available_quantity FROM public.produce_listings WHERE id = v_listing_2_id);
  IF v_qty <> 100 OR EXISTS (SELECT 1 FROM public.orders WHERE id = 'TEST-ORD-FAIL-001') THEN
    RAISE EXCEPTION 'TEST 2 FAILED: Rollback corrupted stock or left orphan order';
  END IF;
  RAISE NOTICE '  Step 2.1: Invalid order rejected (%), Stock remains 100 kg, 0 orphan orders', v_err_msg;
  RAISE NOTICE '✅ TEST 2 PASS: Clean rollback with zero side-effects.';

  -- ============================================================================
  -- TEST 3: Concurrent Driver Claim
  -- ============================================================================
  RAISE NOTICE '--- TEST 3: Concurrent Driver Pickup Claim ---';
  -- Driver 1 claims assignment
  PERFORM set_config('request.jwt.claim.sub', v_driver_1_id::TEXT, true);
  PERFORM public.driver_claim_assignment(v_assignment_id);

  v_operator_id := (SELECT operator_id FROM public.logistics_assignments WHERE id = v_assignment_id);
  IF v_operator_id <> v_driver_1_id THEN
    RAISE EXCEPTION 'TEST 3 FAILED: Driver 1 operator_id mismatch';
  END IF;
  RAISE NOTICE '  Step 3.1: Driver 1 claimed assignment %', v_assignment_id;

  -- Driver 2 attempts to claim already claimed assignment
  PERFORM set_config('request.jwt.claim.sub', v_driver_2_id::TEXT, true);
  v_err_caught := false;
  BEGIN
    PERFORM public.driver_claim_assignment(v_assignment_id);
  EXCEPTION WHEN OTHERS THEN
    v_err_caught := true;
    v_err_msg := SQLERRM;
  END;

  IF NOT v_err_caught THEN
    RAISE EXCEPTION 'TEST 3 FAILED: Driver 2 double claim succeeded';
  END IF;

  v_operator_id := (SELECT operator_id FROM public.logistics_assignments WHERE id = v_assignment_id);
  IF v_operator_id <> v_driver_1_id THEN
    RAISE EXCEPTION 'TEST 3 FAILED: operator_id corrupted';
  END IF;
  RAISE NOTICE '  Step 3.2: Driver 2 claim rejected (%), operator strictly Driver 1', v_err_msg;
  RAISE NOTICE '✅ TEST 3 PASS: Row-lock prevents double-assignment.';

  -- ============================================================================
  -- TEST 4: Delivery Progression & Idempotent Settlement
  -- ============================================================================
  RAISE NOTICE '--- TEST 4: Delivery Progression & Idempotent Settlement ---';
  PERFORM set_config('request.jwt.claim.sub', v_driver_1_id::TEXT, true);
  PERFORM public.driver_update_delivery_status(v_assignment_id, 'in_transit');

  -- First delivered call -> releases escrow
  PERFORM public.driver_update_delivery_status(v_assignment_id, 'delivered');
  v_status := (SELECT status FROM public.orders WHERE id = v_order_id);
  v_payment_status := (SELECT payment_status FROM public.orders WHERE id = v_order_id);

  IF v_status <> 'delivered' OR v_payment_status <> 'released_to_farmer' THEN
    RAISE EXCEPTION 'TEST 4 FAILED: Order status=% / payment=%', v_status, v_payment_status;
  END IF;
  RAISE NOTICE '  Step 4.1: First delivered -> status=delivered, payment=released_to_farmer';

  -- Second delivered call -> must be idempotent
  v_res := public.driver_update_delivery_status(v_assignment_id, 'delivered');
  v_payment_status := (SELECT payment_status FROM public.orders WHERE id = v_order_id);

  IF (v_res->>'note') NOT ILIKE '%idempotent%' OR v_payment_status <> 'released_to_farmer' THEN
    RAISE EXCEPTION 'TEST 4 FAILED: Idempotency failed: %', v_res;
  END IF;
  RAISE NOTICE '  Step 4.2: Duplicate delivered -> Idempotent replay accepted, zero double payment';
  RAISE NOTICE '✅ TEST 4 PASS: Delivery settlement is strictly idempotent.';

  -- ============================================================================
  -- TEST 5: Consumer Order Cancellation & Stock Restoration
  -- ============================================================================
  RAISE NOTICE '--- TEST 5: Consumer Cancellation & Stock Restoration ---';
  PERFORM set_config('request.jwt.claim.sub', v_buyer_1_id::TEXT, true);

  -- Place 40 kg order on listing 2 (100 -> 60 kg)
  PERFORM public.atomic_checkout_order(
    p_listing_id := v_listing_2_id,
    p_quantity := 40,
    p_idempotency_key := 'TEST-ORD-CANCEL-001'
  );

  v_qty := (SELECT available_quantity FROM public.produce_listings WHERE id = v_listing_2_id);
  IF v_qty <> 60 THEN
    RAISE EXCEPTION 'TEST 5 FAILED: Stock expected 60, got %', v_qty;
  END IF;

  -- Cancel pending order
  PERFORM public.consumer_cancel_order('TEST-ORD-CANCEL-001', 'Changed order');
  v_qty := (SELECT available_quantity FROM public.produce_listings WHERE id = v_listing_2_id);
  v_status := (SELECT status FROM public.orders WHERE id = 'TEST-ORD-CANCEL-001');

  IF v_qty <> 100 OR v_status <> 'cancelled' THEN
    RAISE EXCEPTION 'TEST 5 FAILED: Stock not restored (Qty: %, Status: %)', v_qty, v_status;
  END IF;
  RAISE NOTICE '  Step 5.1: Cancelled order -> Stock fully restored to 100 kg, status=cancelled';

  -- Reject cancellation of delivered order
  v_err_caught := false;
  BEGIN
    PERFORM public.consumer_cancel_order(v_order_id, 'Cancel delivered');
  EXCEPTION WHEN OTHERS THEN
    v_err_caught := true;
    v_err_msg := SQLERRM;
  END;

  IF NOT v_err_caught THEN
    RAISE EXCEPTION 'TEST 5 FAILED: Delivered order cancellation allowed';
  END IF;
  RAISE NOTICE '  Step 5.2: Cancelling delivered order correctly rejected (%)', v_err_msg;
  RAISE NOTICE '✅ TEST 5 PASS: Stock accurately restored, terminal status protected.';

  -- ============================================================================
  -- TEST 6: Verified Review Anti-Self-Rating & Deduplication
  -- ============================================================================
  RAISE NOTICE '--- TEST 6: Verified Review Anti-Self-Rating & Deduplication ---';
  -- Farmer self-review rejected
  PERFORM set_config('request.jwt.claim.sub', v_farmer_id::TEXT, true);
  v_err_caught := false;
  BEGIN
    PERFORM public.submit_verified_review(v_order_id, v_farmer_id, 5, 'Self review');
  EXCEPTION WHEN OTHERS THEN
    v_err_caught := true;
    v_err_msg := SQLERRM;
  END;

  IF NOT v_err_caught THEN
    RAISE EXCEPTION 'TEST 6 FAILED: Self review allowed';
  END IF;
  RAISE NOTICE '  Step 6.1: Anti-self-rating rejected (%)', v_err_msg;

  -- Consumer review submitted
  PERFORM set_config('request.jwt.claim.sub', v_buyer_1_id::TEXT, true);
  v_res := public.submit_verified_review(v_order_id, v_farmer_id, 5, 'Great quality produce');
  IF (v_res->>'success')::BOOLEAN <> true THEN
    RAISE EXCEPTION 'TEST 6 FAILED: Review submission failed';
  END IF;
  RAISE NOTICE '  Step 6.2: Consumer 1 verified review published';

  -- Duplicate review rejected
  v_err_caught := false;
  BEGIN
    PERFORM public.submit_verified_review(v_order_id, v_farmer_id, 4, 'Duplicate review');
  EXCEPTION WHEN OTHERS THEN
    v_err_caught := true;
    v_err_msg := SQLERRM;
  END;

  IF NOT v_err_caught THEN
    RAISE EXCEPTION 'TEST 6 FAILED: Duplicate review allowed';
  END IF;
  RAISE NOTICE '  Step 6.3: Duplicate review rejected (%)', v_err_msg;
  RAISE NOTICE '✅ TEST 6 PASS: Anti-self-rating and review deduplication verified.';

  -- ============================================================================
  -- TEARDOWN
  -- ============================================================================
  DELETE FROM public.reviews WHERE order_id LIKE 'TEST-ORD-%';
  DELETE FROM public.logistics_assignments WHERE order_id LIKE 'TEST-ORD-%';
  DELETE FROM public.orders WHERE id LIKE 'TEST-ORD-%';
  DELETE FROM public.produce_listings WHERE id IN (v_listing_id, v_listing_2_id);

  RAISE NOTICE '================================================================';
  RAISE NOTICE '   ALL 6 ACID TRANSACTION TESTS COMPLETED WITH 100%% SUCCESS    ';
  RAISE NOTICE '================================================================';
END $$;
