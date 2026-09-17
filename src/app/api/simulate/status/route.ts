import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    const { data: trips, error } = await supabase
      .from('logistics_trips')
      .select('*')
      .order('updated_at', { ascending: false });

    if (error) {
      return NextResponse.json(
        { status: 'ERROR', message: error.message, shipments: [] },
        { status: 500 }
      );
    }

    const breachCount = (trips || []).filter(
      (t) => t.has_temperature_breach || (t.current_temp != null && Number(t.current_temp) > (Number(t.safe_temp_threshold) || 8.0))
    ).length;

    return NextResponse.json({
      status: 'ONLINE',
      mode: 'PRODUCTION_REAL_DATA (Supabase PostgreSQL)',
      total_active_trips: trips?.length || 0,
      temperature_breaches: breachCount,
      last_updated_at: new Date().toISOString(),
      shipments: trips || [],
    });
  } catch (err: any) {
    return NextResponse.json(
      { status: 'ERROR', message: err?.message, shipments: [] },
      { status: 500 }
    );
  }
}
