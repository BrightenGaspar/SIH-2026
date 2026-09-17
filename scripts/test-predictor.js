const fs = require('fs');
const path = require('path');

function testOLS(cropName) {
  const csvPath = path.join(__dirname, '..', 'data', 'historical_prices.csv');
  const lines = fs.readFileSync(csvPath, 'utf-8').split('\n');
  const cleanCrop = cropName.toLowerCase();
  const prices = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const parts = line.split(',');
    if (parts.length >= 5 && parts[1].toLowerCase().includes(cleanCrop)) {
      const val = parseFloat(parts[4]);
      if (!isNaN(val)) prices.push(val);
    }
  }

  const n = prices.length;
  if (n < 5) {
    return {
      status: 'UNAVAILABLE',
      error: 'Price prediction unavailable — insufficient historical data',
      observations: n,
    };
  }

  const xVals = Array.from({ length: n }, (_, i) => i);
  const meanX = (n - 1) / 2;
  const meanY = prices.reduce((a, b) => a + b, 0) / n;

  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i++) {
    num += (xVals[i] - meanX) * (prices[i] - meanY);
    den += Math.pow(xVals[i] - meanX, 2);
  }

  const slope = den !== 0 ? num / den : 0;
  const intercept = meanY - slope * meanX;

  let sumAbsErrors = 0;
  let sumSqResiduals = 0;
  let sumSqTotal = 0;

  for (let i = 0; i < n; i++) {
    const yHat = slope * i + intercept;
    const res = prices[i] - yHat;
    sumAbsErrors += Math.abs(res);
    sumSqResiduals += Math.pow(res, 2);
    sumSqTotal += Math.pow(prices[i] - meanY, 2);
  }

  return {
    status: 'LIVE',
    crop: cropName,
    observations: n,
    predicted_price: Math.round((slope * n + intercept) * 100) / 100,
    r_squared: Math.round((1 - sumSqResiduals / sumSqTotal) * 1000) / 1000,
    mae: Math.round((sumAbsErrors / n) * 100) / 100,
    rmse: Math.round(Math.sqrt(sumSqResiduals / n) * 100) / 100,
  };
}

console.log('Testing Tomato (existing):', testOLS('Tomato'));
console.log('Testing Dragonfruit (non-existent):', testOLS('Dragonfruit'));
