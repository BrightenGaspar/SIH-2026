-- ==============================================================================
-- AgriFlow.ai: Migration 08 - Production Telemetry & Real Temperature Alerts
-- Real IoT / Driver GPS / Reefer Telemetry Ingestion & Audit Tables
-- ==============================================================================

-- 1. Ensure columns exist on public.logistics_trips
ALTER TABLE public.logistics_trips 
  ADD COLUMN IF NOT EXISTS telemetry_source TEXT,
  ADD COLUMN IF NOT EXISTS last_telemetry_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS safe_temp_threshold NUMERIC DEFAULT 8.0;

-- 2. Time-series Telemetry Logs (Immutable Log of actual device/driver pings)
CREATE TABLE IF NOT EXISTS public.shipment_telemetry_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id TEXT NOT NULL REFERENCES public.logistics_trips(id) ON DELETE CASCADE,
  temperature NUMERIC,
  humidity NUMERIC,
  latitude NUMERIC,
  longitude NUMERIC,
  telemetry_source TEXT NOT NULL DEFAULT 'Driver Mobile App',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for high-performance trip telemetry lookups
CREATE INDEX IF NOT EXISTS idx_shipment_telemetry_trip_id 
  ON public.shipment_telemetry_logs(trip_id, created_at DESC);

-- 3. Temperature Alerts Table (Triggered ONLY on genuine telemetry threshold breaches)
CREATE TABLE IF NOT EXISTS public.temperature_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id TEXT NOT NULL REFERENCES public.logistics_trips(id) ON DELETE CASCADE,
  crop TEXT,
  actual_temperature NUMERIC NOT NULL,
  safe_threshold NUMERIC NOT NULL DEFAULT 8.0,
  severity TEXT NOT NULL DEFAULT 'HIGH', -- 'HIGH' | 'CRITICAL'
  current_lat NUMERIC,
  current_lng NUMERIC,
  telemetry_source TEXT,
  status TEXT NOT NULL DEFAULT 'ACTIVE', -- 'ACTIVE' | 'RESOLVED' | 'ACKNOWLEDGED'
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_temp_alerts_trip_id 
  ON public.temperature_alerts(trip_id, created_at DESC);

-- 4. Enable Row Level Security
ALTER TABLE public.shipment_telemetry_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.temperature_alerts ENABLE ROW LEVEL SECURITY;

-- Permissive policies for real-time reads & writes
DROP POLICY IF EXISTS "Allow public read shipment_telemetry_logs" ON public.shipment_telemetry_logs;
CREATE POLICY "Allow public read shipment_telemetry_logs" 
  ON public.shipment_telemetry_logs FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public insert shipment_telemetry_logs" ON public.shipment_telemetry_logs;
CREATE POLICY "Allow public insert shipment_telemetry_logs" 
  ON public.shipment_telemetry_logs FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public read temperature_alerts" ON public.temperature_alerts;
CREATE POLICY "Allow public read temperature_alerts" 
  ON public.temperature_alerts FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public insert temperature_alerts" ON public.temperature_alerts;
CREATE POLICY "Allow public insert temperature_alerts" 
  ON public.temperature_alerts FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update temperature_alerts" ON public.temperature_alerts;
CREATE POLICY "Allow public update temperature_alerts" 
  ON public.temperature_alerts FOR UPDATE USING (true);

-- 5. Enable Supabase Realtime WebSocket streaming for Telemetry and Alerts
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.shipment_telemetry_logs;
  EXCEPTION WHEN duplicate_object THEN NULL; END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.temperature_alerts;
  EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;
