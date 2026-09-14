import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const shipmentId = body.shipment_id;

    let query = supabase
      .from('logistics_trips')
      .update({
        current_temp: 5.2,
        has_temperature_breach: false,
        breach_temperature: null,
        spoilage_risk: 'LOW',
        updated_at: new Date().toISOString(),
      });

    if (shipmentId) {
      query = query.eq('id', shipmentId);
    }

    const { data, error } = await query.select();

    if (error) {
      return NextResponse.json({ status: 'ERROR', message: error.message }, { status: 500 });
    }

    return NextResponse.json({
      status: 'SUCCESS',
      message: `Temperature reset to safe setpoint for shipment ${shipmentId || data?.[0]?.id}`,
      current_temp: 5.2,
      has_temperature_breach: false,
      shipment: data?.[0],
    });
  } catch (err: any) {
    return NextResponse.json({ status: 'ERROR', message: err?.message }, { status: 500 });
  }
}
