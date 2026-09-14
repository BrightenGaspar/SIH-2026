import { NextResponse } from 'next/server';
import { detectFoodLossRisk } from '@/services/foodLossService';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const lotId = searchParams.get('lotId') || 'LOT-2026-8841';
  const crop = searchParams.get('crop') || 'Tomato (Hybrid Desi)';
  const qty = parseFloat(searchParams.get('quantityKg') || '600');
  const age = parseFloat(searchParams.get('ageDays') || '4');
  const result = detectFoodLossRisk(lotId, crop, qty, age);
  return NextResponse.json({ success: true, data: result });
}
