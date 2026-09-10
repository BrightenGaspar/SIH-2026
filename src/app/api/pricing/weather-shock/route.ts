import { NextResponse } from 'next/server';
import { calculateWeatherShock } from '@/services/weatherShockService';
import { WeatherShockInput } from '@/types/intelligence';

export async function POST(req: Request) {
  try {
    const body: WeatherShockInput = await req.json();
    const result = calculateWeatherShock(body);
    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

export async function GET() {
  // Benchmark scenario test
  const result = calculateWeatherShock({
    commodity: 'Tomato (Hybrid Desi)',
    expectedHarvestKg: 1000,
    damagedHarvestKg: 400,
    expectedMarketDemandKg: 1000,
    baseMarketPrice: 42.00,
    priceElasticity: 0.65,
    totalProductionCost: 18000,
    recoveryCost: 2000,
    transportCost: 1500,
    weatherEventType: 'Excessive Rainfall',
  });
  return NextResponse.json({ success: true, data: result });
}
