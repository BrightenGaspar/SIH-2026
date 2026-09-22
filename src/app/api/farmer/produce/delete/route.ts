import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ybtncqqphsnbazmwvuvi.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_ILuR9zf-nqBUli4eBMDZug_xZEHreRg';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate caller via session bearer token
    const authHeader = req.headers.get('Authorization') || req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Missing authentication token.' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '').trim();
    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false },
    });

    const { data: { user }, error: userError } = await authClient.auth.getUser(token);
    if (userError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Session expired or invalid.' },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { produceId } = body;
    if (!produceId) {
      return NextResponse.json(
        { success: false, error: 'Missing produceId in request body.' },
        { status: 400 }
      );
    }

    // Use service role if available for reliable administrative cleanup, else user client
    const client = serviceRoleKey
      ? createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } })
      : authClient;

    // 2. Fetch the produce listing to verify existence and check ownership
    const { data: listing, error: fetchErr } = await client
      .from('produce_listings')
      .select('id, farmer_id, produce_name')
      .eq('id', produceId)
      .maybeSingle();

    if (fetchErr) {
      return NextResponse.json(
        { success: false, error: fetchErr.message },
        { status: 500 }
      );
    }

    if (!listing) {
      return NextResponse.json(
        { success: false, error: 'Produce listing not found or already deleted.' },
        { status: 404 }
      );
    }

    // 3. Verify ownership: user is listing owner, or user is admin, or listing farmer_id is null/demo
    const { data: profile } = await client
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    const isAdmin = profile?.role === 'admin';
    const isOwner = listing.farmer_id === user.id;
    const isLegacyUnassigned = listing.farmer_id === null;

    if (!isOwner && !isAdmin && !isLegacyUnassigned) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: You can only delete your own produce listings.' },
        { status: 403 }
      );
    }

    // 4. Check for active orders in progress
    const { data: activeOrders, error: orderErr } = await client
      .from('orders')
      .select('id, status')
      .eq('listing_id', produceId)
      .in('status', ['pending', 'accepted', 'preparing', 'ready_for_pickup', 'pickup_assigned', 'in_transit']);

    if (orderErr) {
      console.warn('Could not check orders for produce listing:', orderErr.message);
    } else if (activeOrders && activeOrders.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot delete produce: There are ${activeOrders.length} active order(s) in progress for this listing. Please complete or cancel those orders first.`,
        },
        { status: 409 }
      );
    }

    // 5. Delete from produce_listings
    const { error: deleteErr } = await client
      .from('produce_listings')
      .delete()
      .eq('id', produceId);

    if (deleteErr) {
      return NextResponse.json(
        { success: false, error: deleteErr.message },
        { status: 500 }
      );
    }

    // Also clean from legacy produce table if it exists
    await client.from('produce').delete().eq('id', produceId);

    return NextResponse.json({
      success: true,
      message: `Listing "${listing.produce_name}" deleted successfully.`,
    });
  } catch (err: any) {
    console.error('Delete produce route error:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
