import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      email,
      password,
      full_name,
      fullName,
      role = 'farmer',
      phone,
      state,
      district,
    } = body;

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json(
        {
          success: false,
          error: 'Email and password are required',
        },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        {
          success: false,
          error: 'Password must be at least 6 characters long',
        },
        { status: 400 }
      );
    }

    const resolvedFullName = full_name || fullName || email.split('@')[0];

    // 1. Sign up user via Supabase Auth SDK
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: resolvedFullName,
          role,
          phone,
        },
      },
    });

    if (authError) {
      return NextResponse.json(
        {
          success: false,
          error: authError.message,
        },
        { status: 400 }
      );
    }

    const user = authData.user;
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: 'User creation failed: No user returned by auth provider',
        },
        { status: 500 }
      );
    }

    // 2. Insert companion profile data directly into public.profiles
    const profilePayload = {
      id: user.id,
      full_name: resolvedFullName,
      role,
      phone: phone || null,
      state: state || null,
      district: district || null,
    };

    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .upsert(profilePayload)
      .select()
      .single();

    if (profileError) {
      console.error('Error inserting into public.profiles:', profileError.message);
      return NextResponse.json(
        {
          success: false,
          error: `User authenticated, but companion profile creation failed: ${profileError.message}`,
          userId: user.id,
        },
        { status: 500 }
      );
    }

    // 3. Return clean success response
    return NextResponse.json(
      {
        success: true,
        message: 'User registered and companion profile created successfully',
        user: {
          id: user.id,
          email: user.email,
        },
        profile: profileData || profilePayload,
        session: authData.session,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Unhandled register API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Internal Server Error',
      },
      { status: 500 }
    );
  }
}
