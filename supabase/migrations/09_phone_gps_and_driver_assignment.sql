-- ==============================================================================
-- AgriFlow.ai: Migration 09 - Phone-Based Live Logistics Tracking & Driver Assignment
-- ==============================================================================

-- 1. Ensure driver_id exists on public.logistics_trips for driver authorization
ALTER TABLE public.logistics_trips 
  ADD COLUMN IF NOT EXISTS driver_id UUID,
  ADD COLUMN IF NOT EXISTS driver_phone_tracking BOOLEAN DEFAULT false;

-- 2. Add GPS accuracy and speed columns to shipment_telemetry_logs
ALTER TABLE public.shipment_telemetry_logs 
  ADD COLUMN IF NOT EXISTS gps_accuracy_meters NUMERIC,
  ADD COLUMN IF NOT EXISTS speed_kmh NUMERIC;

-- 3. Create index for high-performance driver trip lookup
CREATE INDEX IF NOT EXISTS idx_logistics_trips_driver_id 
  ON public.logistics_trips(driver_id, status);

-- 4. Ensure realtime publication includes logistics_trips updates
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
      AND schemaname = 'public' 
      AND tablename = 'logistics_trips'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.logistics_trips;
  END IF;
END $$;
