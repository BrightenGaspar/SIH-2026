import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const FAST2SMS_API_KEY =
  process.env.FAST2SMS_API_KEY ||
  'j6aFGtwnAVWZE81hQLu4ld5SMmRX2IoHY0KTc9CpBbNvgDekqiETKlR7dtJFoM6NOQ5AuISb9se823CU';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));

    // 1. Extract phone and otp from either Supabase Send SMS Hook payload or direct payload
    let rawPhone = '';
    let otp = '';

    if (body.user && body.user.phone && body.sms && body.sms.otp) {
      // Supabase Send SMS Hook format: { user: { phone: ... }, sms: { otp: ... } }
      rawPhone = String(body.user.phone);
      otp = String(body.sms.otp);
    } else if (body.phone && body.otp) {
      // Direct call format: { phone: ..., otp: ... }
      rawPhone = String(body.phone);
      otp = String(body.otp);
    } else if (body.phone) {
      rawPhone = String(body.phone);
      otp = '112009';
    } else if (body.sms?.otp) {
      otp = String(body.sms.otp);
      rawPhone = String(body.phone || body.user?.phone || '');
    } else {
      return NextResponse.json(
        {
          error: {
            http_code: 400,
            message: 'Missing phone number or OTP in request body.',
          },
        },
        { status: 400 }
      );
    }

    // 2. Normalize to 10-digit Indian phone number
    const digits = rawPhone.replace(/\D/g, '');
    const cleanPhone = digits.slice(-10);

    if (cleanPhone.length !== 10) {
      return NextResponse.json(
        {
          error: {
            http_code: 400,
            message: `Invalid Indian mobile number format: ${rawPhone}`,
          },
        },
        { status: 400 }
      );
    }

    const cleanOtp = String(otp).trim() || '112009';

    // 3. Dispatch real SMS via Fast2SMS Quick Route (q)
    const smsResponse = await fetch('https://www.fast2sms.com/dev/bulkV2', {
      method: 'POST',
      headers: {
        authorization: FAST2SMS_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        route: 'q',
        message: `Your AgriFlow verification code is ${cleanOtp}. Valid for 5 minutes. Do not share this code.`,
        numbers: cleanPhone,
      }),
    });

    const smsData = await smsResponse.json().catch(() => null);

    if (!smsData || smsData.return !== true) {
      console.error('Fast2SMS dispatch error:', smsData);
      return NextResponse.json(
        {
          error: {
            http_code: 502,
            message:
              Array.isArray(smsData?.message) && smsData.message.length > 0
                ? smsData.message[0]
                : smsData?.message || 'Failed to dispatch SMS via Fast2SMS gateway.',
          },
        },
        { status: 502 }
      );
    }

    // 4. Return success response (Supabase Hook expects 200 OK)
    return NextResponse.json(
      {
        success: true,
        request_id: smsData.request_id,
        message: 'SMS sent successfully to mobile device.',
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    const err = error as Error;
    console.error('send-sms route error:', err);
    return NextResponse.json(
      {
        error: {
          http_code: 500,
          message: err.message || 'Internal server error while dispatching SMS.',
        },
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    {
      success: true,
      status: 'ACTIVE',
      gateway: 'fast2sms',
      route: 'q',
      message: 'Fast2SMS real SMS OTP dispatch service is operational.',
    },
    { status: 200 }
  );
}
