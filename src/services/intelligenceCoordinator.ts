import { UnifiedIntelligencePipelineResult } from '@/types/intelligence';
import { calculateWeatherShock } from './weatherShockService';
import { calculatePricing } from './pricingEngine';
import { calculateProfitability } from './profitabilityService';
import { matchBuyers } from './buyerMatchingService';
import { optimizeDestinations } from './destinationOptimizerService';
import { evaluateStorageVsSell } from './storageOptimizerService';
import { assessColdChainRisk } from './coldChainRiskService';

export interface PipelineSimulationParams {
  expectedHarvestKg?: number;
  damagedHarvestKg?: number;
  expectedMarketDemandKg?: number;
  baseMarketPrice?: number;
  priceElasticity?: number;
  totalProductionCost?: number;
  recoveryCost?: number;
  transportCost?: number;
  storageDays?: number;
  commodity?: string;
  farmerName?: string;
}

export function runUnifiedIntelligencePipeline(
  params: PipelineSimulationParams = {}
): UnifiedIntelligencePipelineResult {
  const commodity = params.commodity || 'Tomato (Hybrid Desi)';
  const farmerName = params.farmerName || 'Ramesh Patel';

  // 1. Weather Shock & Supply Elasticity
  const weatherShock = calculateWeatherShock({
    commodity,
    expectedHarvestKg: params.expectedHarvestKg ?? 1000,
    damagedHarvestKg: params.damagedHarvestKg ?? 400,
    expectedMarketDemandKg: params.expectedMarketDemandKg ?? 1000,
    baseMarketPrice: params.baseMarketPrice ?? 42.0,
    priceElasticity: params.priceElasticity ?? 0.65,
    totalProductionCost: params.totalProductionCost ?? 18000,
    recoveryCost: params.recoveryCost ?? 2000,
    transportCost: params.transportCost ?? 1500,
  });

  const marketableKg = weatherShock.marketableSupplyKg;

  // 2. Pricing Engine
  const pricing = calculatePricing({
    commodity,
    expectedQuantityKg: weatherShock.expectedHarvestKg,
    marketableQuantityKg: marketableKg,
    totalProductionCost: params.totalProductionCost ?? 18000,
    recoveryCost: params.recoveryCost ?? 2000,
    transportCost: params.transportCost ?? 1500,
    baseMarketPrice: weatherShock.baseMarketPrice,
    regionalDemandKg: weatherShock.expectedMarketDemandKg,
    priceElasticity: weatherShock.priceElasticity,
  });

  // 3. Profitability Engine
  const profitability = calculateProfitability({
    marketableQuantityKg: marketableKg,
    sellingPricePerKg: weatherShock.safetyClampedPredictedPrice,
    productionCost: params.totalProductionCost ?? 18000,
    recoveryCost: params.recoveryCost ?? 2000,
    transportCost: params.transportCost ?? 1500,
  });

  // 4. Buyer Matching
  const allMatchedBuyers = matchBuyers(
    marketableKg,
    weatherShock.safetyClampedPredictedPrice,
    'Grade B'
  );
  const topBuyer = allMatchedBuyers[0];

  // 5. Destination Optimization
  const destinationMarkets = optimizeDestinations(marketableKg);

  // 6. Storage Optimizer
  const storageAdvice = evaluateStorageVsSell({
    commodity,
    marketableQuantityKg: marketableKg,
    currentSellingPrice: weatherShock.safetyClampedPredictedPrice,
    projectedFuturePrice: Number((weatherShock.safetyClampedPredictedPrice * 1.08).toFixed(2)),
    storageDays: params.storageDays ?? 5,
  });

  // 7. Cold-Chain IoT Telemetry Risk
  const coldChainRisk = assessColdChainRisk(commodity, 12.6, 89.0, 18);

  return {
    farmerId: 'FRM-7821',
    farmerName,
    commodity,
    harvestOverview: {
      expectedKg: weatherShock.expectedHarvestKg,
      damagedKg: weatherShock.damagedHarvestKg,
      marketableKg,
      damagePercent: weatherShock.damageRatePercent,
    },
    pricing,
    weatherShock,
    profitability,
    topBuyer,
    allMatchedBuyers,
    destinationMarkets,
    storageAdvice,
    coldChainRisk,
    traceabilityLotId: 'LOT-2026-7842',
    timestamp: new Date().toISOString(),
  };
}
