import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

interface IngestTelemetryPayload {
  trip_id: string;
  vehicle_id?: string;
  latitude?: number | null;
  longitude?: number | null;
  accuracy_meters?: number | null;
  speed_kmh?: number | null;
  heading?: number | null;
  temperature?: number | null;
  humidity?: number | null;
  source?: string;
  timestamp?: string;
  driver_id?: string;
}

export async function POST(req: NextRequest) {
  try {
    const body: IngestTelemetryPayload = await req.json();
    const { 
      trip_id, 
      latitude, 
      longitude, 
      accuracy_meters, 
      speed_kmh, 
      temperature, 
      humidity, 
      source, 
      timestamp,
      driver_id 
    } = body;

    if (!trip_id || typeof trip_id !== 'string') {
      return NextResponse.json(
        { error: 'trip_id is required and must be a string' },
        { status: 400 }
      );
    }

    // 1. Verify trip exists in public.logistics_trips or public.logistics_assignments
    let { data: trip, error: fetchErr } = await supabase
      .from('logistics_trips')
      .select('*')
      .eq('id', trip_id)
      .maybeSingle();

    let matchedAssignment: any = null;
    if (!trip) {
      const { data: la } = await supabase
        .from('logistics_assignments')
        .select('*')
        .or(`id.eq.${trip_id},order_id.eq.${trip_id}`)
        .maybeSingle();

      if (la) {
        matchedAssignment = la;
        trip = {
          id: la.id,
          driver_id: la.operator_id,
          current_lat: la.current_lat,
          current_lng: la.current_lng,
          current_temp: la.current_temp,
          humidity: la.humidity,
          safe_temp_threshold: la.target_temp || 8.0,
          commodity: 'Harvest',
          telemetry_source: 'driver-phone-gps',
        };
      }
    }

    if (fetchErr) {
      return NextResponse.json(
        { error: `Database error querying trip: ${fetchErr.message}` },
        { status: 500 }
      );
    }

    if (!trip) {
      return NextResponse.json(
        { error: `Trip '${trip_id}' not found in active logistics records.` },
        { status: 404 }
      );
    }

    // 2. Driver Authorization & Assignment Validation
    const authHeader = req.headers.get('authorization');
    let callerDriverId: string | null = driver_id || null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '').trim();
      try {
        const { data: userData } = await supabase.auth.getUser(token);
        if (userData?.user?.id) {
          callerDriverId = userData.user.id;
        }
      } catch {
        // Fall back to callerDriverId if token validation fails in dev/test
      }
    }

    // Prevent Driver A from updating Driver B's shipment
    if (trip.driver_id && callerDriverId && trip.driver_id !== callerDriverId) {
      return NextResponse.json(
        { 
          error: `Forbidden: Unauthorized driver. This shipment is assigned to driver '${trip.driver_id}'. Driver '${callerDriverId}' cannot submit telemetry for another driver's haul.` 
        },
        { status: 403 }
      );
    }

    const recordedAt = timestamp ? new Date(timestamp).toISOString() : new Date().toISOString();
    const telemetrySource = source?.trim() || 'driver-phone-gps';
    const isPhoneGps = telemetrySource === 'driver-phone-gps';

    // 3. Strict Coordinate Validation (-90 to 90 lat, -180 to 180 lng)
    if (latitude != null) {
      const numLat = Number(latitude);
      if (isNaN(numLat) || numLat < -90 || numLat > 90) {
        return NextResponse.json(
          { error: 'Invalid latitude value. Latitude must be between -90 and 90.' },
          { status: 400 }
        );
      }
    }

    if (longitude != null) {
      const numLng = Number(longitude);
      if (isNaN(numLng) || numLng < -180 || numLng > 180) {
        return NextResponse.json(
          { error: 'Invalid longitude value. Longitude must be between -180 and 180.' },
          { status: 400 }
        );
      }
    }

    const cleanLat = latitude != null && !isNaN(Number(latitude)) ? Number(latitude) : trip.current_lat;
    const cleanLng = longitude != null && !isNaN(Number(longitude)) ? Number(longitude) : trip.current_lng;
    const cleanAccuracy = accuracy_meters != null && !isNaN(Number(accuracy_meters)) ? Number(accuracy_meters) : null;
    const cleanSpeed = speed_kmh != null && !isNaN(Number(speed_kmh)) ? Number(speed_kmh) : null;

    // Strict separation: Phone GPS beacon does NOT provide reefer cargo temperature.
    // Temperature and humidity remain null unless an authentic hardware sensor sends it.
    const cleanTemp = !isPhoneGps && temperature != null && !isNaN(Number(temperature)) ? Number(temperature) : null;
    const cleanHum = !isPhoneGps && humidity != null && !isNaN(Number(humidity)) ? Number(humidity) : null;

    const safeThreshold = Number(trip.safe_temp_threshold) || 8.0;
    const isTempBreached = cleanTemp !== null && cleanTemp > safeThreshold;

    // 4. Update active trip in public.logistics_trips
    const updatePayload: Record<string, any> = {
      current_lat: cleanLat,
      current_lng: cleanLng,
      updated_at: recordedAt,
      last_telemetry_at: recordedAt,
      telemetry_source: telemetrySource,
    };

    // Bind driver assignment if not yet bound
    if (callerDriverId && !trip.driver_id) {
      updatePayload.driver_id = callerDriverId;
    }

    // Only update temperature fields if an actual temperature sensor was provided
    if (cleanTemp !== null) {
      updatePayload.current_temp = cleanTemp;
      updatePayload.has_temperature_breach = isTempBreached;
      if (isTempBreached) {
        updatePayload.breach_temperature = cleanTemp;
        updatePayload.spoilage_risk = cleanTemp > 12.0 ? 'CRITICAL' : 'HIGH';
      } else {
        updatePayload.spoilage_risk = 'LOW';
      }
    }

    if (cleanHum !== null) {
      updatePayload.humidity = cleanHum;
    }

    let { error: updateErr } = await supabase
      .from('logistics_trips')
      .update(updatePayload)
      .eq('id', trip_id);

    // Resilient fallback: If database schema has not yet applied migration 08/09
    // (missing last_telemetry_at, telemetry_source, driver_id, or has_temperature_breach),
    // retry with guaranteed base columns
    if (updateErr) {
      console.warn('Telemetry extended column update failed, retrying with base columns:', updateErr.message);
      const basePayload: Record<string, any> = {
        current_lat: cleanLat,
        current_lng: cleanLng,
        updated_at: recordedAt,
      };

      if (cleanTemp !== null) {
        basePayload.current_temp = cleanTemp;
        basePayload.spoilage_risk = isTempBreached ? (cleanTemp > 12.0 ? 'CRITICAL' : 'HIGH') : 'LOW';
      }

      if (cleanHum !== null) {
        basePayload.humidity = cleanHum;
      }

      const retryResult = await supabase
        .from('logistics_trips')
        .update(basePayload)
        .eq('id', trip_id);

      updateErr = retryResult.error;
    }

    if (matchedAssignment) {
      try {
        const assignUpdate: Record<string, any> = {
          current_lat: cleanLat,
          current_lng: cleanLng,
          updated_at: recordedAt,
        };
        if (cleanTemp !== null) assignUpdate.current_temp = cleanTemp;
        if (cleanHum !== null) assignUpdate.humidity = cleanHum;
        await supabase
          .from('logistics_assignments')
          .update(assignUpdate)
          .or(`id.eq.${trip_id},order_id.eq.${trip_id}`);
      } catch {
        // Best-effort sync
      }
    }

    if (updateErr && !matchedAssignment) {
      return NextResponse.json(
        { error: `Failed to update trip telemetry: ${updateErr.message}` },
        { status: 500 }
      );
    }

    // 5. Log immutable time-series record into public.shipment_telemetry_logs
    try {
      await supabase.from('shipment_telemetry_logs').insert({
        trip_id,
        temperature: cleanTemp,
        humidity: cleanHum,
        latitude: cleanLat,
        longitude: cleanLng,
        gps_accuracy_meters: cleanAccuracy,
        speed_kmh: cleanSpeed,
        telemetry_source: telemetrySource,
        created_at: recordedAt,
      });
    } catch {
      // Graceful fallback if table is not cached
    }

    // 6. Only trigger temperature alert if genuine sensor breach occurred (never from phone GPS)
    let alertCreated = false;
    if (isTempBreached && cleanTemp !== null) {
      try {
        const severity = cleanTemp > 12.0 ? 'CRITICAL' : 'HIGH';
        await supabase.from('temperature_alerts').insert({
          trip_id,
          crop: trip.commodity || 'Perishable Cargo',
          actual_temperature: cleanTemp,
          safe_threshold: safeThreshold,
          severity,
          current_lat: cleanLat,
          current_lng: cleanLng,
          telemetry_source: telemetrySource,
          status: 'ACTIVE',
          created_at: recordedAt,
        });
        alertCreated = true;
      } catch {
        // Table fallback
      }
    }

    return NextResponse.json({
      success: true,
      status: 'LIVE',
      trip_id,
      telemetry: {
        latitude: cleanLat,
        longitude: cleanLng,
        accuracy_meters: cleanAccuracy,
        speed_kmh: cleanSpeed,
        temperature: cleanTemp,
        humidity: cleanHum,
        temperature_status: isPhoneGps ? 'No live reading — phone GPS beacon active' : cleanTemp != null ? 'CONNECTED' : 'DISCONNECTED',
        source: telemetrySource,
        timestamp: recordedAt,
      },
      assigned_driver_id: trip.driver_id || callerDriverId,
      alert_triggered: alertCreated,
      is_breached: isTempBreached,
      safe_threshold: safeThreshold,
    });

  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Failed to ingest telemetry' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const tripId = searchParams.get('trip_id');

    if (!tripId) {
      // Return fleet telemetry summary
      const { data: trips, error } = await supabase
        .from('logistics_trips')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        count: trips?.length || 0,
        trips: trips || [],
      });
    }

    // Return single trip telemetry
    let { data: trip, error } = await supabase
      .from('logistics_trips')
      .select('*')
      .eq('id', tripId)
      .maybeSingle();

    if (!trip) {
      const { data: la } = await supabase
        .from('logistics_assignments')
        .select('*')
        .or(`id.eq.${tripId},order_id.eq.${tripId}`)
        .maybeSingle();

      if (la) {
        trip = {
          id: la.id,
          driver_id: la.operator_id,
          current_lat: la.current_lat,
          current_lng: la.current_lng,
          current_temp: la.current_temp,
          humidity: la.humidity,
          safe_temp_threshold: la.target_temp || 8.0,
          commodity: 'Harvest',
          telemetry_source: 'driver-phone-gps',
          last_telemetry_at: la.updated_at,
          updated_at: la.updated_at,
          has_temperature_breach: false,
        };
      }
    }

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!trip) {
      return NextResponse.json(
        { error: `Trip '${tripId}' not found.` },
        { status: 404 }
      );
    }

    const lastPing = trip.last_telemetry_at || trip.updated_at;
    let dataFreshness: 'LIVE' | 'STALE' | 'NO_DATA' = 'NO_DATA';

    if (lastPing) {
      const diffMinutes = (Date.now() - new Date(lastPing).getTime()) / (1000 * 60);
      dataFreshness = diffMinutes <= 3 ? 'LIVE' : 'STALE';
    }

    return NextResponse.json({
      success: true,
      trip_id: trip.id,
      freshness: dataFreshness,
      telemetry: {
        temperature: trip.current_temp != null ? Number(trip.current_temp) : null,
        humidity: trip.humidity != null ? Number(trip.humidity) : null,
        latitude: trip.current_lat != null ? Number(trip.current_lat) : null,
        longitude: trip.current_lng != null ? Number(trip.current_lng) : null,
        source: trip.telemetry_source || 'Hardware Sensor',
        last_updated: lastPing || null,
      },
      safe_temp_threshold: Number(trip.safe_temp_threshold) || 8.0,
      has_temperature_breach: Boolean(trip.has_temperature_breach),
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Failed to retrieve telemetry' },
      { status: 500 }
    );
  }
}
