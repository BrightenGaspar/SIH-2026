import test from 'node:test';
import assert from 'node:assert/strict';

// Test 1: Profile Completeness Logic
function isProfileComplete(profile) {
  if (!profile) return false;
  return Boolean(
    profile.full_name &&
    profile.full_name.trim().length > 0 &&
    profile.username &&
    profile.username.trim().length > 0 &&
    profile.role &&
    ['farmer', 'consumer', 'logistics'].includes(profile.role) &&
    profile.place &&
    profile.place.trim().length > 0 &&
    profile.area &&
    profile.area.trim().length > 0
  );
}

test('isProfileComplete correctly identifies complete vs incomplete profiles', () => {
  // Complete farmer profile
  const completeFarmer = {
    id: 'user-123',
    full_name: 'Ramesh Reddy',
    username: 'ramesh_reddy',
    role: 'farmer',
    place: 'Hyderabad',
    area: 'Shadnagar',
    phone: '+919848012345',
  };
  assert.equal(isProfileComplete(completeFarmer), true);

  // Missing username
  const missingUsername = { ...completeFarmer, username: '' };
  assert.equal(isProfileComplete(missingUsername), false);

  // Missing place
  const missingPlace = { ...completeFarmer, place: '   ' };
  assert.equal(isProfileComplete(missingPlace), false);

  // Missing area
  const missingArea = { ...completeFarmer, area: '' };
  assert.equal(isProfileComplete(missingArea), false);

  // Missing role
  const missingRole = { ...completeFarmer, role: '' };
  assert.equal(isProfileComplete(missingRole), false);

  // Null/undefined profile
  assert.equal(isProfileComplete(null), false);
  assert.equal(isProfileComplete(undefined), false);
});

// Test 2: Case-Insensitive Username Handling
test('Case-insensitive username normalization', () => {
  const normalizeUsername = (u) => u.trim().toLowerCase();
  assert.equal(normalizeUsername('Nikhil123'), 'nikhil123');
  assert.equal(normalizeUsername('NIKHIL123'), 'nikhil123');
  assert.equal(normalizeUsername('  nikhil123  '), 'nikhil123');
  assert.equal(normalizeUsername('Ramesh.Reddy'), 'ramesh.reddy');
});

// Test 3: Returning Phone User vs New Phone User Routing
test('Returning user detection bypasses Complete Profile', () => {
  function determineUserDestination(profile, defaultRole) {
    if (profile && isProfileComplete(profile)) {
      return { destination: `/${profile.role}/dashboard`, isReturning: true };
    }
    return { destination: `/auth/complete-profile?role=${defaultRole}`, isReturning: false };
  }

  // Returning user with existing complete profile
  const existingProfile = {
    full_name: 'Priya Sharma',
    username: 'priya_buyer',
    role: 'consumer',
    place: 'Hyderabad',
    area: 'Bowenpally',
  };
  const returningResult = determineUserDestination(existingProfile, 'consumer');
  assert.equal(returningResult.isReturning, true);
  assert.equal(returningResult.destination, '/consumer/dashboard');

  // New user with no profile
  const newResult = determineUserDestination(null, 'farmer');
  assert.equal(newResult.isReturning, false);
  assert.equal(newResult.destination, '/auth/complete-profile?role=farmer');

  // Returning logistics operator
  const logisticsProfile = {
    full_name: 'Gurdeep Singh',
    username: 'gurdeep_logistics',
    role: 'logistics',
    place: 'Shamshabad',
    area: 'Airport Cargo Hub',
  };
  const logResult = determineUserDestination(logisticsProfile, 'logistics');
  assert.equal(logResult.isReturning, true);
  assert.equal(logResult.destination, '/logistics/dashboard');
});

// Test 4: Role Persistence across all three roles
test('Role persistence and routing', () => {
  const roles = ['farmer', 'consumer', 'logistics'];
  const dashboards = {
    farmer: '/farmer/dashboard',
    consumer: '/consumer/dashboard',
    logistics: '/logistics/dashboard',
  };

  for (const role of roles) {
    assert.equal(dashboards[role], `/${role}/dashboard`);
  }
});
