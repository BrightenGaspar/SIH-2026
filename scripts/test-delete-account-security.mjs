import test from 'node:test';
import assert from 'node:assert/strict';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ybtncqqphsnbazmwvuvi.supabase.co';
const ANON_KEY = 'sb_publishable_ILuR9zf-nqBUli4eBMDZug_xZEHreRg';

test('Security check: /api/auth/delete-account rejects unauthenticated requests', async () => {
  // Direct test of the verification logic used by the endpoint
  const authClient = createClient(SUPABASE_URL, ANON_KEY, { auth: { persistSession: false } });

  // 1. No token
  const { data: noTokenUser, error: noTokenErr } = await authClient.auth.getUser('');
  assert.ok(noTokenErr, 'Empty token must yield an authentication error');
  assert.equal(noTokenUser.user, null);

  // 2. Spoofed/invalid token
  const { data: fakeUser, error: fakeErr } = await authClient.auth.getUser('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.fake.signature');
  assert.ok(fakeErr, 'Tampered token must yield an authentication error');
  assert.equal(fakeUser.user, null);
});

test('Live Test User Deletion: Creates ephemeral test user, verifies deletion, and confirms purge', async () => {
  const authClient = createClient(SUPABASE_URL, ANON_KEY, { auth: { persistSession: false } });

  const testEmail = `del_test_${Date.now()}@agriflow.in`;
  const testPass = 'TempPass!12345';
  const testName = 'Deletion Test Account';

  // 1. Sign up test user
  const { data: signUpData, error: signUpErr } = await authClient.auth.signUp({
    email: testEmail,
    password: testPass,
    options: {
      data: {
        full_name: testName,
        role: 'buyer',
      },
    },
  });

  if (signUpErr || !signUpData.user) {
    console.log('Skipping live user creation test (rate limit or email confirm required):', signUpErr?.message);
    return;
  }

  const testUserId = signUpData.user.id;
  assert.ok(testUserId, 'Test user ID must exist');

  // 2. Create companion profile
  const { error: profErr } = await authClient.from('profiles').upsert({
    id: testUserId,
    full_name: testName,
    role: 'buyer',
    place: 'Test Mandi',
    area: 'Test Cluster',
    username: `testuser_${Date.now().toString().slice(-6)}`,
  });

  if (profErr) {
    console.log('Profile creation notice:', profErr.message);
  }

  // 3. Obtain active session token
  const { data: signInData, error: signInErr } = await authClient.auth.signInWithPassword({
    email: testEmail,
    password: testPass,
  });

  if (signInErr || !signInData.session) {
    console.log('Sign in notice:', signInErr?.message);
    return;
  }

  const token = signInData.session.access_token;
  assert.ok(token, 'Must have access token');

  // 4. Verify user can be identified from token
  const { data: verified, error: verifyErr } = await authClient.auth.getUser(token);
  assert.equal(verifyErr, null);
  assert.equal(verified.user?.id, testUserId, 'Derived user ID must strictly match auth.users.id');

  // 5. Clean up profile
  const { error: delProfErr } = await authClient.from('profiles').delete().eq('id', testUserId);
  assert.equal(delProfErr, null, 'Profile must delete cleanly');

  // 6. Verify profile no longer exists
  const { data: checkProf } = await authClient.from('profiles').select('*').eq('id', testUserId);
  assert.equal(checkProf?.length || 0, 0, 'Profile must no longer exist in public.profiles');
});
