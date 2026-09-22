import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function GET() {
  const startTime = Date.now();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  let databaseConnected = false;
  let latencyMs = -1;

  if (supabaseUrl && anonKey) {
    try {
      const client = createClient(supabaseUrl, anonKey, {
        auth: { persistSession: false },
      });
      const queryStart = Date.now();
      const { error } = await client.from('produce_listings').select('id').limit(1);
      latencyMs = Date.now() - queryStart;
      if (!error) {
        databaseConnected = true;
      }
    } catch {
      databaseConnected = false;
    }
  }

  const responsePayload = {
    status: databaseConnected ? 'healthy' : 'degraded',
    commit_sha: process.env.VERCEL_GIT_COMMIT_SHA || process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA || '587a755',
    database: {
      connected: databaseConnected,
      latency_ms: latencyMs,
    },
  };

  return NextResponse.json(responsePayload, {
    status: databaseConnected ? 200 : 503,
    headers: {
      'Cache-Control': 'no-store, max-age=0',
    },
  });
}
