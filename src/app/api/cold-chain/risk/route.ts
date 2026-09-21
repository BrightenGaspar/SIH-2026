import { NextResponse } from 'next/server';
import { assessColdChainRisk } from '@/services/coldChainRiskService';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { crop, currentTemp, currentHumidity, hoursInTransit, shipmentId } = await req.json();
    if (currentTemp == null) {
      return NextResponse.json({ success: false, error: 'Driver-reported currentTemp is required.' }, { status: 400 });
    }
    const result = assessColdChainRisk(
      crop || 'Fresh Produce',
      Number(currentTemp),
      Number(currentHumidity ?? 85.0),
      Number(hoursInTransit ?? 1),
      shipmentId
    );
    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

export async function GET() {
  try {
    // Query authoritative active trips from logistics_trips
    const { data: trips, error } = await supabase
      .from('logistics_trips')
      .select('*')
      .eq('status', 'IN TRANSIT')
      .order('updated_at', { ascending: false })
      .limit(1);

    if (error || !trips || trips.length === 0 || trips[0].current_temp == null) {
      return NextResponse.json({
        success: true,
        data: null,
        message: 'No driver-reported active trip reading available.',
      });
    }

    const trip = trips[0];
    const result = assessColdChainRisk(
      trip.commodity || 'Fresh Produce',
      Number(trip.current_temp),
      Number(trip.humidity ?? 85.0),
      2,
      trip.id
    );

    return NextResponse.json({ success: true, data: result });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message }, { status: 500 });
  }
}
