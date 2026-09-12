import { PricingInput, PricingResult } from '@/types/intelligence';
import { PRICING_CONFIG } from '@/config/pricingConfig';

export function calculatePricing(input: PricingInput): PricingResult {
  const commodity = input.commodity || PRICING_CONFIG.DEFAULT_COMMODITY;
  const expectedQty = Math.max(0, input.expectedQuantityKg ?? PRICING_CONFIG.DEFAULT_EXPECTED_HARVEST_KG);
  const marketableQty = Math.max(0, input.marketableQuantityKg ?? (expectedQty * 0.6));
  const prodCost = Math.max(0, input.totalProductionCost ?? PRICING_CONFIG.DEFAULT_PRODUCTION_COST);
  const recCost = Math.max(0, input.recoveryCost ?? 0);
  const transCost = Math.max(0, input.transportCost ?? 0);
  const marketPrice = Math.max(0, input.baseMarketPrice ?? PRICING_CONFIG.DEFAULT_BASE_MARKET_PRICE);
  const qualityGrade = input.qualityGrade || 'Grade B';
  const elasticity = input.priceElasticity ?? PRICING_CONFIG.DEFAULT_PRICE_ELASTICITY;
  const maxPriceClamp = input.maxConfiguredPrice ?? PRICING_CONFIG.DEFAULT_MAX_SAFETY_PRICE;

  // Safeguard zero marketable quantity
  if (marketableQty <= 0) {
    return {
      commodity,
      productionCostPerKg: 0,
      minimumSustainablePrice: 0,
      costBasedPrice: 0,
      marketPrice,
      fairReferencePrice: marketPrice,
      qualityAdjustedPrice: marketPrice,
      predictedSellingPrice: marketPrice,
      recommendedSellingRange: { min: 0, max: 0, recommended: 0 },
      factors: {
        costWeight: PRICING_CONFIG.COST_WEIGHT,
        marketWeight: PRICING_CONFIG.MARKET_WEIGHT,
        desiredMargin: PRICING_CONFIG.DEFAULT_DESIRED_MARGIN,
        qualityFactor: 1.0,
        demandFactor: 1.0,
        seasonFactor: 1.0,
      },
      isLossRisk: true,
      explanation: 'No marketable crop available. Production cost cannot be recovered through sales.',
    };
  }

  // 1. Production cost per kg & Minimum Sustainable Price
  const productionCostPerKg = Number((prodCost / marketableQty).toFixed(2));
  const totalIncurredCost = prodCost + recCost + transCost;
  const minimumSustainablePrice = Number((totalIncurredCost / marketableQty).toFixed(2));

  // 2. Cost-Based Price with Target Margin
  const costBasedPrice = Number((productionCostPerKg * (1 + PRICING_CONFIG.DEFAULT_DESIRED_MARGIN)).toFixed(2));

  // 3. Fair Reference Price (40% Cost-Based + 60% Market)
  const fairReferencePrice = Number(
    (PRICING_CONFIG.COST_WEIGHT * costBasedPrice + PRICING_CONFIG.MARKET_WEIGHT * marketPrice).toFixed(2)
  );

  // 4. Quality Factor Adjustment
  const qualityFactor = PRICING_CONFIG.QUALITY_FACTORS[qualityGrade] ?? 1.00;
  const qualityAdjustedPrice = Number((fairReferencePrice * qualityFactor).toFixed(2));

  // 5. Demand & Season Factors
  let demandFactor = PRICING_CONFIG.DEMAND_FACTORS.MODERATE;
  if (input.regionalDemandKg && expectedQty > 0) {
    const supplyDemandRatio = marketableQty / input.regionalDemandKg;
    if (supplyDemandRatio < 0.8) {
      demandFactor = PRICING_CONFIG.DEMAND_FACTORS.HIGH;
    } else if (supplyDemandRatio > 1.2) {
      demandFactor = PRICING_CONFIG.DEMAND_FACTORS.LOW;
    }
  }

  const seasonFactor = input.isPeakSeason ? PRICING_CONFIG.SEASON_FACTORS.PEAK_SUPPLY : PRICING_CONFIG.SEASON_FACTORS.NORMAL;

  // 6. Dynamic Predicted Price with Safety Clamps
  let predictedSellingPrice = Number((qualityAdjustedPrice * demandFactor * seasonFactor).toFixed(2));
  predictedSellingPrice = Math.min(predictedSellingPrice, maxPriceClamp);
  predictedSellingPrice = Math.max(predictedSellingPrice, PRICING_CONFIG.ABSOLUTE_MIN_PRICE_FLOOR);

  // 7. Recommended Selling Range (Dynamic Confidence Band bounded by Minimum Sustainable Price)
  const bandHalf = predictedSellingPrice * PRICING_CONFIG.RECOMMENDED_RANGE_BAND;
  const calculatedMin = Number(Math.max(minimumSustainablePrice, predictedSellingPrice - bandHalf).toFixed(2));
  const calculatedMax = Number(Math.max(calculatedMin + 1.0, predictedSellingPrice + bandHalf).toFixed(2));

  const isLossRisk = predictedSellingPrice < minimumSustainablePrice;

  const explanation = `Fair Reference Price computed dynamically via 40% cost-plus (₹${costBasedPrice}/kg) + 60% market benchmark (₹${marketPrice}/kg), adjusted by ${qualityGrade} quality factor (${qualityFactor}x) and demand index (${demandFactor}x). Minimum Sustainable Price floor is ₹${minimumSustainablePrice}/kg.`;

  return {
    commodity,
    productionCostPerKg,
    minimumSustainablePrice,
    costBasedPrice,
    marketPrice,
    fairReferencePrice,
    qualityAdjustedPrice,
    predictedSellingPrice,
    recommendedSellingRange: {
      min: calculatedMin,
      max: calculatedMax,
      recommended: predictedSellingPrice,
    },
    factors: {
      costWeight: PRICING_CONFIG.COST_WEIGHT,
      marketWeight: PRICING_CONFIG.MARKET_WEIGHT,
      desiredMargin: PRICING_CONFIG.DEFAULT_DESIRED_MARGIN,
      qualityFactor,
      demandFactor,
      seasonFactor,
    },
    isLossRisk,
    explanation,
  };
}
