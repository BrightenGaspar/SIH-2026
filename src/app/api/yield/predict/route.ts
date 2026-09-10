import { NextResponse } from 'next/server';
import { predictYield } from '@/services/yieldPredictionService';
import { YieldPredictionInput } from '@/types/intelligence';

export async function POST(req: Request) {
  try {
    const body: YieldPredictionInput = await req.json();
    const result = predictYield(body);
    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

export async function GET() {
  const result = predictYield({
    commodity: 'Tomato (Hybrid Desi)',
    farmAcreage: 1.5,
    location: 'Zaheerabad, Sangareddy',
    soilHealthIndex: 82,
  });
  return NextResponse.json({ success: true, data: result });
}
