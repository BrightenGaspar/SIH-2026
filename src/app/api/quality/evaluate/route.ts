import { NextResponse } from 'next/server';
import { evaluateProduceQuality } from '@/services/qualityService';

export async function POST(req: Request) {
  try {
    const { crop, quantityKg, lotId } = await req.json();
    const result = evaluateProduceQuality(crop || 'Tomato (Hybrid Desi)', quantityKg || 600, lotId);
    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

export async function GET() {
  const result = evaluateProduceQuality('Tomato (Hybrid Desi)', 600, 'LOT-2026-7842');
  return NextResponse.json({ success: true, data: result });
}
