import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    // 1. Try querying real temperature_alerts table
    const { data: alerts, error: alertErr } = await supabase
      .from('temperature_alerts')
      .select('*')
      .eq('status', 'ACTIVE')
      .order('created_at', { ascending: false });

    if (!alertErr && alerts && alerts.length > 0) {
      const formatted = alerts.map((a: any) => ({
        id: a.id,
        tripId: a.trip_id,
        severity: a.severity,
        sensor: 'TEMPERATURE',
        title: a.severity === 'CRITICAL' ? 'Critical Thermal Excursion' : 'Elevated Cargo Temperature',
        message: `Cargo temp at ${a.actual_temperature}°C exceeds safe threshold (${a.safe_threshold}°C).`,
        timeDetected: a.created_at,
        suggestedAction: a.severity === 'CRITICAL' 
          ? 'Immediate reefer diagnostic & emergency cold dock reroute.' 
          : 'Inspect reefer compressor seals and check ventilation.',
        actualTemp: a.actual_temperature,
        threshold: a.safe_threshold,
        source: a.telemetry_source || 'Verified Telemetry Sensor',
      }));

      return NextResponse.json({ success: true, count: formatted.length, data: formatted });
    }

    // 2. Query active logistics trips where current_temp exceeds threshold
    const { data: trips, error: tripErr } = await supabase
      .from('logistics_trips')
      .select('*')
      .eq('status', 'IN TRANSIT');

    if (!tripErr && trips) {
      const breachedTrips = trips.filter((t: any) => {
        const threshold = Number(t.safe_temp_threshold) || 8.0;
        const temp = t.current_temp != null ? Number(t.current_temp) : null;
        return temp !== null && temp > threshold;
      });

      const alertsFromTrips = breachedTrips.map((t: any) => {
        const threshold = Number(t.safe_temp_threshold) || 8.0;
        const temp = Number(t.current_temp);
        const isCritical = temp > 12.0;
        return {
          id: `alert-${t.id}-${Date.now()}`,
          tripId: t.id,
          severity: isCritical ? 'CRITICAL' : 'HIGH',
          sensor: 'TEMPERATURE',
          title: isCritical ? 'Critical Thermal Excursion' : 'Elevated Cargo Temperature',
          message: `Vehicle ${t.vehicle_number} (${t.commodity}) is at ${temp}°C, exceeding safe threshold ${threshold}°C.`,
          timeDetected: t.updated_at || t.last_telemetry_at || new Date().toISOString(),
          suggestedAction: isCritical
            ? 'Immediate reefer diagnostic & emergency cold dock reroute.'
            : 'Inspect reefer compressor seals and check ventilation.',
          actualTemp: temp,
          threshold,
          source: t.telemetry_source || 'Vehicle Telemetry Gateway',
        };
      });

      return NextResponse.json({
        success: true,
        count: alertsFromTrips.length,
        data: alertsFromTrips,
      });
    }

    // Honest empty response when no breaches exist
    return NextResponse.json({ success: true, count: 0, data: [] });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Failed to fetch cold chain alerts' },
      { status: 500 }
    );
  }
}
