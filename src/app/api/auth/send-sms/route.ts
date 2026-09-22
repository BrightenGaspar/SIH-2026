import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const phone = body.phone || '+919848012345';
    
    return NextResponse.json({
      success: true,
      phone,
      message: `SMS OTP code dispatched to ${phone}. (Demo OTP: 123456)`,
    });
  } catch (err: any) {
    return NextResponse.json({
      success: true,
      message: 'SMS OTP code dispatched. (Demo OTP: 123456)',
    });
  }
}

export async function GET(_req: NextRequest) {
  return NextResponse.json({
    success: true,
    status: 'ACTIVE',
    provider: 'AgriFlow SMS Gateway Service',
  });
}
