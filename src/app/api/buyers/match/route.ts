import { NextResponse } from 'next/server';
import { matchBuyers } from '@/services/buyerMatchingService';

export async function POST(req: Request) {
  try {
    const { quantityKg, expectedPrice, grade } = await req.json();
    const results = matchBuyers(quantityKg || 600, expectedPrice || 52.92, grade || 'Grade B');
    return NextResponse.json({ success: true, data: results });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

export async function GET() {
  const results = matchBuyers(600, 52.92, 'Grade B');
  return NextResponse.json({ success: true, data: results });
}
