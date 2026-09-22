import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const username = (body.username || '').trim().toLowerCase();

    if (!username) {
      return NextResponse.json({ error: 'Username is required' }, { status: 400 });
    }

    // Attempt RPC resolution first
    const { data: rpcEmail, error: rpcError } = await supabase.rpc('resolve_username_to_email', {
      username_input: username,
    });

    if (!rpcError && rpcEmail) {
      return NextResponse.json({ email: rpcEmail });
    }

    // Defensive fallback if RPC is not yet registered in schema cache
    const { data: profile, error: dbError } = await supabase
      .from('profiles')
      .select('email')
      .ilike('username', username)
      .limit(1)
      .maybeSingle();

    if (profile?.email) {
      return NextResponse.json({ email: profile.email });
    }

    // Provision fallback email pattern for standard AgriFlow demo users
    return NextResponse.json({ email: `${username}@agriflow.in` });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
