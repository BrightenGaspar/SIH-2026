import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { generateUniqueUsername, upsertProfile, validateRole, toDbRole } from '@/services/profileService';

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
      place,
      area,
      username,
      fpo_name,
      fpoName,
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

    const resolvedFullName = (full_name || fullName || email.split('@')[0]).trim();
    const validatedRole = validateRole(role) || 'farmer';
    const dbRole = toDbRole(validatedRole);

    // 1. Sign up user via Supabase Auth SDK
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: resolvedFullName,
          role: dbRole,
          phone: phone || '',
          place: place || '',
          area: area || '',
          state: state || '',
          district: district || '',
          fpo_name: fpo_name || fpoName || '',
        },
      },
    });

    let user = authData?.user;

    if (authError) {
      if (authError.message.toLowerCase().includes('already registered') || authError.message.toLowerCase().includes('rate limit')) {
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (!signInError && signInData?.user) {
          user = signInData.user;
        } else {
          return NextResponse.json(
            {
              success: false,
              error: authError.message.toLowerCase().includes('rate limit')
                ? 'Supabase Email Rate Limit exceeded. Please turn off "Confirm email" in Supabase Authentication -> Providers -> Email.'
                : authError.message,
            },
            { status: 400 }
          );
        }
      } else {
        return NextResponse.json(
          {
            success: false,
            error: authError.message,
          },
          { status: 400 }
        );
      }
    }
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: 'User creation failed: No user returned by auth provider',
        },
        { status: 500 }
      );
    }

    if (!authData.session) {
      return NextResponse.json(
        {
          success: true,
          requiresEmailConfirmation: true,
          message: 'Account created. Please verify your email before signing in.',
          user: { id: user.id, email: user.email },
        },
        { status: 202 }
      );
    }

    // 2. Resolve username and mandatory profile fields to guarantee isProfileComplete() returns true
    const resolvedUsername = username?.trim()
      ? username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_')
      : await generateUniqueUsername(resolvedFullName, user.id);

    const resolvedPlace = (place || district || 'Central').trim();
    const resolvedArea = (area || district || state || 'Hub').trim();

    // 3. Upsert complete companion profile directly into public.profiles
    const { profile: profileData, error: profileError } = await upsertProfile({
      id: user.id,
      full_name: resolvedFullName,
      username: resolvedUsername,
      role: validatedRole,
      place: resolvedPlace,
      area: resolvedArea,
      phone: phone || null,
      email: email || null,
      state: state || null,
      district: district || null,
      fpo_name: fpo_name || fpoName || null,
    });

    if (profileError) {
      console.error('Error inserting into public.profiles:', profileError);
      return NextResponse.json(
        {
          success: false,
          error: `User authenticated, but companion profile creation failed: ${profileError}`,
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
        profile: profileData,
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
