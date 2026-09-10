import { NextResponse } from 'next/server';
import { calculateProfitability } from '@/services/profitabilityService';
import { ProfitabilityInput } from '@/types/intelligence';

export async function POST(req: Request) {
  try {
    const body: ProfitabilityInput = await req.json();
    const result = calculateProfitability(body);
    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

export async function GET() {
  const result = calculateProfitability({
    marketableQuantityKg: 600,
    sellingPricePerKg: 52.92,
    productionCost: 18000,
    recoveryCost: 2000,
    transportCost: 1500,
  });
  return NextResponse.json({ success: true, data: result });
}
