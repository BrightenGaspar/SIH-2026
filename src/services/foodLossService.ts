import { FoodLossRiskResult, RescueChannel, RiskLevel } from '@/types/intelligence';

export function detectFoodLossRisk(
  lotId: string = 'LOT-2026-8841',
  commodity: string = 'Tomato (Hybrid Desi)',
  quantityKg: number = 600,
  currentAgeDays: number = 4
): FoodLossRiskResult {
  const maxShelfLifeDays = 7;
  const remainingHours = Math.max(0, (maxShelfLifeDays - currentAgeDays) * 24);
  const exposureInr = Math.round(quantityKg * 42.0);

  let riskLevel: RiskLevel = 'LOW';
  if (remainingHours <= 24) {
    riskLevel = 'CRITICAL';
  } else if (remainingHours <= 48) {
    riskLevel = 'HIGH';
  } else if (remainingHours <= 72) {
    riskLevel = 'MEDIUM';
  }

  const rescueChannels: RescueChannel[] = [
    {
      type: 'FOOD_PROCESSOR',
      partnerName: 'Kisan Puree & Sauce Canning Plant (Patancheru)',
      offeredPricePerKg: 38.00,
      potentialSalvageValue: Math.round(quantityKg * 38.00),
      turnaroundHours: 8,
      actionRequired: 'Accept 1-click batch dispatch for paste extraction.',
    },
    {
      type: 'DIRECT_BUYER',
      partnerName: 'Reliance Retail Flash Clearance',
      offeredPricePerKg: 46.00,
      potentialSalvageValue: Math.round(quantityKg * 46.00),
      turnaroundHours: 12,
      actionRequired: 'Discounted batch clearance order.',
    },
    {
      type: 'COLD_STORAGE',
      partnerName: 'Zaheerabad Agro Cold Store (Chamber 3)',
      offeredPricePerKg: 42.00,
      potentialSalvageValue: Math.round(quantityKg * 40.50), // Net after 7-day storage fee
      turnaroundHours: 4,
      actionRequired: 'Reserve 1-ton controlled atmosphere pallet immediately.',
    },
    {
      type: 'NEIGHBOR_MANDI',
      partnerName: 'Bowenpally Evening Wholesale Clearing',
      offeredPricePerKg: 48.00,
      potentialSalvageValue: Math.round(quantityKg * 45.00),
      turnaroundHours: 6,
      actionRequired: 'Route truck directly to evening wholesale auction.',
    },
    {
      type: 'FOOD_RESCUE_NGO',
      partnerName: 'Akshaya Patra Community Food Network',
      offeredPricePerKg: 0,
      potentialSalvageValue: 0,
      turnaroundHours: 3,
      actionRequired: 'Tax-exempt 80G receipt + ₹0 food waste certification.',
    },
  ];

  return {
    lotId,
    commodity,
    quantityKg,
    currentAgeDays,
    maxShelfLifeDays,
    remainingShelfLifeHours: remainingHours,
    riskLevel,
    financialExposureInr: exposureInr,
    recommendedRescueChannels: rescueChannels,
    urgentActionHeadline: riskLevel === 'HIGH' || riskLevel === 'CRITICAL'
      ? URGENT:  kg  has  hours safe life remaining. ₹ at risk.
      : Inventory Freshness Optimal:  hours safe shelf life remaining.,
  };
}
