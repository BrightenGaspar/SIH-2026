import { YieldPredictionInput, YieldPredictionResult } from '@/types/intelligence';

export function predictYield(input: YieldPredictionInput): YieldPredictionResult {
  const commodity = input.commodity || 'Tomato (Hybrid Desi)';
  const acreage = Math.max(0.1, input.farmAcreage || 1.5);
  const soilHealth = Math.min(100, Math.max(20, input.soilHealthIndex ?? 78));
  const baseYieldPerAcre = input.historicalYieldKgPerAcre || 6600; // Typical hybrid tomato kg/acre

  // Soil modifier: baseline 70 -> 1.0
  const soilModifier = 1.0 + ((soilHealth - 70) * 0.004);
  const yieldPerAcreKg = Math.round(baseYieldPerAcre * soilModifier);
  const predictedYieldKg = Math.round(yieldPerAcreKg * acreage);

  const lowKg = Math.round(predictedYieldKg * 0.92);
  const highKg = Math.round(predictedYieldKg * 1.08);

  const today = new Date();
  const peakDateObj = new Date(today.getTime() + (14 * 24 * 60 * 60 * 1000));
  const startDateObj = new Date(today.getTime() + (10 * 24 * 60 * 60 * 1000));
  const endDateObj = new Date(today.getTime() + (20 * 24 * 60 * 60 * 1000));

  return {
    commodity,
    predictedYieldKg,
    yieldPerAcreKg,
    confidenceBand: {
      lowKg,
      highKg,
      confidencePercent: 88,
    },
    estimatedHarvestWindow: {
      startDate: startDateObj.toISOString().split('T')[0],
      peakDate: peakDateObj.toISOString().split('T')[0],
      endDate: endDateObj.toISOString().split('T')[0],
    },
    influencingFactors: [
      {
        factor: 'Soil Organic Carbon & Moisture',
        impact: soilHealth >= 75 ? 'POSITIVE' : 'NEUTRAL',
        description: Soil health index measured at /100 supports active fruit sizing.,
      },
      {
        factor: 'Micro-climate Rainfall Index',
        impact: 'NEUTRAL',
        description: 'Moderate precipitation forecast allows standard maturation schedule.',
      },
      {
        factor: 'Historical Regional Productivity',
        impact: 'POSITIVE',
        description: Average 3-year baseline in regional cluster:  kg/acre.,
      },
    ],
    isSimulatedDemo: true,
  };
}
