import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(_req: NextRequest) {
  return NextResponse.json(
    {
      success: false,
      error: 'phone login not enabled yet',
      message: 'Phone OTP authentication is temporarily disabled. Please sign in using email.',
    },
    { status: 503 }
  );
}

export async function GET(_req: NextRequest) {
  return NextResponse.json(
    {
      success: false,
      status: 'DISABLED',
      message: 'phone login not enabled yet',
    },
    { status: 503 }
  );
}
