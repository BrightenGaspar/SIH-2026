import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    success: true,
    data: {
      platformStatus: 'HEALTHY',
      activeFarmers: 1284,
      verifiedBuyers: 342,
      activeReeferTrucks: 86,
      dailyTradingVolumeKg: 48500,
      totalSavedFoodLossKg: 12400,
      averageFarmerRealizationUpliftPercent: 18.4,
      openWeatherIncidents: [
        {
          region: 'Sangareddy & Medak Cluster',
          severity: 'Moderate Rain Damage (35-45%)',
          crop: 'Tomato & Chilli',
          elasticityAdjusted: true,
          activeSupplyShortagePercent: 38,
        },
        {
          region: 'Nashik Onion Belt',
          severity: 'Localized Hailstorm',
          crop: 'Onion (Nashik Red)',
          elasticityAdjusted: true,
          activeSupplyShortagePercent: 22,
        },
      ],
      systemLatencyMs: 42,
      lastUpdated: new Date().toISOString(),
    },
  });
}
