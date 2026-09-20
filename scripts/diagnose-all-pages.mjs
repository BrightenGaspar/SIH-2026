const PAGES = [
  '/',
  '/admin',
  '/auth/callback',
  '/auth/complete-profile',
  '/consumer',
  '/consumer/cart',
  '/consumer/checkout',
  '/consumer/complete-profile',
  '/consumer/dashboard',
  '/consumer/login',
  '/consumer/marketplace',
  '/consumer/orders',
  '/consumer/product/PROD-TEST-1',
  '/consumer/profile',
  '/consumer/register',
  '/consumer/settings',
  '/consumer/tracking',
  '/consumer/tracking/TRK-CONS-ROAD-9021',
  '/farmer',
  '/farmer/analytics',
  '/farmer/clusters',
  '/farmer/complete-profile',
  '/farmer/dashboard',
  '/farmer/demand-map',
  '/farmer/intelligence',
  '/farmer/login',
  '/farmer/market-prices',
  '/farmer/orders',
  '/farmer/produce',
  '/farmer/profile',
  '/farmer/recommendations',
  '/farmer/register',
  '/farmer/settings',
  '/farmer/tracking/TRK-CONS-ROAD-9021',
  '/farmer/weather-shock',
  '/logistics',
  '/logistics/complete-profile',
  '/logistics/dashboard',
  '/logistics/login',
  '/logistics/profile',
  '/logistics/register',
  '/logistics/return-loads',
  '/logistics/settings',
  '/logistics/telemetry',
  '/logistics/track/TRK-CONS-ROAD-9021',
  '/logistics/trips',
  '/traceability',
  '/traceability/LOT-2026-7842'
];

async function checkTarget(baseUrl) {
  console.log(`\n================ Testing ${baseUrl} ================`);
  const failed = [];
  const redirected = [];
  const ok = [];

  for (const path of PAGES) {
    const url = baseUrl + path;
    try {
      const res = await fetch(url, { redirect: 'manual' });
      const status = res.status;
      
      if (status >= 300 && status < 400) {
        const location = res.headers.get('location') || '(unknown)';
        redirected.push({ path, status, location });
      } else if (status === 200) {
        const html = await res.text();
        if (html.includes('Internal Server Error') || html.includes('Application error') || html.includes('NEXT_NOT_FOUND')) {
          failed.push({ path, status, reason: 'Error text found in HTML' });
        } else if (html.length < 500) {
          failed.push({ path, status, reason: `Suspiciously short HTML (${html.length} chars)` });
        } else {
          ok.push(path);
        }
      } else {
        failed.push({ path, status, reason: `HTTP Status ${status}` });
      }
    } catch (err) {
      failed.push({ path, status: 'NETWORK_ERR', reason: err.message });
    }
  }

  console.log(`\nResults for ${baseUrl}:`);
  console.log(`- OK (200 & Rendered): ${ok.length} / ${PAGES.length}`);
  console.log(`- Redirects (3xx):     ${redirected.length} / ${PAGES.length}`);
  console.log(`- Failed:              ${failed.length} / ${PAGES.length}`);

  if (redirected.length > 0) {
    console.log('\n--- Redirected Routes ---');
    for (const r of redirected) {
      console.log(`  ${r.path.padEnd(35)} [${r.status}] -> ${r.location}`);
    }
  }

  if (failed.length > 0) {
    console.log('\n--- FAILED Routes ---');
    for (const f of failed) {
      console.log(`  ${f.path.padEnd(35)} [${f.status}] - ${f.reason}`);
    }
  }
}

async function run() {
  await checkTarget('http://localhost:3000');
  await checkTarget('https://sihfullcode.vercel.app');
}

run();
