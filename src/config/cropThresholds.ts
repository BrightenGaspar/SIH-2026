export interface CropColdChainProfile {
  crop: string;
  minTempCelsius: number;
  maxTempCelsius: number;
  optimalTempCelsius: number;
  minHumidityPercent: number;
  maxHumidityPercent: number;
  maxSafeTransitHours: number;
  dailyStorageRatePerKg: number;
  dailySpoilageRatePercent: number;
  defaultElasticity: number;
}

export const CROP_COLD_CHAIN_PROFILES: Record<string, CropColdChainProfile> = {
  'Tomato (Hybrid Desi)': {
    crop: 'Tomato (Hybrid Desi)',
    minTempCelsius: 10.0,
    maxTempCelsius: 15.0,
    optimalTempCelsius: 12.5,
    minHumidityPercent: 85.0,
    maxHumidityPercent: 95.0,
    maxSafeTransitHours: 72,
    dailyStorageRatePerKg: 0.25,
    dailySpoilageRatePercent: 0.80,
    defaultElasticity: 0.65,
  },
  'Tomato': {
    crop: 'Tomato',
    minTempCelsius: 10.0,
    maxTempCelsius: 15.0,
    optimalTempCelsius: 12.5,
    minHumidityPercent: 85.0,
    maxHumidityPercent: 95.0,
    maxSafeTransitHours: 72,
    dailyStorageRatePerKg: 0.25,
    dailySpoilageRatePercent: 0.80,
    defaultElasticity: 0.65,
  },
  'Onion (Nashik Red)': {
    crop: 'Onion (Nashik Red)',
    minTempCelsius: 0.0,
    maxTempCelsius: 5.0,
    optimalTempCelsius: 2.0,
    minHumidityPercent: 65.0,
    maxHumidityPercent: 70.0,
    maxSafeTransitHours: 168,
    dailyStorageRatePerKg: 0.15,
    dailySpoilageRatePercent: 0.30,
    defaultElasticity: 0.50,
  },
  'Green Chilli (G4)': {
    crop: 'Green Chilli (G4)',
    minTempCelsius: 7.0,
    maxTempCelsius: 10.0,
    optimalTempCelsius: 8.5,
    minHumidityPercent: 90.0,
    maxHumidityPercent: 95.0,
    maxSafeTransitHours: 48,
    dailyStorageRatePerKg: 0.35,
    dailySpoilageRatePercent: 1.20,
    defaultElasticity: 0.70,
  },
  'Potato (Jyoti)': {
    crop: 'Potato (Jyoti)',
    minTempCelsius: 4.0,
    maxTempCelsius: 8.0,
    optimalTempCelsius: 6.0,
    minHumidityPercent: 90.0,
    maxHumidityPercent: 95.0,
    maxSafeTransitHours: 240,
    dailyStorageRatePerKg: 0.12,
    dailySpoilageRatePercent: 0.20,
    defaultElasticity: 0.45,
  },
  'Banana (Robusta)': {
    crop: 'Banana (Robusta)',
    minTempCelsius: 13.0,
    maxTempCelsius: 15.0,
    optimalTempCelsius: 14.0,
    minHumidityPercent: 90.0,
    maxHumidityPercent: 95.0,
    maxSafeTransitHours: 72,
    dailyStorageRatePerKg: 0.30,
    dailySpoilageRatePercent: 1.50,
    defaultElasticity: 0.60,
  },
};

export function getCropColdChainProfile(cropName: string): CropColdChainProfile {
  const match = Object.keys(CROP_COLD_CHAIN_PROFILES).find(k => 
    cropName.toLowerCase().includes(k.toLowerCase()) || k.toLowerCase().includes(cropName.toLowerCase())
  );
  return match ? CROP_COLD_CHAIN_PROFILES[match] : CROP_COLD_CHAIN_PROFILES['Tomato (Hybrid Desi)'];
}
