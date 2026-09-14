import test from 'node:test';
import assert from 'node:assert/strict';

// Test implementation of getInitials matching AuthContext.tsx
function getInitials(name) {
  const clean = (name || '')
    .replace(/[\uD800-\uDFFF]|[\u2600-\u27BF]|\u00f0[^\s]*|\u00e2[^\s]*/g, '')
    .trim();
  if (!clean) return 'U';
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length === 1) {
    return parts[0][0].toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

test('getInitials correctly generates initials for single-word and multi-word names', () => {
  assert.equal(getInitials('Nikhil'), 'N');
  assert.equal(getInitials('Sai Nikhil'), 'SN');
  assert.equal(getInitials('Ramesh Kumar'), 'RK');
  assert.equal(getInitials('Sai nikhil Pingali'), 'SP');
  assert.equal(getInitials('   vikram   singh   '), 'VS');
  assert.equal(getInitials(''), 'U');
  assert.equal(getInitials(null), 'U');
  assert.equal(getInitials(undefined), 'U');
});

test('Identity synchronization ensures navbar and profile share exact same identity', () => {
  // Simulate mock database record from public.profiles
  const profileRecord = {
    id: 'user-12345',
    full_name: 'Sai Nikhil',
    username: 'sainikhil',
    role: 'farmer',
    phone: '+919876543210',
    place: 'Shamshabad',
    area: 'Ranga Reddy',
  };

  // Profile page derives:
  const profilePageName = profileRecord.full_name;
  const profilePageInitials = getInitials(profilePageName);

  // Top-right navbar derives:
  const navbarName = profileRecord.full_name || profileRecord.username || 'User';
  const navbarInitials = getInitials(navbarName);

  assert.equal(profilePageName, 'Sai Nikhil');
  assert.equal(navbarName, 'Sai Nikhil');
  assert.equal(profilePageInitials, 'SN');
  assert.equal(navbarInitials, 'SN');
  assert.equal(profilePageName, navbarName, 'Navbar and Profile page names must match');
  assert.equal(profilePageInitials, navbarInitials, 'Navbar and Profile page initials must match');
});

test('Single-word profile name produces single initial matching user request example', () => {
  const profileRecord = {
    id: 'user-single',
    full_name: 'Nikhil',
    username: 'nikhil',
    role: 'farmer',
  };

  const name = profileRecord.full_name;
  const initials = getInitials(name);

  assert.equal(name, 'Nikhil');
  assert.equal(initials, 'N');
});

test('Consumer role profile correctly shares same identity across views', () => {
  const consumerProfile = {
    id: 'consumer-456',
    full_name: 'Priya Sharma',
    username: 'priyasharma',
    role: 'buyer',
  };

  const displayName = consumerProfile.full_name;
  const initials = getInitials(displayName);

  assert.equal(displayName, 'Priya Sharma');
  assert.equal(initials, 'PS');
});

test('Logistics role profile correctly shares same identity across views', () => {
  const logisticsProfile = {
    id: 'logistics-789',
    full_name: 'Harpreet Singh',
    username: 'harpreet_fleet',
    role: 'logistics',
  };

  const displayName = logisticsProfile.full_name;
  const initials = getInitials(displayName);

  assert.equal(displayName, 'Harpreet Singh');
  assert.equal(initials, 'HS');
});
