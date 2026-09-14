import { QualityInspectionResult, ProduceQualityGrade } from '@/types/intelligence';

export function evaluateProduceQuality(
  crop: string,
  quantityKg: number = 600,
  lotId?: string
): QualityInspectionResult {
  const currentLotId = lotId || 'LOT-2026-7842';
  
  // Deterministic simulation based on lotId
  const seed = currentLotId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const blemishRate = Number(((seed % 14) + 1.2).toFixed(1)); // 1.2% - 15%
  const diameter = Math.round(55 + (seed % 18)); // 55mm - 72mm
  const colorMaturity = Math.min(98, Math.max(75, 82 + (seed % 15))); // 75% - 98%

  let grade: ProduceQualityGrade = 'Grade B';
  let premiumDiscount = 0;
  let shelfLifeDays = 7;
  let readiness: 'IMMEDIATE_DISPATCH' | 'STANDARD_STORAGE' | 'EXPEDITE_PROCESSING' = 'STANDARD_STORAGE';

  if (blemishRate < 4.0 && diameter >= 62 && colorMaturity >= 88) {
    grade = 'Grade A';
    premiumDiscount = 10; // +10%
    shelfLifeDays = 9;
    readiness = 'STANDARD_STORAGE';
  } else if (blemishRate > 8.0 || colorMaturity > 94) {
    grade = 'Grade C';
    premiumDiscount = -12; // -12%
    shelfLifeDays = 3;
    readiness = 'EXPEDITE_PROCESSING';
  } else {
    grade = 'Grade B';
    premiumDiscount = 0;
    shelfLifeDays = 6;
    readiness = 'IMMEDIATE_DISPATCH';
  }

  const baseBenchmark = 42.0;
  const recommendedPrice = Number((baseBenchmark * (1 + premiumDiscount / 100)).toFixed(2));

  return {
    crop,
    lotId: currentLotId,
    assignedGrade: grade,
    confidenceScore: 94,
    blemishRatePercent: blemishRate,
    averageDiameterMm: diameter,
    colorMaturityPercent: colorMaturity,
    shelfLifeRemainingDays: shelfLifeDays,
    pricePremiumDiscountPercent: premiumDiscount,
    recommendedBasePricePerKg: recommendedPrice,
    marketReadiness: readiness,
    prefilledListing: {
      title: `${crop} (${grade} - Farm Fresh)`,
      quantityKg,
      grade,
      suggestedListingPrice: recommendedPrice,
    },
  };
}
