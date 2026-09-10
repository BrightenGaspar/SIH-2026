import { NextResponse } from 'next/server';
import { optimizeLogisticsRoute } from '@/services/routeOptimizerService';

export async function POST(req: Request) {
  try {
    const { origin, destination } = await req.json();
    const result = optimizeLogisticsRoute(origin, destination);
    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

export async function GET() {
  const result = optimizeLogisticsRoute();
  return NextResponse.json({ success: true, data: result });
}
