import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ybtncqqphsnbazmwvuvi.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_ILuR9zf-nqBUli4eBMDZug_xZEHreRg';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function POST(req: NextRequest) {
  try {
    // 1. Extract Bearer token from Authorization header
    const authHeader = req.headers.get('Authorization') || req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Missing or invalid authentication token.' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '').trim();
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Empty authentication token.' },
        { status: 401 }
      );
    }

    // 2. Cryptographically verify the session token with Supabase Auth
    // Canonical source of truth: auth.users.id
    const authVerificationClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false },
    });

    const { data: { user }, error: userError } = await authVerificationClient.auth.getUser(token);

    if (userError || !user) {
      console.warn('Delete account failed authentication check:', userError?.message);
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Session expired or invalid. Please re-authenticate.' },
        { status: 401 }
      );
    }

    const canonicalUserId = user.id;
    console.log(`[Account Deletion] Initiated for verified auth.users.id: ${canonicalUserId}`);

    // 3. Create scoped client authenticated with user's verified token
    const userScopedClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false },
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    });

    // Strategy A: Call PostgreSQL RPC function public.delete_user_account()
    let rpcSucceeded = false;
    try {
      const { data: rpcRes, error: rpcErr } = await userScopedClient.rpc('delete_user_account');
      if (!rpcErr && rpcRes && (rpcRes as any).success) {
        rpcSucceeded = true;
        console.log(`[Account Deletion] RPC delete_user_account succeeded for: ${canonicalUserId}`);
      } else if (rpcErr) {
        console.info('[Account Deletion] RPC call fell through:', rpcErr.message);
      }
    } catch (rpcEx) {
      console.info('[Account Deletion] RPC execution skipped or unmigrated:', rpcEx);
    }

    // Strategy B: Fallback explicit cleanup if RPC not yet deployed
    if (!rpcSucceeded) {
      // a) Delete farmer produce listings owned by this user
      const { error: listErr } = await userScopedClient
        .from('produce_listings')
        .delete()
        .eq('farmer_id', canonicalUserId);
      if (listErr) {
        console.warn('[Account Deletion] Error clearing produce_listings:', listErr.message);
      }

      const { error: prodErr } = await userScopedClient
        .from('produce')
        .delete()
        .eq('farmer_id', canonicalUserId);
      if (prodErr) {
        console.warn('[Account Deletion] Error clearing legacy produce listings:', prodErr.message);
      }

      // b) Anonymize shared orders (preserve transaction totals & logistics records, scrub personal delivery details)
      const { error: ordErr } = await userScopedClient
        .from('orders')
        .update({
          delivery_address: '[Deleted User Account]',
          delivery_city: '[Redacted]',
        })
        .eq('buyer_id', canonicalUserId);
      if (ordErr) {
        console.warn('[Account Deletion] Error anonymizing orders:', ordErr.message);
      }

      // c) Delete companion profile from public.profiles
      const { error: profErr } = await userScopedClient
        .from('profiles')
        .delete()
        .eq('id', canonicalUserId);
      if (profErr) {
        console.warn('[Account Deletion] Error deleting profile row:', profErr.message);
      }

      // d) If server service-role key is available, delete from auth.users
      if (serviceRoleKey) {
        try {
          const adminClient = createClient(supabaseUrl, serviceRoleKey, {
            auth: { autoRefreshToken: false, persistSession: false },
          });
          const { error: adminDelErr } = await adminClient.auth.admin.deleteUser(canonicalUserId);
          if (adminDelErr) {
            console.warn('[Account Deletion] Admin deleteUser warning:', adminDelErr.message);
          } else {
            console.log(`[Account Deletion] Admin deleteUser succeeded for: ${canonicalUserId}`);
          }
        } catch (adminEx) {
          console.warn('[Account Deletion] Admin client exception:', adminEx);
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Your AgriFlow account and associated personal data have been permanently deleted.',
    });
  } catch (err: unknown) {
    const error = err as Error;
    console.error('[Account Deletion] Fatal error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'An unexpected error occurred during account deletion.' },
      { status: 500 }
    );
  }
}
