const { spawn } = require('child_process');
const path = require('path');

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
    process.stderr.write(`${svc.color}[${svc.name} ERROR]\x1b[0m ${data}`);
  });

  child.on('close', code => {
    console.log(`${svc.name} exited with code ${code}`);
  });
});

console.log('\x1b[32m%s\x1b[0m', '✅ All 3 microservers launched successfully!');
console.log('👉 Farmer Portal:    http://localhost:5001/api/health');
console.log('👉 Buyer Portal:     http://localhost:5002/api/health');
console.log('👉 Logistics/QC:     http://localhost:5003/api/health');
console.log('\x1b[32m%s\x1b[0m', '==========================================================');