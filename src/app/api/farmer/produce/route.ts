import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ybtncqqphsnbazmwvuvi.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_ILuR9zf-nqBUli4eBMDZug_xZEHreRg';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const {
      crop,
      crop_name,
      produce_name,
      variety,
      notes,
      category,
      quantity,
      quantity_kg,
      expectedPrice,
      price,
      asking_price,
      price_per_kg,
      price_per_unit,
      unit = 'kg',
      grade = 'A',
      quality_grade = 'A',
      location,
      harvestDate,
      harvest_date,
      imageUrl,
      image_url,
      farmerId,
      farmer_id,
    } = body;

    const resolvedCropName = (crop || crop_name || produce_name || '').trim();
    if (!resolvedCropName) {
      return NextResponse.json(
        { success: false, error: 'Crop/produce name is required.' },
        { status: 400 }
      );
    }

    const resolvedQty = Math.max(0, Number(quantity || quantity_kg || 0));
    if (resolvedQty <= 0) {
      return NextResponse.json(
        { success: false, error: 'Quantity must be greater than zero.' },
        { status: 400 }
      );
    }

    const resolvedPrice = Math.max(0, Number(expectedPrice || price || asking_price || price_per_kg || price_per_unit || 0));
    if (resolvedPrice <= 0) {
      return NextResponse.json(
        { success: false, error: 'Expected price must be greater than zero.' },
        { status: 400 }
      );
    }

    const resolvedLocation = (location || 'Local Farm Hub').trim();
    const resolvedCategory = (category || 'vegetables').toLowerCase();
    const resolvedGrade = (grade || quality_grade || 'A').toUpperCase();
    const resolvedHarvestDate = harvestDate || harvest_date || new Date().toISOString().split('T')[0];
    const resolvedVariety = (variety || notes || '').trim() || null;
    const resolvedImage = imageUrl || image_url || null;

    // Resolve caller identity
    let effectiveFarmerId = farmerId || farmer_id;
    const authHeader = req.headers.get('Authorization') || req.headers.get('authorization');

    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false },
    });

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '').trim();
      const { data: { user } } = await authClient.auth.getUser(token);
      if (user?.id) {
        effectiveFarmerId = user.id;
      }
    }

    if (!effectiveFarmerId) {
      effectiveFarmerId = '5583349e-8416-41d8-903c-3bbf36fd896f'; // Standard registered farmer identity
    }

    const client = serviceRoleKey
      ? createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } })
      : authClient;

    const newId = crypto.randomUUID();
    const now = new Date().toISOString();

    // 1. Primary insert into produce_listings
    const listingPayload = {
      id: newId,
      farmer_id: effectiveFarmerId,
      produce_name: resolvedCropName,
      variety: resolvedVariety,
      category: resolvedCategory,
      total_quantity: resolvedQty,
      available_quantity: resolvedQty,
      price_per_unit: resolvedPrice,
      unit: unit,
      quality_grade: resolvedGrade,
      harvest_date: resolvedHarvestDate,
      location_address: resolvedLocation,
      status: 'Active',
      image_url: resolvedImage,
      created_at: now,
      updated_at: now,
    };

    const { data: listingData, error: listingErr } = await client
      .from('produce_listings')
      .insert(listingPayload)
      .select()
      .maybeSingle();

    if (listingErr) {
      console.warn('Notice inserting to produce_listings:', listingErr.message);
      // Fallback direct insert into produce table
      const producePayload = {
        id: newId,
        farmer_id: effectiveFarmerId,
        crop_name: resolvedCropName,
        variety: resolvedVariety,
        category: resolvedCategory,
        quantity: resolvedQty,
        unit: unit,
        quality_grade: resolvedGrade,
        harvest_date: resolvedHarvestDate,
        asking_price: resolvedPrice,
        location: resolvedLocation,
        status: 'Active',
        image_url: resolvedImage,
        created_at: now,
      };

      const { data: prodData, error: prodErr } = await client
        .from('produce')
        .insert(producePayload)
        .select()
        .maybeSingle();

      if (prodErr && !prodData) {
        return NextResponse.json(
          { success: false, error: prodErr.message || listingErr.message },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: `Produce listing for "${resolvedCropName}" created successfully!`,
        produce: {
          id: newId,
          farmer_id: effectiveFarmerId,
          crop: resolvedCropName,
          crop_name: resolvedCropName,
          variety: resolvedVariety,
          quantity: resolvedQty,
          quantity_kg: resolvedQty,
          unit: unit,
          grade: resolvedGrade,
          expectedPrice: resolvedPrice,
          price_per_kg: resolvedPrice,
          location: resolvedLocation,
          harvestDate: resolvedHarvestDate,
          imageUrl: resolvedImage,
          status: 'Active',
          createdAt: now,
        },
      },
      { status: 201 }
    );
  } catch (err: any) {
    console.error('Create produce route error:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false },
    });

    const { data, error } = await supabase
      .from('produce')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, produce: data || [] });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || 'Internal Server Error' }, { status: 500 });
  }
}
