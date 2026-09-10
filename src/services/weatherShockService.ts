import { WeatherShockInput, WeatherShockResult } from '@/types/intelligence';
import { PRICING_CONFIG } from '@/config/pricingConfig';

export function calculateWeatherShock(input: WeatherShockInput): WeatherShockResult {
  const commodity = input.commodity || PRICING_CONFIG.DEFAULT_COMMODITY;
  const weatherEventType = input.weatherEventType || 'Excessive Rainfall';
  const expectedHarvestKg = Math.max(0, input.expectedHarvestKg ?? PRICING_CONFIG.DEFAULT_EXPECTED_HARVEST_KG);
  const damagedHarvestKg = Math.min(expectedHarvestKg, Math.max(0, input.damagedHarvestKg ?? PRICING_CONFIG.DEFAULT_DAMAGED_HARVEST_KG));
  const expectedMarketDemandKg = Math.max(1, input.expectedMarketDemandKg ?? PRICING_CONFIG.DEFAULT_EXPECTED_DEMAND_KG);
  const baseMarketPrice = Math.max(0, input.baseMarketPrice ?? PRICING_CONFIG.DEFAULT_BASE_MARKET_PRICE);
  const priceElasticity = input.priceElasticity ?? PRICING_CONFIG.DEFAULT_PRICE_ELASTICITY;
  const maxConfiguredPrice = input.maxConfiguredPrice ?? PRICING_CONFIG.DEFAULT_MAX_SAFETY_PRICE;

  const totalProdCost = Math.max(0, input.totalProductionCost ?? PRICING_CONFIG.DEFAULT_PRODUCTION_COST);
  const recoveryCost = Math.max(0, input.recoveryCost ?? PRICING_CONFIG.DEFAULT_RECOVERY_COST);
  const transportCost = Math.max(0, input.transportCost ?? PRICING_CONFIG.DEFAULT_TRANSPORT_COST);

  // 1. Damage Rate & Marketable Supply
  const damageRatePercent = expectedHarvestKg > 0 
    ? Number(((damagedHarvestKg / expectedHarvestKg) * 100).toFixed(2)) 
    : 0;
  const damageRate = damageRatePercent / 100;
  const marketableSupplyKg = Number(Math.max(0, expectedHarvestKg - damagedHarvestKg).toFixed(2));

  // 2. Supply-Demand Ratio & Dynamic Market Shortage %
  const supplyDemandRatio = Number((marketableSupplyKg / expectedMarketDemandKg).toFixed(4));
  const marketShortagePercent = Number(
    Math.max(0, ((expectedMarketDemandKg - marketableSupplyKg) / expectedMarketDemandKg) * 100).toFixed(2)
  );

  // 3. Dynamic Shock Multiplier
  // shockMultiplier = 1 + (max(0, 1 - supplyDemandRatio) * priceElasticity)
  const unscaledShortage = Math.max(0, 1 - supplyDemandRatio);
  const shockMultiplier = Number((1 + (unscaledShortage * priceElasticity)).toFixed(4));

  // 4. Dynamic Predicted Prices (Unclamped vs Clamped)
  const unclampedPredictedPrice = Number((baseMarketPrice * shockMultiplier).toFixed(2));
  const safetyClampedPredictedPrice = Number(Math.min(unclampedPredictedPrice, maxConfiguredPrice).toFixed(2));
  const isClamped = unclampedPredictedPrice > maxConfiguredPrice;

  // 5. Minimum Sustainable Price
  // (Production cost + recovery + transport) / marketable supply
  const totalCostsIncurred = totalProdCost + recoveryCost + transportCost;
  const minimumSustainablePrice = marketableSupplyKg > 0 
    ? Number((totalCostsIncurred / marketableSupplyKg).toFixed(2)) 
    : 0;

  // 6. Recommended Selling Range (Dynamic Confidence Band)
  const rangeMin = Number(Math.max(minimumSustainablePrice, safetyClampedPredictedPrice * (1 - PRICING_CONFIG.RECOMMENDED_RANGE_BAND)).toFixed(2));
  const rangeMax = Number((safetyClampedPredictedPrice * (1 + PRICING_CONFIG.RECOMMENDED_RANGE_BAND)).toFixed(2));

  // 7. Comprehensive Financial Impact
  const grossRevenueOnMarketableCrop = Number((marketableSupplyKg * safetyClampedPredictedPrice).toFixed(2));
  const netProfitOnMarketableCrop = Number((grossRevenueOnMarketableCrop - totalCostsIncurred).toFixed(2));
  const revenueLostFromDestroyedCrop = Number((damagedHarvestKg * baseMarketPrice).toFixed(2));
  
  // Normal comparison: normal revenue (all harvested sold at base price) - standard production cost
  const normalNetIncome = (expectedHarvestKg * baseMarketPrice) - totalProdCost;
  const netBalanceVersusNormal = Number((netProfitOnMarketableCrop - normalNetIncome).toFixed(2));

  const narrative = Regional  reduced harvest by %, resulting in a % regional supply shortage. Dynamic shock elasticity () lifts predicted market price from ₹/kg to ₹/kg (Shock Multiplier: x). To cover incurred recovery costs, Minimum Sustainable Price is ₹/kg.;

  return {
    commodity,
    weatherEventType,
    expectedHarvestKg,
    damagedHarvestKg,
    damageRatePercent,
    marketableSupplyKg,
    expectedMarketDemandKg,
    supplyDemandRatio,
    marketShortagePercent,
    priceElasticity,
    shockMultiplier,
    baseMarketPrice,
    unclampedPredictedPrice,
    safetyClampedPredictedPrice,
    isClamped,
    maxConfiguredPrice,
    minimumSustainablePrice,
    recommendedSellingRange: {
      min: rangeMin,
      max: rangeMax,
      optimal: safetyClampedPredictedPrice,
    },
    financialImpact: {
      grossRevenueOnMarketableCrop,
      totalCostsIncurred,
      netProfitOnMarketableCrop,
      revenueLostFromDestroyedCrop,
      netBalanceVersusNormal,
    },
    narrative,
  };
}
