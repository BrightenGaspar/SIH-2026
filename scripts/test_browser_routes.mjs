import { spawn } from 'child_process';
import WebSocket from 'ws';

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const DEBUG_PORT = 9223;
const BASE_URL = 'http://localhost:3000';

const ROUTES = [
  '/',
  '/farmer',
  '/farmer/login',
  '/farmer/register',
  '/farmer/dashboard',
  '/farmer/produce',
  '/farmer/orders',
  '/farmer/analytics',
  '/farmer/market-prices',
  '/farmer/clusters',
  '/farmer/demand-map',
  '/farmer/intelligence',
  '/farmer/weather-shock',
  '/farmer/recommendations',
  '/farmer/profile',
  '/farmer/settings',
  '/farmer/tracking/TRK-CONS-ROAD-9021',
  '/farmer/complete-profile',

  '/consumer',
  '/consumer/login',
  '/consumer/register',
  '/consumer/dashboard',
  '/consumer/marketplace',
  '/consumer/cart',
  '/consumer/checkout',
  '/consumer/orders',
  '/consumer/profile',
  '/consumer/settings',
  '/consumer/tracking',
  '/consumer/tracking/TRK-CONS-ROAD-9021',
  '/consumer/complete-profile',

  '/logistics',
  '/logistics/login',
  '/logistics/register',
  '/logistics/dashboard',
  '/logistics/trips',
  '/logistics/telemetry',
  '/logistics/return-loads',
  '/logistics/profile',
  '/logistics/settings',
  '/logistics/track/TRK-CONS-ROAD-9021',
  '/logistics/complete-profile',

  '/traceability',
  '/traceability/LOT-2026-7842',
  '/admin',
  '/auth/complete-profile',
  '/auth/callback',
];

async function run() {
  console.log('Starting headless Edge on port ' + DEBUG_PORT + '...');
  const edge = spawn(EDGE_PATH, [
    '--headless=new',
    '--disable-gpu',
    `--remote-debugging-port=${DEBUG_PORT}`,
    '--no-first-run',
    '--no-default-browser-check',
    '--user-data-dir=C:\\Users\\n0222\\AppData\\Local\\Temp\\edge_test_profile_' + Date.now(),
  ]);

  let wsUrl = null;
  for (let i = 0; i < 20; i++) {
    await new Promise((r) => setTimeout(r, 300));
    try {
      const res = await fetch(`http://localhost:${DEBUG_PORT}/json/list`);
      const list = await res.json();
      if (list && list[0] && list[0].webSocketDebuggerUrl) {
        wsUrl = list[0].webSocketDebuggerUrl;
        break;
      }
    } catch {
      // retry
    }
  }

  if (!wsUrl) {
    console.error('Failed to get WebSocket debugger URL from Edge');
    edge.kill();
    process.exit(1);
  }

  console.log('Connected to Edge DevTools WebSocket:', wsUrl);
  const ws = new WebSocket(wsUrl);

  await new Promise((resolve, reject) => {
    ws.on('open', resolve);
    ws.on('error', reject);
  });

  let msgId = 1;
  const pendingRequests = new Map();
  const currentExceptions = [];
  const currentConsoleErrors = [];

  ws.on('message', (raw) => {
    const msg = JSON.parse(raw.toString());
    if (msg.id && pendingRequests.has(msg.id)) {
      pendingRequests.get(msg.id)(msg);
      pendingRequests.delete(msg.id);
    }

    if (msg.method === 'Runtime.exceptionThrown') {
      const desc = msg.params.exceptionDetails?.exception?.description || msg.params.exceptionDetails?.text || 'Unknown exception';
      currentExceptions.push(desc);
    }
    if (msg.method === 'Log.entryAdded') {
      if (msg.params.entry?.level === 'error') {
        currentConsoleErrors.push(msg.params.entry?.text);
      }
    }
    if (msg.method === 'Runtime.consoleAPICalled') {
      if (msg.params.type === 'error') {
        const text = (msg.params.args || []).map((a) => a.value || a.description || '').join(' ');
        currentConsoleErrors.push(text);
      }
    }
  });

  function sendCommand(method, params = {}) {
    return new Promise((resolve) => {
      const id = msgId++;
      pendingRequests.set(id, resolve);
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  await sendCommand('Runtime.enable');
  await sendCommand('Page.enable');
  await sendCommand('Log.enable');

  console.log(`\n================================================================`);
  console.log(`       TESTING ${ROUTES.length} ROUTES IN HEADLESS EDGE BROWSER        `);
  console.log(`================================================================\n`);

  const results = [];

  for (const route of ROUTES) {
    currentExceptions.length = 0;
    currentConsoleErrors.length = 0;

    const fullUrl = `${BASE_URL}${route}`;
    process.stdout.write(`• Testing ${route.padEnd(38)} `);

    const startTime = Date.now();
    await sendCommand('Page.navigate', { url: fullUrl });

    await new Promise((r) => setTimeout(r, 1500));

    const duration = Date.now() - startTime;

    const fatalExceptions = currentExceptions.filter((e) => {
      return true;
    });

    const fatalErrors = currentConsoleErrors.filter((e) => {
      if (!e) return false;
      const lower = e.toLowerCase();
      if (lower.includes('favicon.ico') || lower.includes('manifest.json')) return false;
      return true;
    });

    if (fatalExceptions.length > 0) {
      console.log(`\x1b[31mCRASH (Exception)\x1b[0m (${duration}ms)`);
      for (const ex of fatalExceptions) {
        console.log(`   \x1b[31mException:\x1b[0m ${ex.split('\n')[0]}`);
      }
      results.push({ route, status: 'CRASH', exceptions: fatalExceptions });
    } else if (fatalErrors.length > 0) {
      console.log(`\x1b[33mWARN (Console Error)\x1b[0m (${duration}ms)`);
      for (const err of fatalErrors.slice(0, 2)) {
        console.log(`   \x1b[33mConsole Error:\x1b[0m ${err.split('\n')[0]}`);
      }
      results.push({ route, status: 'WARN', errors: fatalErrors });
    } else {
      console.log(`\x1b[32mPASS\x1b[0m (${duration}ms)`);
      results.push({ route, status: 'PASS' });
    }
  }

  ws.close();
  edge.kill();

  console.log(`\n================================================================`);
  console.log(`                          SUMMARY REPORT                        `);
  console.log(`================================================================`);
  const crashed = results.filter((r) => r.status === 'CRASH');
  const warned = results.filter((r) => r.status === 'WARN');
  const passed = results.filter((r) => r.status === 'PASS');

  console.log(`Total Routes Tested: ${ROUTES.length}`);
  console.log(`Passed cleanly:      ${passed.length}`);
  console.log(`Warnings / Errors:   ${warned.length}`);
  console.log(`Crashes:             ${crashed.length}`);
  console.log(`================================================================\n`);
}

run().catch((e) => {
  console.error('Fatal runner error:', e);
  process.exit(1);
});
