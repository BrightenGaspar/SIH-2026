import { NextResponse } from 'next/server';
import { SIHScenarioData } from '@/types/farmer';

export async function GET() {
  const scenario: SIHScenarioData = {
    commodity: 'Tomato (Hybrid Desi)',
    buyerLocation: 'Mumbai Vashi APMC Hub',
    targetDemandKg: 1000,
    conventionalPrice: 22.0,
    agriflowRealization: 52.92,
    improvementPerKg: 30.92,
    percentageImprovement: 60.5,
    totalAdditionalRealization: 30920,
    traditionalRoute: {
      distanceKm: 180,
      cost: 4500,
      hours: 6.5,
    },
    optimizedRoute: {
      distanceKm: 112,
      cost: 2800,
      hours: 3.8,
    },
  };

  return NextResponse.json(scenario);
}
