import { MandiCandidate, DestinationOptimizationResult, DemandTrend } from '@/types/intelligence';

export const CANDIDATE_MANDIS: MandiCandidate[] = [
  {
    id: 'mandi-bowenpally',
    name: 'Bowenpally Wholesale Mandi',
    district: 'Hyderabad',
    state: 'Telangana',
    distanceKm: 32,
    currentMandiPrice: 52.50,
    marketTrend: 'BULLISH',
    expectedDemandTons: 120,
    freightRatePerKg: 1.20,
    mandiCessAndHandlingPerKg: 0.80,
    estimatedSpoilageTransitPercent: 1.0,
  },
  {
    id: 'mandi-vashi',
    name: 'Vashi APMC Market',
    district: 'Navi Mumbai',
    state: 'Maharashtra',
    distanceKm: 680,
    currentMandiPrice: 62.00,
    marketTrend: 'BULLISH',
    expectedDemandTons: 450,
    freightRatePerKg: 6.50,
    mandiCessAndHandlingPerKg: 1.50,
    estimatedSpoilageTransitPercent: 4.5,
  },
  {
    id: 'mandi-yeshwanthpur',
    name: 'Yeshwanthpur APMC Yard',
    district: 'Bengaluru',
    state: 'Karnataka',
    distanceKm: 540,
    currentMandiPrice: 58.00,
    marketTrend: 'STABLE',
    expectedDemandTons: 310,
    freightRatePerKg: 5.20,
    mandiCessAndHandlingPerKg: 1.20,
    estimatedSpoilageTransitPercent: 3.5,
  },
  {
    id: 'mandi-koyambedu',
    name: 'Koyambedu Wholesale Complex',
    district: 'Chennai',
    state: 'Tamil Nadu',
    distanceKm: 620,
    currentMandiPrice: 59.50,
    marketTrend: 'BULLISH',
    expectedDemandTons: 380,
    freightRatePerKg: 5.80,
    mandiCessAndHandlingPerKg: 1.30,
    estimatedSpoilageTransitPercent: 4.0,
  },
  {
    id: 'mandi-sangareddy-local',
    name: 'Sangareddy Local Sub-Market Yard',
    district: 'Sangareddy',
    state: 'Telangana',
    distanceKm: 14,
    currentMandiPrice: 46.00,
    marketTrend: 'BEARISH',
    expectedDemandTons: 40,
    freightRatePerKg: 0.60,
    mandiCessAndHandlingPerKg: 0.50,
    estimatedSpoilageTransitPercent: 0.5,
  },
];

export function optimizeDestinations(
  marketableQtyKg: number,
  canditates: MandiCandidate[] = CANDIDATE_MANDIS
): DestinationOptimizationResult[] {
  const qty = Math.max(1, marketableQtyKg);
  const localMandi = canditates.find(m => m.id === 'mandi-sangareddy-local') || canditates[0];
  const localNetPerKg = localMandi.currentMandiPrice - localMandi.freightRatePerKg - localMandi.mandiCessAndHandlingPerKg;

  const results: DestinationOptimizationResult[] = canditates.map((mandi) => {
    const grossRevenue = Number((qty * mandi.currentMandiPrice).toFixed(2));
    const transportCost = Number((qty * mandi.freightRatePerKg).toFixed(2));
    const handlingCost = Number((qty * mandi.mandiCessAndHandlingPerKg).toFixed(2));
    const spoilageLossAmount = Number(((grossRevenue * mandi.estimatedSpoilageTransitPercent) / 100).toFixed(2));

    const netFarmerRealization = Number((grossRevenue - transportCost - handlingCost - spoilageLossAmount).toFixed(2));
    const netRealizationPerKg = Number((netFarmerRealization / qty).toFixed(2));
    const advantageOverLocalPerKg = Number((netRealizationPerKg - localNetPerKg).toFixed(2));

    return {
      mandi,
      grossRevenue,
      transportCost,
      handlingCost,
      spoilageLossAmount,
      netFarmerRealization,
      netRealizationPerKg,
      rank: 0,
      isRecommended: false,
      advantageOverLocalPerKg,
    };
  });

  // Rank strictly by net farmer realization per kg
  results.sort((a, b) => b.netFarmerRealization - a.netFarmerRealization);
  results.forEach((res, index) => {
    res.rank = index + 1;
    res.isRecommended = index === 0;
  });

  return results;
}
