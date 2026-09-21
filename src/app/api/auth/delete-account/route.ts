import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ybtncqqphsnbazmwvuvi.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_ILuR9zf-nqBUli4eBMDZug_xZEHreRg';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function POST(req: NextRequest) {
  try {
    // 1. Verify server-side elevated admin configuration
    if (!serviceRoleKey) {
      console.error('[Account Deletion] Server missing SUPABASE_SERVICE_ROLE_KEY');
      return NextResponse.json(
        {
          success: false,
          error: 'Server configuration error: SUPABASE_SERVICE_ROLE_KEY is required for secure account deletion.',
        },
        { status: 500 }
      );
    }

    // 2. Extract Bearer token from Authorization header
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

    // 3. Cryptographically verify the session token with Supabase Auth
    const authVerificationClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false },
    });

    const { data: { user }, error: userError } = await authVerificationClient.auth.getUser(token);

    if (userError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Session expired or invalid. Please re-authenticate.' },
        { status: 401 }
      );
    }

    const canonicalUserId = user.id;
    console.log(`[Account Deletion] Verified caller auth.users.id: ${canonicalUserId}`);

    // 4. Initialize service-role admin client
    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // 5. Invariant Check: Refuse deletion (409) if user has active/unfinished orders
    const { data: unfinishedOrders, error: checkOrdersErr } = await adminClient
      .from('orders')
      .select('id, status')
      .or(`customer_id.eq.${canonicalUserId},buyer_id.eq.${canonicalUserId},farmer_id.eq.${canonicalUserId}`)
      .not('status', 'in', '("completed","cancelled")');

    if (checkOrdersErr) {
      console.error('[Account Deletion] Order check error:', checkOrdersErr.message);
      return NextResponse.json(
        { success: false, error: `Failed to verify active orders: ${checkOrdersErr.message}` },
        { status: 500 }
      );
    }

    if (unfinishedOrders && unfinishedOrders.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot delete account while you have ${unfinishedOrders.length} active, unfinished order(s). Please complete or cancel them first.`,
        },
        { status: 409 }
      );
    }

    // 6. Detach completed/cancelled orders to preserve historical records without personal PII
    const { error: detachErr } = await adminClient
      .from('orders')
      .update({
        customer_id: null,
        buyer_id: null,
        delivery_address: '[Deleted User]',
        delivery_city: '[Redacted]',
      })
      .or(`customer_id.eq.${canonicalUserId},buyer_id.eq.${canonicalUserId}`);

    if (detachErr) {
      console.warn('[Account Deletion] Warning detaching customer orders:', detachErr.message);
    }

    // 7. Clean up farmer listings (if applicable)
    await adminClient.from('produce_listings').delete().eq('farmer_id', canonicalUserId);
    await adminClient.from('produce').delete().eq('farmer_id', canonicalUserId);

    // 8. Delete user profile row
    const { error: profErr } = await adminClient
      .from('profiles')
      .delete()
      .eq('id', canonicalUserId);

    if (profErr) {
      console.warn('[Account Deletion] Profile deletion warning:', profErr.message);
    }

    // 9. Permanently delete user from auth.users
    const { error: adminDelErr } = await adminClient.auth.admin.deleteUser(canonicalUserId);
    if (adminDelErr) {
      console.error('[Account Deletion] Admin deleteUser error:', adminDelErr.message);
      return NextResponse.json(
        { success: false, error: `Failed to remove auth account: ${adminDelErr.message}` },
        { status: 500 }
      );
    }

    console.log(`[Account Deletion] Successfully deleted auth user and detached orders for: ${canonicalUserId}`);

    return NextResponse.json({
      success: true,
      message: 'Your AgriFlow account and associated personal data have been permanently deleted.',
    });
  } catch (err: unknown) {
    const error = err as Error;
    console.error('[Account Deletion] Unexpected error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'An unexpected error occurred during account deletion.' },
      { status: 500 }
    );
  }
}
