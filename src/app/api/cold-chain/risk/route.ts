import { NextResponse } from 'next/server';
import { assessColdChainRisk } from '@/services/coldChainRiskService';

export async function POST(req: Request) {
  try {
    const { crop, currentTemp, currentHumidity, hoursInTransit, shipmentId } = await req.json();
    const result = assessColdChainRisk(crop || 'Tomato (Hybrid Desi)', currentTemp, currentHumidity, hoursInTransit, shipmentId);
    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

export async function GET() {
  const result = assessColdChainRisk('Tomato (Hybrid Desi)', 12.6, 89.0, 18);
  return NextResponse.json({ success: true, data: result });
}
