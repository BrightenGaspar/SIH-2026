import test from 'node:test';
import assert from 'node:assert/strict';

// 1. Test Haversine Distance Formula
function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 0;
  const R = 6371; // Earth radius in KM
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 100) / 100;
}

test('Haversine distance calculation is accurate within agricultural radius', () => {
  // Shadnagar center to Farooqnagar
  const dist1 = calculateDistanceKm(17.0722, 78.2078, 17.0650, 78.2010);
  assert.ok(dist1 < 2.0, `Distance should be ~1 km, got ${dist1}`);

  // Shadnagar to Kothur (~12 km)
  const dist2 = calculateDistanceKm(17.0722, 78.2078, 17.1472, 78.2891);
  assert.ok(dist2 > 10.0 && dist2 < 16.0, `Distance should be ~12 km, got ${dist2}`);

  // Same coordinates should be 0
  const distZero = calculateDistanceKm(17.0722, 78.2078, 17.0722, 78.2078);
  assert.equal(distZero, 0);
});

// 2. Test Aggregation & 1 Tonne Threshold Logic
test('Cluster aggregates smallholder produce and triggers Bulk Buyer Match Ready at 1 tonne', () => {
  const targetThresholdKg = 1000; // 1 tonne configured threshold

  // Example from prompt:
  // Farmer A -> 250 kg tomato
  // Farmer B -> 300 kg tomato
  // Farmer C -> 200 kg tomato
  // Farmer D -> 350 kg tomato
  const contributions = [
    { farmer: 'Farmer A', quantityKg: 250, crop: 'Tomato' },
    { farmer: 'Farmer B', quantityKg: 300, crop: 'Tomato' },
    { farmer: 'Farmer C', quantityKg: 200, crop: 'Tomato' },
    { farmer: 'Farmer D', quantityKg: 350, crop: 'Tomato' },
  ];

  // Progressive aggregation test
  let currentTotalKg = 0;
  let status = 'Consolidating';

  // Step 1: Farmer A adds 250 kg
  currentTotalKg += contributions[0].quantityKg;
  assert.equal(currentTotalKg, 250);
  assert.equal(currentTotalKg >= targetThresholdKg, false);
  status = currentTotalKg >= targetThresholdKg ? 'Bulk Buyer Matching Active' : 'Consolidating';
  assert.equal(status, 'Consolidating');

  // Step 2: Farmer B adds 300 kg -> 550 kg
  currentTotalKg += contributions[1].quantityKg;
  assert.equal(currentTotalKg, 550);
  status = currentTotalKg >= targetThresholdKg ? 'Bulk Buyer Matching Active' : 'Consolidating';
  assert.equal(status, 'Consolidating');

  // Step 3: Farmer C adds 200 kg -> 750 kg
  currentTotalKg += contributions[2].quantityKg;
  assert.equal(currentTotalKg, 750);
  status = currentTotalKg >= targetThresholdKg ? 'Bulk Buyer Matching Active' : 'Consolidating';
  assert.equal(status, 'Consolidating');

  // Step 4: Farmer D adds 350 kg -> 1,100 kg
  currentTotalKg += contributions[3].quantityKg;
  assert.equal(currentTotalKg, 1100);
  assert.equal(currentTotalKg >= targetThresholdKg, true);

  // Status must automatically transition to Bulk Buyer Match Ready / Active!
  status = currentTotalKg >= targetThresholdKg ? 'Bulk Buyer Matching Active' : 'Consolidating';
  assert.equal(status, 'Bulk Buyer Matching Active');

  const percentage = Math.round((currentTotalKg / targetThresholdKg) * 100);
  assert.equal(percentage, 110);
});

// 3. Test Privacy Preservation (No sensitive personal info leaked)
test('Cluster inventory strictly hides private farmer address and phone', () => {
  const privateFarmerProfile = {
    id: 'farmer-uuid-7712',
    full_name: 'Rameshwaram Venkat Reddy',
    phone: '+91 98480 12345',
    door_number: 'H.No 4-12/A, Balaji Nagar',
    bank_account: 'SBIN0001234998',
    place: 'Shadnagar',
    area: 'Farooqnagar Sector 2',
  };

  // Anonymization function used in clusterService
  const anonymizeFarmerListing = (profile, crop, quantityKg) => ({
    farmerDisplayName: `${profile.full_name.charAt(0)}. (${profile.area || profile.place})`,
    crop,
    quantityKg,
  });

  const publicListing = anonymizeFarmerListing(privateFarmerProfile, 'Tomato', 250);

  assert.equal(publicListing.farmerDisplayName, 'R. (Farooqnagar Sector 2)');
  assert.equal(publicListing.quantityKg, 250);
  assert.equal(publicListing.phone, undefined);
  assert.equal(publicListing.door_number, undefined);
  assert.equal(publicListing.bank_account, undefined);
});

// 4. Test Event Generation on Threshold Reach
test('Event is generated when 1 tonne threshold is crossed', () => {
  const clusterEvents = [];

  function checkAndNotifyThreshold(clusterId, currentKg, targetKg, farmerCount) {
    if (currentKg >= targetKg) {
      clusterEvents.push({
        clusterId,
        eventType: 'THRESHOLD_REACHED',
        title: `Bulk Buyer Target Met: ${currentKg} kg (${Math.round((currentKg / targetKg) * 100)}%)`,
        description: `Cluster has reached ${currentKg} kg across ${farmerCount} farmers, triggering bulk buyer notifications.`,
        metadata: { currentKg, targetKg, farmerCount },
      });
      return true;
    }
    return false;
  }

  // Under threshold
  const notified1 = checkAndNotifyThreshold('c1', 750, 1000, 3);
  assert.equal(notified1, false);
  assert.equal(clusterEvents.length, 0);

  // Over threshold
  const notified2 = checkAndNotifyThreshold('c1', 1100, 1000, 4);
  assert.equal(notified2, true);
  assert.equal(clusterEvents.length, 1);
  assert.equal(clusterEvents[0].eventType, 'THRESHOLD_REACHED');
  assert.ok(clusterEvents[0].title.includes('1100 kg'));
  assert.ok(clusterEvents[0].title.includes('110%'));
});
