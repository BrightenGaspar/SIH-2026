import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function GET() {
  const startTime = Date.now();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  let supabaseConnected = false;
  let supabaseLatencyMs = -1;
  let supabaseError: string | null = null;

  if (supabaseUrl && anonKey) {
    try {
      const client = createClient(supabaseUrl, anonKey, {
        auth: { persistSession: false }
      });
      const queryStart = Date.now();
      const { error } = await client.from('public_produce_catalog').select('id').limit(1);
      supabaseLatencyMs = Date.now() - queryStart;
      if (!error) {
        supabaseConnected = true;
      } else {
        supabaseError = error.message;
      }
    } catch (err: unknown) {
      supabaseError = err instanceof Error ? err.message : String(err);
    }
  } else {
    supabaseError = 'Supabase credentials not configured';
  }

  const responsePayload = {
    status: supabaseConnected ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    commit_sha: process.env.VERCEL_GIT_COMMIT_SHA || process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA || '760aa20',
    vercel_deployment_id: process.env.VERCEL_DEPLOYMENT_ID || null,
    vercel_env: process.env.VERCEL_ENV || process.env.NODE_ENV || 'unknown',
    supabase: {
      connected: supabaseConnected,
      latency_ms: supabaseLatencyMs,
      error: supabaseError
    },
    env_vars_configured: {
      NEXT_PUBLIC_SUPABASE_URL: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
      NEXT_PUBLIC_SUPABASE_ANON_KEY: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
      SUPABASE_SERVICE_ROLE_KEY: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
      FAST2SMS_API_KEY: Boolean(process.env.FAST2SMS_API_KEY)
    },
    total_latency_ms: Date.now() - startTime
  };

  return NextResponse.json(responsePayload, {
    status: supabaseConnected ? 200 : 503,
    headers: {
      'Cache-Control': 'no-store, max-age=0'
    }
  });
}
