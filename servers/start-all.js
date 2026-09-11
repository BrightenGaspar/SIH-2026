const { spawn } = require('child_process');
const path = require('path');
const express = require('express');
const cors = require('cors');
const http = require('http');

console.log('\x1b[32m%s\x1b[0m', '==========================================================');
console.log('\x1b[32m%s\x1b[0m', '🌱 Starting AgriFlow AI 3-Server Microservice Ecosystem...');
console.log('\x1b[32m%s\x1b[0m', '==========================================================');

const services = [
  { name: '🌾 Farmer Svr', file: 'farmer-server.js', port: 5001, color: '\x1b[33m' },
  { name: '🛒 Buyer Svr', file: 'buyer-server.js', port: 5002, color: '\x1b[34m' },
  { name: '🚛 Logistics/QC', file: 'logistics-server.js', port: 5003, color: '\x1b[36m' }
];

services.forEach(svc => {
  const filePath = path.join(__dirname, svc.file);
  const child = spawn('node', [filePath], { stdio: 'pipe' });

  child.stdout.on('data', data => {
    process.stdout.write(`${svc.color}[${svc.name} :${svc.port}]\x1b[0m ${data}`);
  });

  child.stderr.on('data', data => {
    process.stderr.write(`${svc.color}[${svc.name} LOG]\x1b[0m ${data}`);
  });

  child.on('close', code => {
    console.log(`${svc.name} exited with code ${code}`);
  });
});

// Master Gateway for Render (binds to process.env.PORT or 10000)
const GATEWAY_PORT = process.env.PORT || 10000;
const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    system: 'AgriFlow AI Cloud Microservices Ecosystem',
    deployedOn: 'Render Cloud 24/7',
    activeServices: {
      farmerService: 'http://localhost:5001',
      buyerService: 'http://localhost:5002',
      logisticsService: 'http://localhost:5003'
    },
    timestamp: new Date().toISOString()
  });
});

// Proxy routes to individual microservices
app.use('/api/farmer', (req, res) => {
  // BUG FIX #3: Fixed path construction - don't duplicate /api/farmer
  proxyRequest('127.0.0.1', 5001, req.url.startsWith('/api') ? req.url : `/api/farmer${req.url}`, req, res);
});

app.use('/api/buyer', (req, res) => {
  proxyRequest('127.0.0.1', 5002, req.url.startsWith('/api') ? req.url : `/api/buyer${req.url}`, req, res);
});

app.use('/api/logistics', (req, res) => {
  proxyRequest('127.0.0.1', 5003, req.url.startsWith('/api') ? req.url : `/api/logistics${req.url}`, req, res);
});

function proxyRequest(host, port, targetPath, req, res) {
  const options = {
    hostname: host,
    port: port,
    path: targetPath,
    method: req.method,
    headers: req.headers
  };

  const proxy = http.request(options, proxyRes => {
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res, { end: true });
  });

  // BUG FIX #4: Added proper error handling with null check
  proxy.on('error', err => {
    console.error(`[PROXY ERROR on ${port}]`, err.message);
    if (!res.headersSent) {
      res.status(502).json({ 
        error: 'Microservice unavailable', 
        details: err ? err.message : 'Unknown error',
        port: port
      });
    }
  });

  if (req.body && Object.keys(req.body).length > 0) {
    try {
      proxy.write(JSON.stringify(req.body));
    } catch (err) {
      console.error(`[PROXY WRITE ERROR]`, err.message);
      if (!res.headersSent) {
        res.status(400).json({ error: 'Invalid request body' });
      }
    }
  }
  proxy.end();
}

app.listen(GATEWAY_PORT, () => {
  console.log('\x1b[32m%s\x1b[0m', `🚀 Master Gateway listening on Render Port: ${GATEWAY_PORT}`);
});
