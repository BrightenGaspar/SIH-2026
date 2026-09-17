const fs = require('fs');
const path = require('path');

const files = [
  path.join(__dirname, '..', 'src', 'components', 'logistics', 'PhoneGpsBeacon.tsx'),
  path.join(__dirname, '..', 'src', 'app', 'logistics', 'track', '[tripId]', 'page.tsx')
];

for (const file of files) {
  if (fs.existsSync(file)) {
    const raw = fs.readFileSync(file);
    // Convert to UTF-8 clean string
    let str = raw.toString('utf8');
    // If it has UTF-16 null bytes (e.g. from Set-Content default encoding), decode as utf16le
    if (raw[0] === 0xFF && raw[1] === 0xFE) {
      str = raw.toString('utf16le');
    }
    fs.writeFileSync(file, str, { encoding: 'utf8' });
    console.log(`Rewrote ${file} as valid clean UTF-8`);
  } else {
    console.error(`File not found: ${file}`);
  }
}
