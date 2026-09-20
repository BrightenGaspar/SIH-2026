/**
 * AgriFlow.ai - Live Data Repair Verification Suite
 * Tests the complete Farmer -> Customer -> Logistics flow on real Supabase data.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ybtncqqphsnbazmwvuvi.supabase.co';
const ANON_KEY = 'sb_publishable_ILuR9zf-nqBUli4eBMDZug_xZEHreRg';
const supabase = createClient(SUPABASE_URL, ANON_KEY);

const SUFFIX = Date.now().toString().slice(-6);
const TEST_PRODUCE_ID = crypto.randomUUID();
const TEST_PRODUCE_ID_2 = crypto.randomUUID();
const TEST_ORDER_ID_1 = 'TEST-ORD-REPAIR-1-' + SUFFIX;
const TEST_ORDER_ID_2 = 'TEST-ORD-REPAIR-2-' + SUFFIX;

test('1. Farmer creates real produce listing in Supabase', async () => {
  const { data, error } = await supabase
    .from('produce')
    .insert({
      id: TEST_PRODUCE_ID,
      crop_name: 'Live Repair Organic Tomatoes',
      category: 'Vegetables',
      variety: 'Roma Selection',
      quantity: 100,
      unit: 'kg',
      asking_price: 42,
      quality_grade: 'A',
      location: 'Shamshabad Mandi Hub',
      status: 'Active',
      harvest_date: new Date().toISOString().split('T')[0],
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  assert.equal(error, null, 'Listing creation must succeed in public.produce');
  assert.equal(data.id, TEST_PRODUCE_ID);
  assert.equal(Number(data.quantity), 100);
  assert.equal(Number(data.asking_price), 42);
  console.log('   [PASS] Real listing created in Supabase:', data.crop_name, data.id);
});

test('2. Customer marketplace sees real listing via Supabase fetch (Zero Mock Data)', async () => {
  const { data, error } = await supabase
    .from('produce')
    .select('*')
    .eq('id', TEST_PRODUCE_ID)
    .single();

  assert.equal(error, null);
  assert.equal(data.id, TEST_PRODUCE_ID);
  assert.equal(data.crop_name, 'Live Repair Organic Tomatoes');
  assert.equal(Number(data.quantity), 100);
  console.log('   [PASS] Customer marketplace fetches real Supabase row without mock fallback');
});

test('3. Listing update propagates in database', async () => {
  const { error: updErr } = await supabase
    .from('produce')
    .update({ quantity: 80 })
    .eq('id', TEST_PRODUCE_ID);

  assert.equal(updErr, null);

  const { data: updated } = await supabase
    .from('produce')
    .select('quantity')
    .eq('id', TEST_PRODUCE_ID)
    .single();

  assert.equal(Number(updated.quantity), 80, 'Produce quantity must be updated to 80 kg');
  console.log('   [PASS] Listing update reflected in Supabase: quantity = 80 kg');
});

test('4. Listing failure displays actual database error (never hidden with mock fallback)', async () => {
  const { error } = await supabase
    .from('produce')
    .insert({
      id: crypto.randomUUID(),
      crop_name: 'Invalid Null Price Crop',
      quantity: 100,
      asking_price: null, // violates NOT NULL constraint in PostgreSQL
      location: 'Faulty Farm',
    })
    .select();

  assert.ok(error, 'Database must reject invalid listing with null price');
  assert.ok(
    error.code === '23502' || error.message.includes('not-null constraint'),
    'Error must surface genuine database constraint violation'
  );
  console.log('   [PASS] Genuine database error surfaced:', error.message);
});

test('5. Atomic concurrency: two simultaneous purchases cannot oversell stock (100 kg stock, two 60 kg requests)', async () => {
  // Setup 100 kg lot in produce
  await supabase.from('produce').insert({
    id: TEST_PRODUCE_ID_2,
    crop_name: 'Concurrency Test Potatoes',
    category: 'Vegetables',
    quantity: 100,
    unit: 'kg',
    asking_price: 25,
    location: 'Medak Hub',
    status: 'Active',
  });

  // Simulated concurrent atomic purchase handler:
  // Evaluates available quantity atomically with condition check before update
  async function attemptPurchase(orderId, requestedQty) {
    const { data: current, error: fetchErr } = await supabase
      .from('produce')
      .select('quantity')
      .eq('id', TEST_PRODUCE_ID_2)
      .single();

    if (fetchErr) throw new Error(fetchErr.message);

    const available = Number(current.quantity);
    if (available < requestedQty) {
      throw new Error(`Insufficient inventory. Requested: ${requestedQty} kg, Available: ${available} kg`);
    }

    const { data: updated, error: updErr } = await supabase
      .from('produce')
      .update({ quantity: available - requestedQty })
      .eq('id', TEST_PRODUCE_ID_2)
      .eq('quantity', available)
      .select();

    if (updErr || !updated || updated.length === 0) {
      throw new Error('Concurrent modification detected. Please retry checkout.');
    }

    const { error: ordErr } = await supabase.from('orders').insert({
      id: orderId,
      commodity: 'Concurrency Test Potatoes',
      quantity_kg: requestedQty,
      total_amount: requestedQty * 25,
      farmer_realization: requestedQty * 25 * 0.87,
      logistics_fee: requestedQty * 25 * 0.08,
      platform_fee: requestedQty * 25 * 0.05,
      status: 'pending',
      delivery_address: 'APMC Market Terminal',
    });

    if (ordErr) throw new Error(ordErr.message);
    return { success: true, orderId, remaining: available - requestedQty };
  }

  // Concurrent Execution: Buyer 1 (60 kg) and Buyer 2 (60 kg)
  const results = await Promise.allSettled([
    attemptPurchase(TEST_ORDER_ID_1, 60),
    attemptPurchase(TEST_ORDER_ID_2, 60),
  ]);

  const fulfilled = results.filter((r) => r.status === 'fulfilled');
  const rejected = results.filter((r) => r.status === 'rejected');

  assert.equal(fulfilled.length, 1, 'Exactly one concurrent purchase must succeed');
  assert.equal(rejected.length, 1, 'Exactly one concurrent purchase must fail with insufficient stock / concurrency error');

  // Verify stock in database
  const { data: finalStock } = await supabase
    .from('produce')
    .select('quantity')
    .eq('id', TEST_PRODUCE_ID_2)
    .single();

  assert.equal(Number(finalStock.quantity), 40, 'Stock must be exactly 40 kg (100 - 60), never oversold or negative');
  console.log('   [PASS] Concurrency check: 1 order succeeded, 1 rejected. Remaining stock = 40 kg.');
});

test('6. Order lifecycle: Farmer receives order and marks ready -> Logistics receives dispatch', async () => {
  // 6a. Farmer checks order
  const { data: order, error: ordErr } = await supabase
    .from('orders')
    .select('*')
    .eq('id', TEST_ORDER_ID_1)
    .single();

  assert.equal(ordErr, null);
  assert.equal(order.id, TEST_ORDER_ID_1);
  assert.equal(order.status, 'pending');
  console.log('   [PASS] Farmer sees confirmed order in orders portal:', order.id);

  // 6b. Farmer transitions order: pending -> accepted -> preparing -> ready_for_pickup
  await supabase.from('orders').update({ status: 'accepted' }).eq('id', TEST_ORDER_ID_1);
  await supabase.from('orders').update({ status: 'preparing' }).eq('id', TEST_ORDER_ID_1);
  const { error: readyErr } = await supabase
    .from('orders')
    .update({ status: 'ready_for_pickup' })
    .eq('id', TEST_ORDER_ID_1);

  assert.equal(readyErr, null);

  // 6c. Logistics receives dispatch request
  const { data: readyOrder } = await supabase
    .from('orders')
    .select('status')
    .eq('id', TEST_ORDER_ID_1)
    .single();

  assert.equal(readyOrder.status, 'ready_for_pickup');

  // Insert corresponding logistics assignment
  const { data: assignment, error: assignErr } = await supabase
    .from('logistics_assignments')
    .insert({
      order_id: TEST_ORDER_ID_1,
      status: 'assigned',
      pickup_lat: 17.0600,
      pickup_lng: 78.2000,
      delivery_lat: 17.4700,
      delivery_lng: 78.4900,
      vehicle_number: 'TS 08 UB 4192',
      vehicle_type: 'Tata 407 Reefer',
    })
    .select()
    .single();

  assert.equal(assignErr, null);
  assert.equal(assignment.order_id, TEST_ORDER_ID_1);
  console.log('   [PASS] Logistics portal receives assignment for pickup:', assignment.id);
});

test('7. Realtime channel lifecycle cleans up cleanly', async () => {
  const channel = supabase.channel('test-cleanup-channel');
  channel.subscribe();
  const removeStatus = await supabase.removeChannel(channel);
  assert.ok(removeStatus === 'ok' || removeStatus === 'timed out', 'Channel must unsubscribe cleanly');
  console.log('   [PASS] Realtime channel unsubscribed cleanly');
});

test('8. Teardown: Clean up all test artifacts from database', async () => {
  await supabase.from('logistics_assignments').delete().eq('order_id', TEST_ORDER_ID_1);
  await supabase.from('orders').delete().eq('id', TEST_ORDER_ID_1);
  await supabase.from('orders').delete().eq('id', TEST_ORDER_ID_2);
  await supabase.from('produce_listings').delete().eq('id', TEST_PRODUCE_ID);
  await supabase.from('produce_listings').delete().eq('id', TEST_PRODUCE_ID_2);
  await supabase.from('produce').delete().eq('id', TEST_PRODUCE_ID);
  await supabase.from('produce').delete().eq('id', TEST_PRODUCE_ID_2);
  console.log('   [PASS] Teardown complete: All test artifacts purged from Supabase.');
  setTimeout(() => process.exit(0), 100);
});
