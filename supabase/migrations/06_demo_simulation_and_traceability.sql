-- Migration: 06_demo_simulation_and_traceability.sql
-- Description: Schema additions for real-time shipment simulation, demo dataset tagging, and lot traceability audit ledger

-- 1. Safely add is_demo_data and simulation columns to existing tables
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS is_demo_data BOOLEAN DEFAULT false;

ALTER TABLE public.produce 
  ADD COLUMN IF NOT EXISTS is_demo_data BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS lot_id TEXT,
  ADD COLUMN IF NOT EXISTS estimated_yield_kg NUMERIC,
  ADD COLUMN IF NOT EXISTS origin_place TEXT,
  ADD COLUMN IF NOT EXISTS destination_market TEXT,
  ADD COLUMN IF NOT EXISTS location_lat NUMERIC,
  ADD COLUMN IF NOT EXISTS location_long NUMERIC;

ALTER TABLE public.orders 
  ADD COLUMN IF NOT EXISTS is_demo_data BOOLEAN DEFAULT false;

ALTER TABLE public.logistics_trips 
  ADD COLUMN IF NOT EXISTS is_demo_data BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS route_progress NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS has_temperature_breach BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS breach_temperature NUMERIC,
  ADD COLUMN IF NOT EXISTS last_updated_at TIMESTAMPTZ DEFAULT now();

-- 2. Traceability Records Ledger Table
CREATE TABLE IF NOT EXISTS public.traceability_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lot_id TEXT UNIQUE NOT NULL,
  crop TEXT NOT NULL,
  variety TEXT,
  farmer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  farmer_name TEXT NOT NULL,
  farm_location TEXT NOT NULL,
  harvest_date TEXT NOT NULL,
  assigned_grade TEXT DEFAULT 'Grade A',
  initial_quantity_kg NUMERIC NOT NULL,
  marketable_quantity_kg NUMERIC NOT NULL,
  current_status TEXT DEFAULT 'Delivered',
  buyer_name TEXT,
  final_payout_per_kg NUMERIC,
  soil_health_score NUMERIC DEFAULT 85,
  weather_shock_history TEXT,
  current_temperature_reading NUMERIC,
  is_demo_data BOOLEAN DEFAULT true,
  stages JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Historical Mandi Prices Table (Supports Python AI price predictor)
CREATE TABLE IF NOT EXISTS public.historical_market_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  crop TEXT NOT NULL,
  variety TEXT,
  market TEXT NOT NULL,
  district TEXT,
  state TEXT,
  modal_price_per_kg NUMERIC NOT NULL,
  min_price_per_kg NUMERIC,
  max_price_per_kg NUMERIC,
  arrivals_tonnes NUMERIC,
  is_demo_data BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Enable RLS and Policies
ALTER TABLE public.traceability_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.historical_market_prices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Traceability viewable by public" ON public.traceability_records;
CREATE POLICY "Traceability viewable by public"
  ON public.traceability_records FOR SELECT USING (true);

DROP POLICY IF EXISTS "Traceability insertable by authenticated users" ON public.traceability_records;
CREATE POLICY "Traceability insertable by authenticated users"
  ON public.traceability_records FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Historical prices viewable by all" ON public.historical_market_prices;
CREATE POLICY "Historical prices viewable by all"
  ON public.historical_market_prices FOR SELECT USING (true);

-- 5. Realtime Publication
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.traceability_records;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.historical_market_prices;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;
