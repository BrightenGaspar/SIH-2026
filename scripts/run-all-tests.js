/**
 * AgriFlow.ai - Unified Production Verification Test Runner
 * Executes all component test suites and reports summary status.
 */

const { spawnSync } = require('child_process');
const path = require('path');

const testSuites = [
  { name: 'Auth & Profile Completeness', script: 'test-auth-profiles.mjs' },
  { name: 'Identity & Initials Sync', script: 'test-identity-sync.mjs' },
  { name: 'Delete Account Security', script: 'test-delete-account-security.mjs' },
  { name: 'Phone GPS & Telemetry Engine', script: 'test-phone-telemetry.js' },
  { name: 'OLS Price Predictor & Math', script: 'test-predictor.js' },
  { name: 'Open-Meteo Meteorological API', script: 'test-weather.js' },
  { name: 'Multi-User Live Demo Flow', script: 'test-live-demo-flow.js' },
  { name: 'Live Data Repair & Concurrency', script: 'test-live-data-repair.mjs' },
];

console.log('================================================================');
console.log('       AGRIFLOW.AI — COMPLETE SYSTEM VERIFICATION RUNNER       ');
console.log('================================================================\n');

let allPassed = true;
const results = [];

for (const suite of testSuites) {
  process.stdout.write(`• Running ${suite.name} (${suite.script})... `);
  const startTime = Date.now();
  const scriptPath = path.join(__dirname, suite.script);

  const res = spawnSync(process.execPath, [scriptPath], {
    cwd: path.join(__dirname, '..'),
    encoding: 'utf-8',
    timeout: 30000,
  });

  const duration = Date.now() - startTime;

  if (res.status === 0) {
    console.log(`\x1b[32mPASS\x1b[0m (${duration}ms)`);
    results.push({ name: suite.name, status: 'PASS', duration });
  } else {
    console.log(`\x1b[31mFAIL\x1b[0m (${duration}ms)`);
    console.error(res.stderr || res.stdout);
    results.push({ name: suite.name, status: 'FAIL', duration, error: res.stderr || res.stdout });
    allPassed = false;
  }
}

console.log('\n================================================================');
console.log('                      VERIFICATION SUMMARY                      ');
console.log('================================================================');
for (const r of results) {
  const statusFormatted = r.status === 'PASS' ? '\x1b[32mPASS\x1b[0m' : '\x1b[31mFAIL\x1b[0m';
  console.log(`  [${statusFormatted}] ${r.name.padEnd(36)} ${r.duration}ms`);
}
console.log('================================================================');

if (allPassed) {
  console.log(`\x1b[32m  ALL SYSTEM VERIFICATION TESTS PASSED SUCCESSFULLY! (${results.length}/${testSuites.length})\x1b[0m`);
  process.exit(0);
} else {
  console.log('\x1b[31m  SOME TESTS FAILED. CHECK OUTPUT ABOVE.\x1b[0m');
  process.exit(1);
}
