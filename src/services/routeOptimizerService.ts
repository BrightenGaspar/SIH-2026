import { RouteOptimizationResult, RouteOption } from '@/types/intelligence';

export function optimizeLogisticsRoute(
  origin: string = 'Zaheerabad Farm Gate, Sangareddy',
  destination: string = 'Bowenpally Wholesale Hub, Hyderabad'
): RouteOptimizationResult {
  const recommendedRoute: RouteOption = {
    id: 'route-agriflow-optimized',
    routeName: 'NH65 AgriFlow Smart Corridor (via Outer Ring Road bypass)',
    distanceKm: 98,
    estimatedHours: 2.2,
    fuelCostInr: 1850,
    tollCostInr: 220,
    coldChainStressIndex: 12,
    co2EmissionsKg: 42,
    isRecommended: true,
    stopsCount: 1,
    roadCondition: 'EXCELLENT',
  };

  const alternativeRoute: RouteOption = {
    id: 'route-traditional-mandi',
    routeName: 'State Highway Traditional Route (via city arterial gridlock)',
    distanceKm: 124,
    estimatedHours: 4.5,
    fuelCostInr: 2950,
    tollCostInr: 110,
    coldChainStressIndex: 68,
    co2EmissionsKg: 78,
    isRecommended: false,
    stopsCount: 5,
    roadCondition: 'POOR_CONGESTED',
  };

  const savingsInr = (alternativeRoute.fuelCostInr + alternativeRoute.tollCostInr) - 
                     (recommendedRoute.fuelCostInr + recommendedRoute.tollCostInr);
  const hoursSaved = Number((alternativeRoute.estimatedHours - recommendedRoute.estimatedHours).toFixed(1));
  const emissionsAvoidedKg = alternativeRoute.co2EmissionsKg - recommendedRoute.co2EmissionsKg;
  const spoilageAvoidancePercent = 2.4; // % saved by 2.3 hrs faster transit

  return {
    origin,
    destination,
    recommendedRoute,
    alternativeRoute,
    savingsInr,
    hoursSaved,
    emissionsAvoidedKg,
    spoilageAvoidancePercent,
  };
}
