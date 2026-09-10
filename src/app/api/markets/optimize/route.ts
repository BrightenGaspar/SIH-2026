import { NextResponse } from 'next/server';
import { optimizeDestinations } from '@/services/destinationOptimizerService';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const qty = parseFloat(searchParams.get('quantityKg') || '600');
  const results = optimizeDestinations(qty);
  return NextResponse.json({ success: true, data: results });
}
