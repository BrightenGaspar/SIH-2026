import { NextResponse } from 'next/server';
import { calculatePricing } from '@/services/pricingEngine';
import { PricingInput } from '@/types/intelligence';

export async function POST(req: Request) {
  try {
    const body: PricingInput = await req.json();
    const result = calculatePricing(body);
    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

export async function GET() {
  // Demo benchmark call
  const result = calculatePricing({
    commodity: 'Tomato (Hybrid Desi)',
    expectedQuantityKg: 1000,
    marketableQuantityKg: 600,
    totalProductionCost: 18000,
    recoveryCost: 2000,
    transportCost: 1500,
    baseMarketPrice: 42.00,
  });
  return NextResponse.json({ success: true, data: result });
}
