import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(_req: NextRequest) {
  return NextResponse.json(
    {
      success: false,
      error: 'phone login not enabled yet',
      message: 'Phone authentication is currently disabled. Please use email and password authentication.',
    },
    { status: 503 }
  );
}

export async function GET(_req: NextRequest) {
  return NextResponse.json(
    {
      success: false,
      error: 'phone login not enabled yet',
    },
    { status: 503 }
  );
}
