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
  proxyRequest('127.0.0.1', 5001, `/api/farmer${req.url}`, req, res);
});

app.use('/api/buyer', (req, res) => {
  proxyRequest('127.0.0.1', 5002, `/api/buyer${req.url}`, req, res);
});

app.use('/api/logistics', (req, res) => {
  proxyRequest('127.0.0.1', 5003, `/api/logistics${req.url}`, req, res);
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

  proxy.on('error', err => {
    res.status(502).json({ error: 'Microservice unavailable', details: err.message });
  });

  if (req.body && Object.keys(req.body).length > 0) {
    proxy.write(JSON.stringify(req.body));
  }
  proxy.end();
}

app.listen(GATEWAY_PORT, () => {
  console.log('\x1b[32m%s\x1b[0m', `🚀 Master Gateway listening on Render Port: ${GATEWAY_PORT}`);
});