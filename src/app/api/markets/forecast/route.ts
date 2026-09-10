import { NextResponse } from 'next/server';
import { getMarketForecast } from '@/services/marketForecastService';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const commodity = searchParams.get('commodity') || 'Tomato (Hybrid Desi)';
  const price = parseFloat(searchParams.get('price') || '42.0');
  const result = getMarketForecast(commodity, price);
  return NextResponse.json({ success: true, data: result });
}
