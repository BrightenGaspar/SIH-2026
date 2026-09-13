import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // 1. Extract phone and otp from either Supabase Send SMS Hook payload or direct payload
    let rawPhone = '';
    let otp = '';

    if (body.user?.phone && body.sms?.otp) {
      // Supabase Send SMS Hook format: { user: { phone: ... }, sms: { otp: ... } }
      rawPhone = String(body.user.phone);
      otp = String(body.sms.otp);
    } else if (body.phone && body.otp) {
      // Direct call format: { phone: ..., otp: ... }
      rawPhone = String(body.phone);
      otp = String(body.otp);
    } else if (body.sms?.otp) {
      otp = String(body.sms.otp);
      rawPhone = String(body.phone || body.user?.phone || '');
    } else {
      return NextResponse.json(
        { 
          error: {
            http_code: 400,
            message: 'Missing phone number or OTP in request body.',
          }
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
          }
        },
        { status: 400 }
      );
    }

    if (!otp || String(otp).trim().length < 4) {
      return NextResponse.json(
        { 
          error: {
            http_code: 400,
            message: 'Invalid or missing OTP code.',
          }
        },
        { status: 400 }
      );
    }

    const cleanOtp = String(otp).trim();
    const apiKey =
      process.env.FAST2SMS_API_KEY ||
      'j6aFGtwnAVWZE81hQLu4ld5SMmRX2IoHY0KTc9CpBbNvgDekqiETKlR7dtJFoM6NOQ5AuISb9se823CU';

    // 3. Primary Dispatch: Fast2SMS Dedicated Transactional OTP Route (Works on DND & Non-DND 24/7)
    let smsResponse = await fetch('https://www.fast2sms.com/dev/bulkV2', {
      method: 'POST',
      headers: {
        authorization: apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        route: 'otp',
        variables_values: cleanOtp,
        numbers: cleanPhone,
      }),
    });

    let smsData = await smsResponse.json();

    // 4. Fallback Dispatch: Fast2SMS Quick Route (q) if OTP route returns an issue
    if (!smsData || smsData.return !== true) {
      console.warn('Fast2SMS OTP route returned notice, trying fallback route q:', smsData);
      smsResponse = await fetch('https://www.fast2sms.com/dev/bulkV2', {
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
      smsData = await smsResponse.json();
    }

    if (!smsData || smsData.return !== true) {
      console.error('Fast2SMS API dispatch error:', smsData);
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

    // Supabase Send SMS hook expects a 200 OK response
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
      { 
        error: {
          http_code: 500,
          message: err.message || 'Internal server error while dispatching SMS.',
        }
      },
      { status: 500 }
    );
  }
}

