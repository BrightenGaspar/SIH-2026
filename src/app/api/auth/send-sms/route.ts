import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // 1. Extract phone and otp from either Supabase Send SMS Hook payload or direct payload
    let rawPhone = '';
    let otp = '';

    if (body.user && body.user.phone && body.sms && body.sms.otp) {
      // Supabase Send SMS Hook format
      rawPhone = body.user.phone;
      otp = body.sms.otp;
    } else if (body.phone && body.otp) {
      // Direct call format
      rawPhone = body.phone;
      otp = body.otp;
    } else {
      return NextResponse.json(
        { error: 'Missing phone number or OTP in request body.' },
        { status: 400 }
      );
    }

    // 2. Normalize to 10-digit Indian phone number
    const digits = rawPhone.replace(/\D/g, '');
    let cleanPhone = digits;
    if (digits.length === 12 && digits.startsWith('91')) {
      cleanPhone = digits.slice(2);
    } else if (digits.length === 10) {
      cleanPhone = digits;
    } else {
      return NextResponse.json(
        { error: `Invalid Indian mobile number format: ${rawPhone}` },
        { status: 400 }
      );
    }

    if (!otp || String(otp).trim().length < 4) {
      return NextResponse.json(
        { error: 'Invalid or missing OTP code.' },
        { status: 400 }
      );
    }

    const cleanOtp = String(otp).trim();
    const apiKey =
      process.env.FAST2SMS_API_KEY ||
      'j6aFGtwnAVWZE81hQLu4ld5SMmRX2IoHY0KTc9CpBbNvgDekqiETKlR7dtJFoM6NOQ5AuISb9se823CU';

    // 3. Dispatch real SMS via Fast2SMS Quick Route (q)
    const smsResponse = await fetch('https://www.fast2sms.com/dev/bulkV2', {
      method: 'POST',
      headers: {
        authorization: apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        route: 'q',
        message: `AgriFlow verification code is ${cleanOtp}. Valid for 5 minutes. Do not share with anyone.`,
        numbers: cleanPhone,
      }),
    });

    const smsData = await smsResponse.json();

    if (!smsData || smsData.return !== true) {
      console.error('Fast2SMS API dispatch error:', smsData);
      return NextResponse.json(
        {
          error:
            Array.isArray(smsData?.message) && smsData.message.length > 0
              ? smsData.message[0]
              : smsData?.message || 'Failed to dispatch SMS via Fast2SMS gateway.',
        },
        { status: 502 }
      );
    }

    // Supabase Send SMS hook expects a 200 OK response (empty or JSON)
    return NextResponse.json(
      {
        success: true,
        request_id: smsData.request_id,
        message: 'SMS sent successfully.',
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    const err = error as Error;
    console.error('send-sms route error:', err);
    return NextResponse.json(
      { error: err.message || 'Internal server error while dispatching SMS.' },
      { status: 500 }
    );
  }
}
