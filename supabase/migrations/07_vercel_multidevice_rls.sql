-- ==============================================================================
-- AgriFlow.ai: Vercel Multi-Device Cloud Synchronization Migration
-- Run this in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/ybtncqqphsnbazmwvuvi/sql
-- ==============================================================================

-- 1. Ensure public.produce table exists
CREATE TABLE IF NOT EXISTS public.produce (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id UUID,
  crop_name TEXT NOT NULL,
  variety TEXT,
  category TEXT DEFAULT 'Vegetables',
  quantity NUMERIC NOT NULL,
  unit TEXT DEFAULT 'kg',
  quality_grade TEXT DEFAULT 'A',
  harvest_date DATE DEFAULT CURRENT_DATE,
  asking_price NUMERIC NOT NULL,
  location TEXT,
  status TEXT DEFAULT 'Active',
  image_url TEXT,
  brix NUMERIC DEFAULT 5.2,
  shelf_life_days INTEGER DEFAULT 14,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Ensure columns exist if table was already created
ALTER TABLE public.produce ADD COLUMN IF NOT EXISTS farmer_id UUID;
ALTER TABLE public.produce ADD COLUMN IF NOT EXISTS crop_name TEXT;
ALTER TABLE public.produce ADD COLUMN IF NOT EXISTS variety TEXT;
ALTER TABLE public.produce ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'Vegetables';
ALTER TABLE public.produce ADD COLUMN IF NOT EXISTS quantity NUMERIC;
ALTER TABLE public.produce ADD COLUMN IF NOT EXISTS unit TEXT DEFAULT 'kg';
ALTER TABLE public.produce ADD COLUMN IF NOT EXISTS quality_grade TEXT DEFAULT 'A';
ALTER TABLE public.produce ADD COLUMN IF NOT EXISTS harvest_date DATE DEFAULT CURRENT_DATE;
ALTER TABLE public.produce ADD COLUMN IF NOT EXISTS asking_price NUMERIC;
ALTER TABLE public.produce ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE public.produce ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Active';
ALTER TABLE public.produce ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE public.produce ADD COLUMN IF NOT EXISTS brix NUMERIC DEFAULT 5.2;
ALTER TABLE public.produce ADD COLUMN IF NOT EXISTS shelf_life_days INTEGER DEFAULT 14;
ALTER TABLE public.produce ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

ALTER TABLE public.produce ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read produce" ON public.produce;
CREATE POLICY "Allow public read produce" ON public.produce FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow public insert produce" ON public.produce;
CREATE POLICY "Allow public insert produce" ON public.produce FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow public update produce" ON public.produce;
CREATE POLICY "Allow public update produce" ON public.produce FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Allow public delete produce" ON public.produce;
CREATE POLICY "Allow public delete produce" ON public.produce FOR DELETE USING (true);

-- 2. Ensure public.orders table exists
CREATE TABLE IF NOT EXISTS public.orders (
  id TEXT PRIMARY KEY,
  buyer_id UUID,
  commodity TEXT NOT NULL,
  quantity_kg NUMERIC NOT NULL,
  total_amount NUMERIC NOT NULL,
  farmer_realization NUMERIC,
  logistics_fee NUMERIC,
  platform_fee NUMERIC,
  status TEXT DEFAULT 'Escrow Locked',
  delivery_address TEXT,
  delivery_city TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Ensure columns exist if table was already created
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS buyer_id UUID;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS commodity TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS quantity_kg NUMERIC;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS total_amount NUMERIC;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS farmer_realization NUMERIC;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS logistics_fee NUMERIC;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS platform_fee NUMERIC;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Escrow Locked';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_address TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_city TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read orders" ON public.orders;
CREATE POLICY "Allow public read orders" ON public.orders FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow public insert orders" ON public.orders;
CREATE POLICY "Allow public insert orders" ON public.orders FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow public update orders" ON public.orders;
CREATE POLICY "Allow public update orders" ON public.orders FOR UPDATE USING (true);

-- 3. Ensure public.logistics_trips table exists
CREATE TABLE IF NOT EXISTS public.logistics_trips (
  id TEXT PRIMARY KEY,
  order_id TEXT,
  trip_code TEXT,
  vehicle_number TEXT DEFAULT 'TS 08 UB 4192',
  vehicle_type TEXT DEFAULT 'Tata 407 Reefer',
  driver_name TEXT DEFAULT 'Mohammed Ismail',
  driver_phone TEXT DEFAULT '+91 98480 22341',
  source_hub TEXT DEFAULT 'Shadnagar Farm Hub',
  destination_hub TEXT DEFAULT 'Bowenpally Central Wholesale Yard',
  total_distance_km NUMERIC DEFAULT 74,
  distance_completed_km NUMERIC DEFAULT 46,
  commodity TEXT DEFAULT 'Onion (Nashik Red)',
  total_kg NUMERIC DEFAULT 1000,
  current_lat NUMERIC DEFAULT 17.2403,
  current_lng NUMERIC DEFAULT 78.4294,
  current_temp NUMERIC DEFAULT 5.8,
  target_temp NUMERIC DEFAULT 5.0,
  humidity NUMERIC DEFAULT 86,
  status TEXT DEFAULT 'IN TRANSIT',
  spoilage_risk TEXT DEFAULT 'LOW',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Ensure columns exist if table was already created
ALTER TABLE public.logistics_trips ADD COLUMN IF NOT EXISTS order_id TEXT;
ALTER TABLE public.logistics_trips ADD COLUMN IF NOT EXISTS trip_code TEXT;
ALTER TABLE public.logistics_trips ADD COLUMN IF NOT EXISTS vehicle_number TEXT DEFAULT 'TS 08 UB 4192';
ALTER TABLE public.logistics_trips ADD COLUMN IF NOT EXISTS vehicle_type TEXT DEFAULT 'Tata 407 Reefer';
ALTER TABLE public.logistics_trips ADD COLUMN IF NOT EXISTS driver_name TEXT DEFAULT 'Mohammed Ismail';
ALTER TABLE public.logistics_trips ADD COLUMN IF NOT EXISTS driver_phone TEXT DEFAULT '+91 98480 22341';
ALTER TABLE public.logistics_trips ADD COLUMN IF NOT EXISTS source_hub TEXT DEFAULT 'Shadnagar Farm Hub';
ALTER TABLE public.logistics_trips ADD COLUMN IF NOT EXISTS destination_hub TEXT DEFAULT 'Bowenpally Central Wholesale Yard';
ALTER TABLE public.logistics_trips ADD COLUMN IF NOT EXISTS total_distance_km NUMERIC DEFAULT 74;
ALTER TABLE public.logistics_trips ADD COLUMN IF NOT EXISTS distance_completed_km NUMERIC DEFAULT 46;
ALTER TABLE public.logistics_trips ADD COLUMN IF NOT EXISTS commodity TEXT DEFAULT 'Onion (Nashik Red)';
ALTER TABLE public.logistics_trips ADD COLUMN IF NOT EXISTS total_kg NUMERIC DEFAULT 1000;
ALTER TABLE public.logistics_trips ADD COLUMN IF NOT EXISTS current_lat NUMERIC DEFAULT 17.2403;
ALTER TABLE public.logistics_trips ADD COLUMN IF NOT EXISTS current_lng NUMERIC DEFAULT 78.4294;
ALTER TABLE public.logistics_trips ADD COLUMN IF NOT EXISTS current_temp NUMERIC DEFAULT 5.8;
ALTER TABLE public.logistics_trips ADD COLUMN IF NOT EXISTS target_temp NUMERIC DEFAULT 5.0;
ALTER TABLE public.logistics_trips ADD COLUMN IF NOT EXISTS humidity NUMERIC DEFAULT 86;
ALTER TABLE public.logistics_trips ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'IN TRANSIT';
ALTER TABLE public.logistics_trips ADD COLUMN IF NOT EXISTS spoilage_risk TEXT DEFAULT 'LOW';
ALTER TABLE public.logistics_trips ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

ALTER TABLE public.logistics_trips ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read logistics_trips" ON public.logistics_trips;
CREATE POLICY "Allow public read logistics_trips" ON public.logistics_trips FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow public insert logistics_trips" ON public.logistics_trips;
CREATE POLICY "Allow public insert logistics_trips" ON public.logistics_trips FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow public update logistics_trips" ON public.logistics_trips;
CREATE POLICY "Allow public update logistics_trips" ON public.logistics_trips FOR UPDATE USING (true);

-- 4. Enable Supabase Realtime WebSocket streaming so any phone immediately sees new produce
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.produce;
  EXCEPTION WHEN duplicate_object THEN NULL; END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
  EXCEPTION WHEN duplicate_object THEN NULL; END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.logistics_trips;
  EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;

