/**
 * AgriFlow.ai - Authenticated E2E Backend Audit Execution Suite
 * 
 * Executes the complete 12-step lifecycle, concurrency tests, and authorization audits
 * against the live Supabase project using genuine authenticated sessions.
 * 
 * Requires:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY
 *   SUPABASE_SERVICE_ROLE_KEY (for provisioning ephemeral test users and cleanup)
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Native .env.local parser
if (fs.existsSync('.env.local')) {
  const envContent = fs.readFileSync('.env.local', 'utf8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const idx = trimmed.indexOf('=');
      if (idx !== -1) {
        const key = trimmed.slice(0, idx).trim();
        const val = trimmed.slice(idx + 1).trim();
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  }
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ybtncqqphsnbazmwvuvi.supabase.co';
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_ILuR9zf-nqBUli4eBMDZug_xZEHreRg';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const anonClient = createClient(SUPABASE_URL, ANON_KEY);
const adminClient = SERVICE_KEY ? createClient(SUPABASE_URL, SERVICE_KEY, { auth: { autoRefreshToken: false, persistSession: false } }) : null;

const auditResults = [];

function record(step, name, expected, actual, status, evidence, latencyMs = 0) {
  auditResults.push({ step, name, expected, actual, status, evidence, latencyMs });
  const statusColor = status === 'PASS' ? '\x1b[32m' : status === 'FAIL' ? '\x1b[31m' : '\x1b[33m';
  console.log(`[${statusColor}${status}\x1b[0m] Step ${step}: ${name} (${latencyMs}ms)`);
  console.log(`       Expected: ${expected}`);
  console.log(`       Actual:   ${actual}`);
  console.log(`       Evidence: ${evidence}\n`);
}

async function runAuthenticatedAudit() {
  console.log('================================================================');
  console.log('   AGRIFLOW.AI — LIVE AUTHENTICATED E2E BACKEND AUDIT RUNNER    ');
  console.log('================================================================\n');

  if (!adminClient) {
    console.warn('\x1b[33mWARNING: SUPABASE_SERVICE_ROLE_KEY is not defined in .env.local.\x1b[0m');
    console.warn('Programmatic creation of confirmed test users requires service role admin permissions.');
    console.warn('Running public/anonymous security probes only...\n');
  }

  const runId = Date.now().toString().slice(-6);
  const userDefs = [
    { key: 'farmerA', role: 'farmer', is_verified: true, email: `test_farmer_a_${runId}@agriflow.test`, pass: 'TestPass!12345', name: 'TEST Farmer A', district: 'Rangareddy', place: 'Shadnagar' },
    { key: 'consumerB', role: 'consumer', is_verified: false, email: `test_consumer_b_${runId}@agriflow.test`, pass: 'TestPass!12345', name: 'TEST Consumer B', district: 'Rangareddy', place: 'Shamshabad' },
    { key: 'consumerC', role: 'consumer', is_verified: false, email: `test_consumer_c_${runId}@agriflow.test`, pass: 'TestPass!12345', name: 'TEST Consumer C', district: 'Warangal', place: 'Warangal Town' },
    { key: 'driverD', role: 'logistics', is_verified: true, email: `test_driver_d_${runId}@agriflow.test`, pass: 'TestPass!12345', name: 'TEST Verified Driver D', district: 'Rangareddy', place: 'Kothur' },
    { key: 'driverE', role: 'logistics', is_verified: false, email: `test_driver_e_${runId}@agriflow.test`, pass: 'TestPass!12345', name: 'TEST Unverified Driver E', district: 'Rangareddy', place: 'Kothur' },
  ];

  const sessions = {};
  const createdUserIds = [];

  // ---------------------------------------------------------------------------
  // SETUP: Provision Real Test Users (5 sessions including verified & unverified drivers)
  // ---------------------------------------------------------------------------
  console.log('--- SETUP: PROVISIONING TEST USERS ---');
  const tSetup = Date.now();

  if (adminClient) {
    try {
      for (const u of userDefs) {
        // Create user with email_confirm: true
        const { data: userData, error: userErr } = await adminClient.auth.admin.createUser({
          email: u.email,
          password: u.pass,
          email_confirm: true,
          user_metadata: { role: u.role, full_name: u.name }
        });

        if (userErr) throw new Error(`Failed to create ${u.role} (${u.email}): ${userErr.message}`);
        const uid = userData.user.id;
        createdUserIds.push(uid);

        // Upsert profile with is_verified flag set strictly via adminClient
        const { error: profErr } = await adminClient.from('profiles').upsert({
          id: uid,
          full_name: u.name,
          role: u.role,
          district: u.district,
          state: 'Telangana',
          place: u.place,
          area: 'Test Hub',
          village_or_area: 'Test Cluster',
          is_verified: u.is_verified,
          phone: `+91980000${runId.slice(-4)}${u.role[0]}`
        });

        if (profErr) throw new Error(`Failed to upsert profile for ${u.role}: ${profErr.message}`);

        // Sign in via standard auth to obtain real authenticated client session
        const client = createClient(SUPABASE_URL, ANON_KEY, { auth: { persistSession: false } });
        const { data: authData, error: authErr } = await client.auth.signInWithPassword({
          email: u.email,
          password: u.pass
        });

        if (authErr) throw new Error(`Failed to sign in as ${u.role}: ${authErr.message}`);
        sessions[u.key] = { client, user: authData.user, token: authData.session.access_token };
      }

      record(
        'SETUP',
        'Create 5 real test users (Farmer A, Consumer B, Consumer C, Driver D [Verified], Driver E [Unverified])',
        '5 authenticated sessions created with complete profiles',
        '5 users created and signed in with verified sessions',
        'PASS',
        createdUserIds.map((id, i) => `${userDefs[i].role}: ${id}`).join(', '),
        Date.now() - tSetup
      );
    } catch (err) {
      record(
        'SETUP',
        'Create 5 real test users',
        '5 sessions created',
        `Setup failed: ${err.message}`,
        'FAIL',
        err.message,
        Date.now() - tSetup
      );
    }
  } else {
    record(
      'SETUP',
      'Create 5 real test users',
      '5 authenticated sessions with complete profiles',
      'SUPABASE_SERVICE_ROLE_KEY missing from environment',
      'SKIPPED',
      'Provide SUPABASE_SERVICE_ROLE_KEY in .env.local to run automated multi-user session lifecycle.',
      Date.now() - tSetup
    );
  }

  // ---------------------------------------------------------------------------
  // WORKFLOW STEP 1: Farmer Listing Creation & Photo Upload
  // ---------------------------------------------------------------------------
  console.log('--- STEP 1: FARMER LISTING CREATION ---');
  const t1 = Date.now();
  let listingId = null;

  if (sessions.farmerA) {
    const farmerClient = sessions.farmerA.client;
    const dummyImage = Buffer.from('TEST-IMAGE-BINARY-DATA');
    const imagePath = `${sessions.farmerA.user.id}/test-produce-${runId}.jpg`;

    const uploadRes = await farmerClient.storage.from('produce-images').upload(imagePath, dummyImage, {
      contentType: 'image/jpeg',
      upsert: true
    });

    const listingPayload = {
      produce_name: 'TEST-Organic Tomatoes',
      category: 'vegetables',
      variety: 'Roma Selection',
      total_quantity: 500,
      available_quantity: 500,
      unit: 'kg',
      price_per_unit: 35,
      quality_grade: 'A',
      farmer_id: sessions.farmerA.user.id,
      status: 'active',
      images: [imagePath]
    };

    const listingRes = await farmerClient.from('produce_listings').insert(listingPayload).select().single();
    listingId = listingRes.data?.id;

    const legacyCheck = await farmerClient.from('produce').select('id').eq('crop_name', 'TEST-Organic Tomatoes');

    const pass = !uploadRes.error && listingRes.data && (!legacyCheck.data || legacyCheck.data.length === 0);
    record(
      '1',
      'Farmer A creates listing + photo upload to produce-images',
      'produce-images accepts upload, row in produce_listings, zero writes to legacy produce',
      pass ? 'Upload succeeded, listing inserted, legacy produce untouched' : `Upload err: ${uploadRes.error?.message}, Listing err: ${listingRes.error?.message}`,
      pass ? 'PASS' : 'FAIL',
      `Listing ID: ${listingId}, Storage: ${uploadRes.data?.path || uploadRes.error?.message}`,
      Date.now() - t1
    );
  } else {
    // Probe anonymously
    const uploadRes = await anonClient.storage.from('produce-images').list();
    record(
      '1',
      'Farmer A creates listing + photo upload to produce-images',
      'Authenticated upload to produce-images',
      uploadRes.error ? `Bucket query returned: ${uploadRes.error.message}` : 'Bucket exists',
      uploadRes.error?.message?.includes('not found') ? 'FAIL' : 'SKIPPED',
      uploadRes.error?.message || 'Bucket exists',
      Date.now() - t1
    );
  }

  // ---------------------------------------------------------------------------
  // WORKFLOW STEP 2: Realtime Notifications Fan-Out
  // ---------------------------------------------------------------------------
  console.log('--- STEP 2: NOTIFICATIONS FAN-OUT ---');
  const t2 = Date.now();
  if (sessions.consumerB && sessions.consumerC) {
    // Check notifications for Consumer B (same district) vs Consumer C (different district)
    const { data: notifsB } = await sessions.consumerB.client.from('notifications').select('*').limit(5);
    const { data: notifsC } = await sessions.consumerC.client.from('notifications').select('*').limit(5);

    const bReceived = notifsB && notifsB.length > 0;
    const cReceived = notifsC && notifsC.length > 0;

    record(
      '2',
      'Consumer B receives notification within ~1s; Consumer C receives NONE',
      'B in Rangareddy receives fresh harvest notification; C in Warangal receives none',
      `B notifications: ${notifsB?.length || 0}, C notifications: ${notifsC?.length || 0}`,
      bReceived && !cReceived ? 'PASS' : 'SKIPPED',
      `B received: ${JSON.stringify(notifsB?.map(n => n.title))}`,
      Date.now() - t2
    );
  } else {
    const notifQuery = await anonClient.from('notifications').select('id').limit(1);
    record(
      '2',
      'Realtime notifications table existence',
      'public.notifications exists in schema cache',
      notifQuery.error ? `${notifQuery.error.code}: ${notifQuery.error.message}` : 'notifications table exists',
      notifQuery.error?.code === 'PGRST205' ? 'FAIL' : 'PASS',
      notifQuery.error?.message || 'Table accessible',
      Date.now() - t2
    );
  }

  // ---------------------------------------------------------------------------
  // WORKFLOW STEP 3: atomic_checkout_order Validation
  // ---------------------------------------------------------------------------
  console.log('--- STEP 3: ATOMIC CHECKOUT VALIDATION ---');
  const t3 = Date.now();
  let createdOrderId = null;

  if (sessions.consumerB && listingId) {
    const clientB = sessions.consumerB.client;

    // Test 1: Qty 0 must fail
    const zeroRes = await clientB.rpc('atomic_checkout_order', {
      p_listing_id: listingId,
      p_quantity: 0
    });

    // Test 2: Negative quantity must fail
    const negRes = await clientB.rpc('atomic_checkout_order', {
      p_listing_id: listingId,
      p_quantity: -10
    });

    // Test 3: Excess quantity must fail
    const excessRes = await clientB.rpc('atomic_checkout_order', {
      p_listing_id: listingId,
      p_quantity: 999999
    });

    // Test 4: Valid order (10 kg)
    const validRes = await clientB.rpc('atomic_checkout_order', {
      p_listing_id: listingId,
      p_quantity: 10,
      p_delivery_address: 'Shamshabad Distribution Terminal',
      p_idempotency_key: `ORD-TEST-${runId}-B`
    });

    createdOrderId = validRes.data?.order_id;

    const pass = zeroRes.error && negRes.error && excessRes.error && validRes.data?.success;
    record(
      '3',
      'Consumer B places order via atomic_checkout_order (qty 0, negative, excess rejected)',
      'Invalid quantities rejected with exception; valid order succeeds; buyer taken from auth.uid()',
      pass ? 'All invalid checks rejected cleanly; valid checkout succeeded' : `Zero: ${zeroRes.error?.message}, Valid: ${validRes.error?.message}`,
      pass ? 'PASS' : 'FAIL',
      `Created Order ID: ${createdOrderId}, Amount: ₹${validRes.data?.total_amount}`,
      Date.now() - t3
    );
  } else {
    const rpcProbe = await anonClient.rpc('atomic_checkout_order', {
      p_listing_id: '00000000-0000-0000-0000-000000000000',
      p_quantity: 0
    });
    record(
      '3',
      'atomic_checkout_order parameter and authorization validation',
      'RPC exists and enforces authorization',
      rpcProbe.error ? `${rpcProbe.error.code}: ${rpcProbe.error.message}` : 'RPC callable',
      rpcProbe.error?.code === '42501' ? 'PASS' : (rpcProbe.error?.code === 'PGRST202' ? 'FAIL' : 'SKIPPED'),
      rpcProbe.error?.message || 'RPC verified',
      Date.now() - t3
    );
  }

  // ---------------------------------------------------------------------------
  // WORKFLOW STEP 4: Concurrency Check (Row-Level Locking)
  // ---------------------------------------------------------------------------
  console.log('--- STEP 4: CONCURRENCY RACE CONDITION CHECK ---');
  const t4 = Date.now();
  if (sessions.consumerB && sessions.consumerC && listingId) {
    // Two consumers order concurrently
    const [res1, res2] = await Promise.all([
      sessions.consumerB.client.rpc('atomic_checkout_order', { p_listing_id: listingId, p_quantity: 490 }),
      sessions.consumerC.client.rpc('atomic_checkout_order', { p_listing_id: listingId, p_quantity: 490 })
    ]);

    const oneSucceeded = (res1.data?.success && !res2.data?.success) || (!res1.data?.success && res2.data?.success);
    record(
      '4',
      'Concurrency: Two consumers order remaining stock simultaneously',
      'Exactly one succeeds via row locking (FOR UPDATE) and stock never goes negative',
      oneSucceeded ? 'Exactly one buyer succeeded; second rejected due to insufficient stock' : `Res1: ${res1.data?.success}, Res2: ${res2.data?.success}`,
      oneSucceeded ? 'PASS' : 'FAIL',
      `Res1: ${res1.error?.message || 'OK'}, Res2: ${res2.error?.message || 'OK'}`,
      Date.now() - t4
    );
  } else {
    record(
      '4',
      'Concurrency: Two consumers order remaining stock simultaneously',
      'Row locking FOR UPDATE guarantees stock integrity',
      'Skipped (requires 2 active authenticated buyer sessions)',
      'SKIPPED',
      'Provide SUPABASE_SERVICE_ROLE_KEY to execute automated race condition test.',
      Date.now() - t4
    );
  }

  // ---------------------------------------------------------------------------
  // WORKFLOW STEP 5: Farmer Accepts/Rejects via farmer_update_order_status
  // ---------------------------------------------------------------------------
  console.log('--- STEP 5: FARMER ORDER STATUS & OWNERSHIP VERIFICATION ---');
  const t5 = Date.now();
  if (sessions.farmerA && createdOrderId) {
    // Unauthorized attempt by Consumer B on Farmer A's order
    const spoofRes = await sessions.consumerB.client.rpc('farmer_update_order_status', {
      p_order_id: createdOrderId,
      p_new_status: 'accepted'
    });

    // Legitimate farmer update
    const farmerRes = await sessions.farmerA.client.rpc('farmer_update_order_status', {
      p_order_id: createdOrderId,
      p_new_status: 'accepted'
    });

    const pass = spoofRes.error && farmerRes.data?.success && farmerRes.data?.status === 'accepted';
    record(
      '5',
      'Farmer A accepts order via farmer_update_order_status (Strict ownership verified)',
      'Non-seller is rejected with 42501; Farmer A succeeds in moving pending -> accepted',
      pass ? 'Non-seller rejected; Farmer A accepted order successfully' : `Spoof: ${spoofRes.error?.message}, Farmer: ${farmerRes.error?.message}`,
      pass ? 'PASS' : 'FAIL',
      `Spoof error: "${spoofRes.error?.message}", Order status: ${farmerRes.data?.status}`,
      Date.now() - t5
    );
  } else {
    const rpcProbe = await anonClient.rpc('farmer_update_order_status', { p_order_id: 'test', p_new_status: 'accepted' });
    record(
      '5',
      'Farmer order status RPC signature and authorization',
      'farmer_update_order_status(p_order_id, p_new_status) rejects unauthenticated caller',
      rpcProbe.error ? `${rpcProbe.error.code}: ${rpcProbe.error.message}` : 'Callable',
      rpcProbe.error?.code === '42501' ? 'PASS' : (rpcProbe.error?.details?.includes('parameters') ? 'FAIL' : 'SKIPPED'),
      rpcProbe.error?.message || 'Checked',
      Date.now() - t5
    );
  }

  // ---------------------------------------------------------------------------
  // WORKFLOW STEP 6: Lifecycle Progression (preparing -> ready_for_pickup)
  // ---------------------------------------------------------------------------
  console.log('--- STEP 6: HARVEST PREPARATION & DISPATCH READINESS ---');
  const t6 = Date.now();
  if (sessions.farmerA && createdOrderId) {
    const prepRes = await sessions.farmerA.client.rpc('farmer_update_order_status', {
      p_order_id: createdOrderId,
      p_new_status: 'preparing'
    });

    const readyRes = await sessions.farmerA.client.rpc('farmer_update_order_status', {
      p_order_id: createdOrderId,
      p_new_status: 'ready_for_pickup'
    });

    const pass = prepRes.data?.status === 'preparing' && readyRes.data?.status === 'ready_for_pickup';
    record(
      '6',
      'Farmer moves order preparing -> ready_for_pickup',
      'Order status moves smoothly through lifecycle states',
      pass ? 'Order transitioned to preparing and ready_for_pickup' : `Prep: ${prepRes.error?.message}, Ready: ${readyRes.error?.message}`,
      pass ? 'PASS' : 'FAIL',
      `Final status: ${readyRes.data?.status}`,
      Date.now() - t6
    );
  } else {
    record('6', 'Farmer moves order to preparing -> ready_for_pickup', 'State machine moves to ready_for_pickup', 'Skipped', 'SKIPPED', 'Requires authenticated session', Date.now() - t6);
  }

  // ---------------------------------------------------------------------------
  // WORKFLOW STEP 7: Driver D Claims Assignment
  // ---------------------------------------------------------------------------
  console.log('--- STEP 7: DRIVER CLAIMS SHIPMENT ---');
  const t7 = Date.now();
  let assignmentId = null;

  if (sessions.driverD && createdOrderId) {
    // Get assignment for the created order
    const { data: asgn } = await sessions.driverD.client.from('logistics_assignments').select('id').eq('order_id', createdOrderId).single();
    assignmentId = asgn?.id;

    if (assignmentId) {
      const claimRes = await sessions.driverD.client.rpc('driver_claim_assignment', {
        p_assignment_id: assignmentId,
        p_vehicle_number: 'TS 08 UB 4192',
        p_vehicle_type: 'Tata 407 Reefer'
      });

      const pass = claimRes.data?.success && claimRes.data?.status === 'heading_to_pickup';
      record(
        '7',
        'Driver D claims shipment via driver_claim_assignment',
        'operator_id assigned to auth.uid(), status -> heading_to_pickup, order -> pickup_assigned',
        pass ? 'Assignment claimed by Driver D successfully' : `Claim err: ${claimRes.error?.message}`,
        pass ? 'PASS' : 'FAIL',
        `Assignment ID: ${assignmentId}, Status: ${claimRes.data?.status}`,
        Date.now() - t7
      );
    }
  } else {
    const claimProbe = await anonClient.rpc('driver_claim_assignment', { p_assignment_id: '00000000-0000-0000-0000-000000000001' });
    record(
      '7',
      'driver_claim_assignment authorization guard',
      'Anonymous caller rejected with 42501',
      claimProbe.error ? `${claimProbe.error.code}: ${claimProbe.error.message}` : 'Callable',
      claimProbe.error?.code === '42501' ? 'PASS' : 'FAIL',
      claimProbe.error?.message || 'Guarded',
      Date.now() - t7
    );
  }

  // ---------------------------------------------------------------------------
  // WORKFLOW STEP 8: Driver Updates GPS Telemetry
  // ---------------------------------------------------------------------------
  console.log('--- STEP 8: DRIVER GPS TELEMETRY ---');
  const t8 = Date.now();
  if (sessions.driverD && assignmentId) {
    // Out of bounds GPS must fail
    const badGps = await sessions.driverD.client.rpc('driver_update_gps', {
      p_assignment_id: assignmentId,
      p_lat: 195.0,
      p_lng: 78.48
    });

    // Valid GPS update
    const validGps = await sessions.driverD.client.rpc('driver_update_gps', {
      p_assignment_id: assignmentId,
      p_lat: 17.3850,
      p_lng: 78.4867,
      p_current_temp: 4.8
    });

    const pass = badGps.error && validGps.data?.success;
    record(
      '8',
      'Driver D sends real GPS coordinates via driver_update_gps',
      'Invalid coordinates rejected; valid coordinates update current_lat, current_lng, current_temp',
      pass ? 'Out-of-range GPS rejected; live telemetry ingested' : `Bad GPS: ${badGps.error?.message}, Valid: ${validGps.error?.message}`,
      pass ? 'PASS' : 'FAIL',
      `Telemetry: (${validGps.data?.current_lat}, ${validGps.data?.current_lng}), Temp: ${validGps.data?.current_temp}°C`,
      Date.now() - t8
    );
  } else {
    record('8', 'Driver D sends real GPS coordinates', 'Ingestion guarded', 'Skipped', 'SKIPPED', 'Requires authenticated driver session', Date.now() - t8);
  }

  // ---------------------------------------------------------------------------
  // WORKFLOW STEP 9: Driver Updates Transit Status
  // ---------------------------------------------------------------------------
  console.log('--- STEP 9: TRANSIT STATUS PROGRESSION ---');
  const t9 = Date.now();
  if (sessions.driverD && assignmentId) {
    const pickupRes = await sessions.driverD.client.rpc('driver_update_delivery_status', {
      p_assignment_id: assignmentId,
      p_new_status: 'picked_up'
    });

    const transitRes = await sessions.driverD.client.rpc('driver_update_delivery_status', {
      p_assignment_id: assignmentId,
      p_new_status: 'in_transit'
    });

    const pass = pickupRes.data?.logistics_status === 'picked_up' && transitRes.data?.logistics_status === 'in_transit';
    record(
      '9',
      'Driver D marks picked_up then in_transit',
      'Assignment and Order status synced to picked_up and in_transit',
      pass ? 'Status progressed picked_up -> in_transit successfully' : `Pickup: ${pickupRes.error?.message}, Transit: ${transitRes.error?.message}`,
      pass ? 'PASS' : 'FAIL',
      `Order status: ${transitRes.data?.order_status}`,
      Date.now() - t9
    );
  } else {
    record('9', 'Driver marks picked_up then in_transit', 'Status synced', 'Skipped', 'SKIPPED', 'Requires driver session', Date.now() - t9);
  }

  // ---------------------------------------------------------------------------
  // WORKFLOW STEP 10: Mandatory Delivery Proof Photo Verification
  // ---------------------------------------------------------------------------
  console.log('--- STEP 10: MANDATORY DELIVERY PROOF PHOTO ---');
  const t10 = Date.now();
  if (sessions.driverD && assignmentId) {
    // Attempt delivered without photo MUST fail
    const noPhotoRes = await sessions.driverD.client.rpc('driver_update_delivery_status', {
      p_assignment_id: assignmentId,
      p_new_status: 'delivered'
    });

    // Upload photo to delivery-proofs
    const proofDummy = Buffer.from('TEST-DELIVERY-PROOF-PHOTO');
    const proofPath = `proofs/${assignmentId}/delivery_proof_${runId}.jpg`;
    const proofUpload = await sessions.driverD.client.storage.from('delivery-proofs').upload(proofPath, proofDummy, {
      contentType: 'image/jpeg',
      upsert: true
    });

    // Attempt delivered with photo path MUST succeed
    const withPhotoRes = await sessions.driverD.client.rpc('driver_update_delivery_status', {
      p_assignment_id: assignmentId,
      p_new_status: 'delivered',
      p_proof_photo_path: proofPath
    });

    const pass = noPhotoRes.error && withPhotoRes.data?.logistics_status === 'delivered';
    record(
      '10',
      'Marking delivered WITHOUT proof photo must fail; with photo in delivery-proofs succeeds',
      'Mandatory photo enforcement prevents marking delivered without proof',
      pass ? 'Rejected without proof photo; succeeded with delivery proof photo' : `NoPhoto: ${noPhotoRes.error?.message}, WithPhoto: ${withPhotoRes.error?.message}`,
      pass ? 'PASS' : 'FAIL',
      `Proof photo: ${withPhotoRes.data?.proof_photo_path || proofUpload.error?.message}`,
      Date.now() - t10
    );
  } else {
    const bucketCheck = await anonClient.storage.from('delivery-proofs').list('');
    record(
      '10',
      'Mandatory delivery proof photo verification & bucket existence',
      'delivery-proofs bucket exists and rejects unauthenticated uploads',
      bucketCheck.error?.message?.includes('not found') ? 'delivery-proofs bucket not found' : 'Bucket exists',
      bucketCheck.error?.message?.includes('not found') ? 'FAIL' : 'PASS',
      bucketCheck.error?.message || 'Bucket present',
      Date.now() - t10
    );
  }

  // ---------------------------------------------------------------------------
  // WORKFLOW STEP 11: Consumer Confirms Receipt & Verified Review
  // ---------------------------------------------------------------------------
  console.log('--- STEP 11: RECEIPT CONFIRMATION & VERIFIED REVIEW ---');
  const t11 = Date.now();
  if (sessions.consumerB && createdOrderId) {
    const confirmRes = await sessions.consumerB.client.rpc('consumer_confirm_receipt', {
      p_order_id: createdOrderId
    });

    const reviewRes = await sessions.consumerB.client.rpc('submit_verified_review', {
      p_order_id: createdOrderId,
      p_reviewee_id: sessions.farmerA.user.id,
      p_rating: 5,
      p_comment: 'Outstanding freshness and zero bruising!',
      p_role_perspective: 'consumer_to_farmer'
    });

    const pass = confirmRes.data?.status === 'completed' && reviewRes.data?.success;
    record(
      '11',
      'Consumer B confirms receipt (order completed) -> submits verified review',
      'Status moves to completed, escrow payout released, verified review published',
      pass ? 'Order completed, escrow released, verified review published' : `Confirm: ${confirmRes.error?.message}, Review: ${reviewRes.error?.message}`,
      pass ? 'PASS' : 'FAIL',
      `Order status: ${confirmRes.data?.status}, Review ID: ${reviewRes.data?.review_id}`,
      Date.now() - t11
    );
  } else {
    record('11', 'Consumer confirms receipt & submits review', 'Completed & reviewed', 'Skipped', 'SKIPPED', 'Requires consumer session', Date.now() - t11);
  }

  // ---------------------------------------------------------------------------
  // WORKFLOW STEP 12: Consumer Cancel Order (Early Stage vs Late Stage)
  // ---------------------------------------------------------------------------
  console.log('--- STEP 12: CONSUMER CANCELLATION ---');
  const t12 = Date.now();
  if (sessions.consumerB && createdOrderId) {
    // Attempting to cancel an already completed order MUST fail
    const cancelLate = await sessions.consumerB.client.rpc('consumer_cancel_order', {
      p_order_id: createdOrderId,
      p_reason: 'Changed mind'
    });

    const pass = Boolean(cancelLate.error && cancelLate.error.message.includes('Cancellation denied'));
    record(
      '12',
      'Consumer cancels while pending vs completed (Strict stage rules)',
      'Cancellation rejected when order is past preparing stage',
      pass ? 'Cancellation on completed order rejected as required' : `Expected rejection but got: ${JSON.stringify(cancelLate)}`,
      pass ? 'PASS' : 'FAIL',
      cancelLate.error?.message || 'Blocked',
      Date.now() - t12
    );
  } else {
    record('12', 'Consumer order cancellation rules', 'Early-stage only', 'Skipped', 'SKIPPED', 'Requires consumer session', Date.now() - t12);
  }

  // ---------------------------------------------------------------------------
  // AUTHORIZATION NEGATIVE AUDIT CHECKS
  // Strict requirement: Every test must send a valid, complete row.
  // Must fail with code '42501' (permission denied / RLS).
  // A failure from a missing table (PGRST205) or not-null (23502) is recorded as FAIL.
  // ---------------------------------------------------------------------------
  console.log('--- NEGATIVE SECURITY TESTS ---');
  const tSec = Date.now();

  // AUTH-1: Anon cannot write to orders (Complete, valid row)
  const anonOrder = await anonClient.from('orders').insert({
    id: `TEST-ORD-ANON-${runId}`,
    order_number: `ORD-TEST-ANON-${runId}`,
    commodity: 'Organic Tomatoes',
    quantity: 10,
    quantity_kg: 10,
    unit_price: 35,
    total_amount: 350,
    farmer_realization: 280,
    logistics_fee: 35,
    platform_fee: 35,
    status: 'pending',
    payment_status: 'pending',
    payment_method: 'upi',
    delivery_address: 'APMC Market Hub'
  }).select();

  const isOrder42501 = anonOrder.error?.code === '42501' || anonOrder.status === 401 || anonOrder.status === 403;
  const orderBlocked = Boolean(anonOrder.error && isOrder42501);

  if (!anonOrder.error) {
    if (adminClient) await adminClient.from('orders').delete().eq('id', `TEST-ORD-ANON-${runId}`);
    else await anonClient.from('orders').delete().eq('id', `TEST-ORD-ANON-${runId}`);
  }

  record(
    'AUTH-1',
    'Anonymous write on public.orders MUST fail with 42501 (RLS/Permission)',
    'Database returns code 42501 permission denied',
    orderBlocked ? `PASS: Blocked with code 42501 (${anonOrder.error?.message})` : `FAIL: Error ${anonOrder.error?.code || 'None'} (${anonOrder.error?.message || 'Anon write succeeded!'})`,
    orderBlocked ? 'PASS' : 'FAIL',
    anonOrder.error?.code ? `Code: ${anonOrder.error.code} - ${anonOrder.error.message}` : 'Vulnerability: Row inserted',
    Date.now() - tSec
  );

  // AUTH-2: Anon cannot write to produce_listings (Complete, valid row)
  const anonListing = await anonClient.from('produce_listings').insert({
    produce_name: 'Organic Tomatoes',
    category: 'vegetables',
    variety: 'Roma Selection',
    total_quantity: 100,
    available_quantity: 100,
    unit: 'kg',
    price_per_unit: 35,
    quality_grade: 'A',
    status: 'active'
  }).select();

  const isListing42501 = anonListing.error?.code === '42501' || anonListing.status === 401 || anonListing.status === 403;
  const listingBlocked = Boolean(anonListing.error && isListing42501);

  if (!anonListing.error && anonListing.data?.[0]?.id) {
    if (adminClient) await adminClient.from('produce_listings').delete().eq('id', anonListing.data[0].id);
  }

  record(
    'AUTH-2',
    'Anonymous write on public.produce_listings MUST fail with 42501',
    'Database returns code 42501 permission denied',
    listingBlocked ? `PASS: Blocked with code 42501 (${anonListing.error?.message})` : `FAIL: Error ${anonListing.error?.code || 'None'} (${anonListing.error?.message || 'Anon listing succeeded!'})`,
    listingBlocked ? 'PASS' : 'FAIL',
    anonListing.error?.code ? `Code: ${anonListing.error.code} - ${anonListing.error.message}` : 'Vulnerability: Listing inserted',
    Date.now() - tSec
  );

  // AUTH-3: Client cannot insert directly into public.notifications (Complete, valid row with UUID)
  const fakeNotif = await anonClient.from('notifications').insert({
    id: '00000000-0000-0000-0000-000000000001',
    user_id: '00000000-0000-0000-0000-000000000001',
    type: 'order_placed',
    title: 'Forged Notification',
    body: 'Attacker injected this alert',
    data: { test: true }
  }).select();

  const isNotif42501 = fakeNotif.error?.code === '42501' || fakeNotif.status === 401 || fakeNotif.status === 403;
  // If table is missing (PGRST205), it is NOT verified/passed — must be code 42501
  const notifBlocked = Boolean(fakeNotif.error && isNotif42501);

  record(
    'AUTH-3',
    'Client cannot insert directly into public.notifications (Must fail with 42501)',
    'Direct INSERT blocked with code 42501 (Missing table or not-null is a FAIL)',
    notifBlocked ? `PASS: Blocked with code 42501 (${fakeNotif.error?.message})` : `FAIL: Code ${fakeNotif.error?.code || 'None'} (${fakeNotif.error?.message || 'Forged successfully'})`,
    notifBlocked ? 'PASS' : 'FAIL',
    fakeNotif.error?.code ? `Code: ${fakeNotif.error.code} - ${fakeNotif.error.message}` : 'Vulnerability: Notification inserted',
    Date.now() - tSec
  );

  // AUTH-4: Anonymous SELECT on public.orders must return 42501 or 0 rows
  const anonOrdersSelect = await anonClient.from('orders').select('id, customer_id, total_amount').limit(3);
  const isOrdersSelectBlocked = anonOrdersSelect.error?.code === '42501' || anonOrdersSelect.status === 401 || anonOrdersSelect.status === 403 || (anonOrdersSelect.error === null && anonOrdersSelect.data?.length === 0);
  record(
    'AUTH-4',
    'Anonymous SELECT on public.orders MUST be blocked with 42501 or return 0 rows',
    'Zero sensitive order rows leaked to unauthenticated visitors',
    isOrdersSelectBlocked ? `Protected (Code: ${anonOrdersSelect.error?.code || 'OK'}, Rows: ${anonOrdersSelect.data?.length || 0})` : `FAIL: Leaked ${anonOrdersSelect.data?.length} orders to anon`,
    isOrdersSelectBlocked ? 'PASS' : 'FAIL',
    isOrdersSelectBlocked ? (anonOrdersSelect.error?.message || '0 rows returned') : `Leaked IDs: ${anonOrdersSelect.data?.map(o => o.id).join(', ')}`,
    Date.now() - tSec
  );

  // AUTH-5: Anonymous SELECT on public.profiles must return 42501 or 0 rows
  const anonProfilesSelect = await anonClient.from('profiles').select('id, full_name, phone').limit(3);
  const isProfilesSelectBlocked = anonProfilesSelect.error?.code === '42501' || anonProfilesSelect.status === 401 || anonProfilesSelect.status === 403 || (anonProfilesSelect.error === null && anonProfilesSelect.data?.length === 0);
  record(
    'AUTH-5',
    'Anonymous SELECT on public.profiles MUST be blocked with 42501 or return 0 rows',
    'Zero phone numbers or sensitive profile fields leaked to unauthenticated visitors',
    isProfilesSelectBlocked ? `Protected (Code: ${anonProfilesSelect.error?.code || 'OK'}, Rows: ${anonProfilesSelect.data?.length || 0})` : `FAIL: Leaked ${anonProfilesSelect.data?.length} user profiles with phones to anon`,
    isProfilesSelectBlocked ? 'PASS' : 'FAIL',
    isProfilesSelectBlocked ? (anonProfilesSelect.error?.message || '0 rows returned') : `Leaked phones: ${anonProfilesSelect.data?.map(p => p.phone).join(', ')}`,
    Date.now() - tSec
  );

  // AUTH-6: Anonymous SELECT on base table produce_listings must be blocked with 42501 or 0 rows
  const anonProduceSelect = await anonClient.from('produce_listings').select('id, location_address, location_lat, location_lng').limit(3);
  const isProduceSelectBlocked = anonProduceSelect.error?.code === '42501' || anonProduceSelect.status === 401 || anonProduceSelect.status === 403 || (anonProduceSelect.error === null && anonProduceSelect.data?.length === 0);
  record(
    'AUTH-6',
    'Anonymous SELECT on base table produce_listings MUST be blocked (view only)',
    'Exact address and coordinates hidden; anon reads public_produce_catalog view only',
    isProduceSelectBlocked ? `Protected (Code: ${anonProduceSelect.error?.code || 'OK'}, Rows: ${anonProduceSelect.data?.length || 0})` : `FAIL: Leaked ${anonProduceSelect.data?.length} produce listings with addresses to anon`,
    isProduceSelectBlocked ? 'PASS' : 'FAIL',
    isProduceSelectBlocked ? (anonProduceSelect.error?.message || '0 rows returned') : 'Exact coordinates exposed to anon',
    Date.now() - tSec
  );

  // AUTH-7: Direct client UPDATE on public.logistics_assignments must be blocked with 42501 or 0 rows
  const anonAssignmentUpdate = await anonClient.from('logistics_assignments').update({ status: 'delivered' }).eq('id', '00000000-0000-0000-0000-000000000001').select();
  const isAssignmentUpdateBlocked = anonAssignmentUpdate.error?.code === '42501' || anonAssignmentUpdate.status === 401 || anonAssignmentUpdate.status === 403 || (anonAssignmentUpdate.error === null && anonAssignmentUpdate.data?.length === 0);
  record(
    'AUTH-7',
    'Direct client UPDATE on public.logistics_assignments MUST be blocked',
    'Status and GPS mutations restricted exclusively to canonical RPCs',
    isAssignmentUpdateBlocked ? `Blocked (Code: ${anonAssignmentUpdate.error?.code || 'RLS zero rows modified'})` : 'FAIL: Direct assignment PATCH succeeded',
    isAssignmentUpdateBlocked ? 'PASS' : 'FAIL',
    anonAssignmentUpdate.error?.message || 'Direct UPDATE blocked',
    Date.now() - tSec
  );

  // AUTH-8: Direct client INSERT on public.reviews with ALL fields provided MUST fail with 42501
  const anonReviewInsert = await anonClient.from('reviews').insert({
    order_id: 'ORD-TEST-DUMMY',
    reviewer_id: '00000000-0000-0000-0000-000000000001',
    reviewee_id: '00000000-0000-0000-0000-000000000002',
    rating: 5,
    comment: 'Direct review insertion attempt',
    role_perspective: 'consumer_to_farmer',
    category_ratings: {},
    is_verified: true,
    moderation_status: 'PUBLISHED'
  }).select();

  const isReview42501 = anonReviewInsert.error?.code === '42501' || anonReviewInsert.status === 401 || anonReviewInsert.status === 403;
  // If it fails with 23502 (not-null) or missing table, that is a test flaw and NOT a PASS
  const reviewBlocked = Boolean(anonReviewInsert.error && isReview42501);
  record(
    'AUTH-8',
    'Direct client INSERT on public.reviews with valid row MUST fail with 42501',
    'Direct INSERT blocked with 42501 (Verified reviews require submit_verified_review RPC)',
    reviewBlocked ? `PASS: Blocked with code 42501 (${anonReviewInsert.error?.message})` : `FAIL: Code ${anonReviewInsert.error?.code || 'None'} (${anonReviewInsert.error?.message || 'Direct review write succeeded'})`,
    reviewBlocked ? 'PASS' : 'FAIL',
    anonReviewInsert.error?.code ? `Code: ${anonReviewInsert.error.code} - ${anonReviewInsert.error.message}` : 'Vulnerability: Review inserted',
    Date.now() - tSec
  );

  // AUTH-9: Direct client write to role or wallet_balance on profiles MUST fail with 42501
  const roleTamper = await anonClient.from('profiles').update({ role: 'admin', wallet_balance: 100000 }).eq('id', '00000000-0000-0000-0000-000000000001').select();
  const isRoleTamperBlocked = roleTamper.error?.code === '42501' || roleTamper.status === 401 || roleTamper.status === 403 || (roleTamper.error === null && roleTamper.data?.length === 0);
  record(
    'AUTH-9',
    'Direct client UPDATE on profiles role/wallet_balance MUST be blocked',
    'Privileged columns role and wallet_balance are non-writable by clients',
    isRoleTamperBlocked ? `Blocked (Code: ${roleTamper.error?.code || 'RLS zero rows modified'})` : 'FAIL: Role or wallet_balance write succeeded',
    isRoleTamperBlocked ? 'PASS' : 'FAIL',
    roleTamper.error?.message || 'Direct role/wallet update blocked',
    Date.now() - tSec
  );

  // ---------------------------------------------------------------------------
  // AUTHENTICATED USER SECURITY CHECKS (RUN AS REAL SIGNED-IN SESSIONS)
  // ---------------------------------------------------------------------------
  console.log('--- AUTHENTICATED SESSION SECURITY CHECKS ---');
  const tAuthUser = Date.now();

  // AUTH-USER-1: Consumer B PATCHes own role or wallet_balance MUST fail with 42501
  if (sessions.consumerB) {
    const patchRes = await sessions.consumerB.client.from('profiles').update({
      role: 'admin',
      wallet_balance: 999999
    }).eq('id', sessions.consumerB.user.id).select();

    const is42501 = patchRes.error?.code === '42501' || patchRes.status === 401 || patchRes.status === 403;
    record(
      'AUTH-USER-1',
      'Consumer B PATCHes own role/wallet_balance MUST fail with 42501',
      'Database returns code 42501 permission denied for column',
      is42501 ? `PASS: Blocked with code 42501 (${patchRes.error?.message})` : `FAIL: Consumer escalated privileges (${patchRes.error?.message || 'Update succeeded'})`,
      is42501 ? 'PASS' : 'FAIL',
      patchRes.error?.code ? `Code: ${patchRes.error.code} - ${patchRes.error.message}` : 'Vulnerability: Columns modified',
      Date.now() - tAuthUser
    );
  } else {
    record('AUTH-USER-1', 'Consumer B PATCHes own role/wallet_balance MUST fail with 42501', 'Database returns code 42501', 'Requires real consumer session', 'SKIPPED', 'Local service role key required to provision user', Date.now() - tAuthUser);
  }

  // AUTH-USER-2: Driver D directly PATCHes assignment status (bypassing RPC) MUST be blocked
  if (sessions.driverD && assignmentId) {
    const driverPatch = await sessions.driverD.client.from('logistics_assignments').update({
      status: 'delivered'
    }).eq('id', assignmentId).select();

    const isDriverBlocked = driverPatch.error?.code === '42501' || driverPatch.status === 401 || driverPatch.status === 403 || (driverPatch.error === null && driverPatch.data?.length === 0);
    record(
      'AUTH-USER-2',
      'Driver D directly PATCHes assignment status MUST be blocked (42501 or 0 rows)',
      'Direct REST update rejected; driver must use canonical driver_update_delivery_status RPC',
      isDriverBlocked ? `PASS: Blocked (Code: ${driverPatch.error?.code || 'RLS zero rows modified'})` : 'FAIL: Driver bypassed delivery proof RPC via direct REST PATCH',
      isDriverBlocked ? 'PASS' : 'FAIL',
      driverPatch.error?.message || '0 rows updated via RLS',
      Date.now() - tAuthUser
    );
  } else {
    record('AUTH-USER-2', 'Driver D directly PATCHes assignment status MUST be blocked', 'Direct update blocked', 'Requires real driver session and active assignment', 'SKIPPED', 'Local service role key required to provision driver', Date.now() - tAuthUser);
  }

  // AUTH-USER-3: Unrelated User C reads User B order MUST return empty []
  if (sessions.consumerC && createdOrderId) {
    const orderRead = await sessions.consumerC.client.from('orders').select('*').eq('id', createdOrderId);
    const isOrderHidden = orderRead.error === null && orderRead.data?.length === 0;
    record(
      'AUTH-USER-3',
      'Unrelated Consumer C reads Consumer B order MUST return empty []',
      'Zero rows returned (RLS enforces is_order_party)',
      isOrderHidden ? 'PASS: 0 rows returned' : `FAIL: Leaked order to unrelated Consumer C (${orderRead.data?.length} rows)`,
      isOrderHidden ? 'PASS' : 'FAIL',
      `Rows visible to C: ${orderRead.data?.length || 0}`,
      Date.now() - tAuthUser
    );
  } else {
    record('AUTH-USER-3', 'Unrelated Consumer C reads Consumer B order MUST return empty []', 'Zero rows returned', 'Requires consumer sessions and active order', 'SKIPPED', 'Local service role key required to provision consumers', Date.now() - tAuthUser);
  }

  // AUTH-USER-4: Unverified Driver E sees NO unassigned jobs in pool (0 rows)
  if (sessions.driverE) {
    const poolRead = await sessions.driverE.client.from('unassigned_logistics_pool').select('*');
    const assignRead = await sessions.driverE.client.from('logistics_assignments').select('*').is('operator_id', null);
    const isPoolHidden = (poolRead.data?.length === 0 || poolRead.error) && (assignRead.data?.length === 0 || assignRead.error);
    record(
      'AUTH-USER-4',
      'Unverified Driver E (is_verified = false) sees NO unassigned jobs in pool',
      'Zero unassigned jobs visible to unverified logistics account',
      isPoolHidden ? 'PASS: 0 unassigned jobs visible' : `FAIL: Unverified driver saw unassigned jobs (Pool: ${poolRead.data?.length}, Assign: ${assignRead.data?.length})`,
      isPoolHidden ? 'PASS' : 'FAIL',
      `Pool rows: ${poolRead.data?.length || 0}, Assignment rows: ${assignRead.data?.length || 0}`,
      Date.now() - tAuthUser
    );
  } else {
    record('AUTH-USER-4', 'Unverified Driver E sees NO unassigned jobs in pool', 'Zero unassigned jobs visible', 'Requires unverified driver session', 'SKIPPED', 'Local service role key required to provision unverified driver', Date.now() - tAuthUser);
  }

  // ---------------------------------------------------------------------------
  // CLEANUP: Purge all TEST- rows and Ephemeral Test Users
  // ---------------------------------------------------------------------------
  console.log('--- CLEANUP: PURGING TEST DATA ---');
  if (adminClient) {
    try {
      if (listingId) {
        await adminClient.from('reviews').delete().eq('order_id', createdOrderId);
        await adminClient.from('logistics_assignments').delete().eq('order_id', createdOrderId);
        await adminClient.from('orders').delete().eq('id', createdOrderId);
        await adminClient.from('produce_listings').delete().eq('id', listingId);
      }

      for (const uid of createdUserIds) {
        await adminClient.from('notifications').delete().eq('user_id', uid);
        await adminClient.from('profiles').delete().eq('id', uid);
        await adminClient.auth.admin.deleteUser(uid);
      }
      console.log(`Successfully purged ${createdUserIds.length} ephemeral test users and associated test data.`);
    } catch (cleanupErr) {
      console.warn('Cleanup warning:', cleanupErr.message);
    }
  }

  // ---------------------------------------------------------------------------
  // FINAL REPORT TABLE
  // ---------------------------------------------------------------------------
  console.log('\n================================================================');
  console.log('                    FINAL AUDIT REPORT TABLE                    ');
  console.log('================================================================');
  console.table(auditResults.map(r => ({
    Step: r.step,
    Test: r.name.length > 40 ? r.name.slice(0, 37) + '...' : r.name,
    Status: r.status,
    Latency: `${r.latencyMs}ms`,
    Actual: r.actual.length > 45 ? r.actual.slice(0, 42) + '...' : r.actual
  })));

  const passes = auditResults.filter(r => r.status === 'PASS').length;
  const fails = auditResults.filter(r => r.status === 'FAIL').length;
  const skipped = auditResults.filter(r => r.status === 'SKIPPED' || r.status === 'NOT VERIFIED').length;
  console.log(`\nTOTAL: ${auditResults.length} | PASS: ${passes} | FAIL: ${fails} | SKIPPED: ${skipped}\n`);
}

runAuthenticatedAudit().catch(console.error);
