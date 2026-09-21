-- ==============================================================================
-- AgriFlow.ai: Migration 16 - Schema Hardening, Missing Tables & Security
-- File: supabase/migrations/16_hardening_and_missing_tables.sql
--
-- Contents:
--   1. Add missing columns to public.profiles, public.produce, public.logistics_trips
--   2. Grant SELECT on public.produce_listings to anon (status = 'active')
--   3. Create the 7 missing tables with RLS enabled, FK indexes, and explicit policies:
--        - public.farmer_clusters
--        - public.cluster_members
--        - public.cluster_inventory
--        - public.traceability_records
--        - public.historical_market_prices (zero seed data)
--        - public.shipment_telemetry_logs
--        - public.temperature_alerts
--   4. RPCs for cluster actions with auth.uid() checks
--   5. Unique constraint on reviews (order_id, reviewer_id)
--   6. Drop legacy delete_user_account() RPC (single server-side path)
--   7. Reload PostgREST schema cache
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. EXTEND EXISTING TABLES SAFELY
-- ------------------------------------------------------------------------------

-- Fix missing coordinates & cluster columns on profiles
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS latitude NUMERIC,
  ADD COLUMN IF NOT EXISTS longitude NUMERIC,
  ADD COLUMN IF NOT EXISTS cooperative_id UUID,
  ADD COLUMN IF NOT EXISTS is_demo_data BOOLEAN DEFAULT false;

-- Fix missing columns on legacy produce table
ALTER TABLE public.produce 
  ADD COLUMN IF NOT EXISTS latitude NUMERIC,
  ADD COLUMN IF NOT EXISTS longitude NUMERIC,
  ADD COLUMN IF NOT EXISTS cluster_id UUID,
  ADD COLUMN IF NOT EXISTS lot_id TEXT,
  ADD COLUMN IF NOT EXISTS is_demo_data BOOLEAN DEFAULT false;

-- Fix missing telemetry columns on logistics_trips
ALTER TABLE public.logistics_trips 
  ADD COLUMN IF NOT EXISTS telemetry_source TEXT,
  ADD COLUMN IF NOT EXISTS last_telemetry_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS safe_temp_threshold NUMERIC DEFAULT 8.0,
  ADD COLUMN IF NOT EXISTS is_demo_data BOOLEAN DEFAULT false;

-- ------------------------------------------------------------------------------
-- 2. PRODUCE LISTINGS ACCESS FIX
-- ------------------------------------------------------------------------------
-- Allow anonymous marketplace browsing for active listings
GRANT SELECT ON public.produce_listings TO anon, authenticated, service_role;

DROP POLICY IF EXISTS "produce_listings_anon_select" ON public.produce_listings;
CREATE POLICY "produce_listings_anon_select" 
  ON public.produce_listings FOR SELECT TO anon 
  USING (status = 'active');

-- ------------------------------------------------------------------------------
-- 3. THE 7 MISSING TABLES
-- ------------------------------------------------------------------------------

-- (1) Farmer Clusters Table
CREATE TABLE IF NOT EXISTS public.farmer_clusters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  commodity TEXT NOT NULL,
  center_place TEXT NOT NULL,
  center_district TEXT,
  center_state TEXT,
  center_lat NUMERIC,
  center_lng NUMERIC,
  radius_km NUMERIC DEFAULT 5.0,
  target_bulk_kg NUMERIC DEFAULT 1000.0,
  current_quantity_kg NUMERIC DEFAULT 0.0,
  active_farmers_count INTEGER DEFAULT 0,
  active_listings_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'Consolidating',
  buyer_match_notified BOOLEAN DEFAULT false,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_farmer_clusters_created_by ON public.farmer_clusters(created_by);
CREATE INDEX IF NOT EXISTS idx_farmer_clusters_commodity ON public.farmer_clusters(commodity);

ALTER TABLE public.farmer_clusters ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.farmer_clusters FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.farmer_clusters TO authenticated, service_role;

DROP POLICY IF EXISTS "farmer_clusters_select" ON public.farmer_clusters;
CREATE POLICY "farmer_clusters_select" ON public.farmer_clusters FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "farmer_clusters_insert" ON public.farmer_clusters;
CREATE POLICY "farmer_clusters_insert" ON public.farmer_clusters FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "farmer_clusters_update" ON public.farmer_clusters;
CREATE POLICY "farmer_clusters_update" ON public.farmer_clusters FOR UPDATE TO authenticated USING (auth.uid() = created_by);

DROP POLICY IF EXISTS "farmer_clusters_delete" ON public.farmer_clusters;
CREATE POLICY "farmer_clusters_delete" ON public.farmer_clusters FOR DELETE TO authenticated USING (auth.uid() = created_by);


-- (2) Cluster Members Table
CREATE TABLE IF NOT EXISTS public.cluster_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cluster_id UUID NOT NULL REFERENCES public.farmer_clusters(id) ON DELETE CASCADE,
  farmer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member',
  joined_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(cluster_id, farmer_id)
);

CREATE INDEX IF NOT EXISTS idx_cluster_members_cluster_id ON public.cluster_members(cluster_id);
CREATE INDEX IF NOT EXISTS idx_cluster_members_farmer_id ON public.cluster_members(farmer_id);

ALTER TABLE public.cluster_members ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.cluster_members FROM anon;
GRANT SELECT, INSERT, DELETE ON public.cluster_members TO authenticated, service_role;

DROP POLICY IF EXISTS "cluster_members_select" ON public.cluster_members;
CREATE POLICY "cluster_members_select" ON public.cluster_members FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "cluster_members_insert" ON public.cluster_members;
CREATE POLICY "cluster_members_insert" ON public.cluster_members FOR INSERT TO authenticated WITH CHECK (auth.uid() = farmer_id);

DROP POLICY IF EXISTS "cluster_members_delete" ON public.cluster_members;
CREATE POLICY "cluster_members_delete" ON public.cluster_members FOR DELETE TO authenticated USING (auth.uid() = farmer_id);


-- (3) Cluster Inventory Table
CREATE TABLE IF NOT EXISTS public.cluster_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cluster_id UUID NOT NULL REFERENCES public.farmer_clusters(id) ON DELETE CASCADE,
  produce_id UUID REFERENCES public.produce_listings(id) ON DELETE SET NULL,
  farmer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  quantity_kg NUMERIC NOT NULL CHECK (quantity_kg > 0),
  crop_name TEXT NOT NULL,
  quality_grade TEXT DEFAULT 'A',
  asking_price_per_kg NUMERIC,
  status TEXT DEFAULT 'Pledged',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cluster_inventory_cluster_id ON public.cluster_inventory(cluster_id);
CREATE INDEX IF NOT EXISTS idx_cluster_inventory_farmer_id ON public.cluster_inventory(farmer_id);
CREATE INDEX IF NOT EXISTS idx_cluster_inventory_produce_id ON public.cluster_inventory(produce_id);

ALTER TABLE public.cluster_inventory ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.cluster_inventory FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cluster_inventory TO authenticated, service_role;

DROP POLICY IF EXISTS "cluster_inventory_select" ON public.cluster_inventory;
CREATE POLICY "cluster_inventory_select" ON public.cluster_inventory FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "cluster_inventory_insert" ON public.cluster_inventory;
CREATE POLICY "cluster_inventory_insert" ON public.cluster_inventory FOR INSERT TO authenticated WITH CHECK (auth.uid() = farmer_id);

DROP POLICY IF EXISTS "cluster_inventory_update" ON public.cluster_inventory;
CREATE POLICY "cluster_inventory_update" ON public.cluster_inventory FOR UPDATE TO authenticated USING (auth.uid() = farmer_id);

DROP POLICY IF EXISTS "cluster_inventory_delete" ON public.cluster_inventory;
CREATE POLICY "cluster_inventory_delete" ON public.cluster_inventory FOR DELETE TO authenticated USING (auth.uid() = farmer_id);


-- (4) Traceability Records Ledger Table
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
  is_demo_data BOOLEAN DEFAULT false,
  stages JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_traceability_farmer_id ON public.traceability_records(farmer_id);
CREATE INDEX IF NOT EXISTS idx_traceability_lot_id ON public.traceability_records(lot_id);

ALTER TABLE public.traceability_records ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.traceability_records FROM anon;
GRANT SELECT, INSERT, UPDATE ON public.traceability_records TO authenticated, service_role;

DROP POLICY IF EXISTS "traceability_records_select" ON public.traceability_records;
CREATE POLICY "traceability_records_select" ON public.traceability_records FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "traceability_records_insert" ON public.traceability_records;
CREATE POLICY "traceability_records_insert" ON public.traceability_records FOR INSERT TO authenticated WITH CHECK (auth.uid() = farmer_id OR auth.uid() IS NULL);

DROP POLICY IF EXISTS "traceability_records_update" ON public.traceability_records;
CREATE POLICY "traceability_records_update" ON public.traceability_records FOR UPDATE TO authenticated USING (auth.uid() = farmer_id);


-- (5) Historical Mandi Prices Table (No seed data)
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
  is_demo_data BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_market_prices_crop_date ON public.historical_market_prices(crop, date DESC);

ALTER TABLE public.historical_market_prices ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.historical_market_prices FROM anon;
GRANT SELECT ON public.historical_market_prices TO authenticated, service_role;
GRANT INSERT, UPDATE, DELETE ON public.historical_market_prices TO service_role;

DROP POLICY IF EXISTS "historical_market_prices_select" ON public.historical_market_prices;
CREATE POLICY "historical_market_prices_select" ON public.historical_market_prices FOR SELECT TO authenticated USING (true);


-- (6) Shipment Telemetry Logs Table
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

CREATE INDEX IF NOT EXISTS idx_shipment_telemetry_trip_id ON public.shipment_telemetry_logs(trip_id, created_at DESC);

ALTER TABLE public.shipment_telemetry_logs ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.shipment_telemetry_logs FROM anon;
GRANT SELECT, INSERT ON public.shipment_telemetry_logs TO authenticated, service_role;

DROP POLICY IF EXISTS "shipment_telemetry_logs_select" ON public.shipment_telemetry_logs;
CREATE POLICY "shipment_telemetry_logs_select" ON public.shipment_telemetry_logs FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "shipment_telemetry_logs_insert" ON public.shipment_telemetry_logs;
CREATE POLICY "shipment_telemetry_logs_insert" ON public.shipment_telemetry_logs FOR INSERT TO authenticated WITH CHECK (true);


-- (7) Temperature Alerts Table
CREATE TABLE IF NOT EXISTS public.temperature_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id TEXT NOT NULL REFERENCES public.logistics_trips(id) ON DELETE CASCADE,
  crop TEXT,
  actual_temperature NUMERIC NOT NULL,
  safe_threshold NUMERIC NOT NULL DEFAULT 8.0,
  severity TEXT NOT NULL DEFAULT 'HIGH',
  current_lat NUMERIC,
  current_lng NUMERIC,
  telemetry_source TEXT,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_temp_alerts_trip_id ON public.temperature_alerts(trip_id, created_at DESC);

ALTER TABLE public.temperature_alerts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.temperature_alerts FROM anon;
GRANT SELECT, INSERT, UPDATE ON public.temperature_alerts TO authenticated, service_role;

DROP POLICY IF EXISTS "temperature_alerts_select" ON public.temperature_alerts;
CREATE POLICY "temperature_alerts_select" ON public.temperature_alerts FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "temperature_alerts_insert" ON public.temperature_alerts;
CREATE POLICY "temperature_alerts_insert" ON public.temperature_alerts FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "temperature_alerts_update" ON public.temperature_alerts;
CREATE POLICY "temperature_alerts_update" ON public.temperature_alerts FOR UPDATE TO authenticated USING (true);


-- ------------------------------------------------------------------------------
-- 4. SECURITY DEFINER RPCS FOR CLUSTER ACTIONS
-- ------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.join_farmer_cluster(p_cluster_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_id UUID;
BEGIN
  v_caller_id := auth.uid();
  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: User must be signed in.' USING ERRCODE = '42501';
  END IF;

  INSERT INTO public.cluster_members (cluster_id, farmer_id, role, joined_at)
  VALUES (p_cluster_id, v_caller_id, 'member', now())
  ON CONFLICT (cluster_id, farmer_id) DO NOTHING;

  UPDATE public.farmer_clusters
  SET active_farmers_count = (
    SELECT COUNT(DISTINCT farmer_id) FROM public.cluster_members WHERE cluster_id = p_cluster_id
  ),
  updated_at = now()
  WHERE id = p_cluster_id;

  RETURN jsonb_build_object('success', true, 'cluster_id', p_cluster_id, 'farmer_id', v_caller_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.leave_farmer_cluster(p_cluster_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_id UUID;
BEGIN
  v_caller_id := auth.uid();
  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: User must be signed in.' USING ERRCODE = '42501';
  END IF;

  DELETE FROM public.cluster_members
  WHERE cluster_id = p_cluster_id AND farmer_id = v_caller_id;

  UPDATE public.farmer_clusters
  SET active_farmers_count = (
    SELECT COUNT(DISTINCT farmer_id) FROM public.cluster_members WHERE cluster_id = p_cluster_id
  ),
  updated_at = now()
  WHERE id = p_cluster_id;

  RETURN jsonb_build_object('success', true, 'cluster_id', p_cluster_id, 'farmer_id', v_caller_id);
END;
$$;

REVOKE ALL ON FUNCTION public.join_farmer_cluster(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.join_farmer_cluster(UUID) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.leave_farmer_cluster(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.leave_farmer_cluster(UUID) TO authenticated, service_role;


-- ------------------------------------------------------------------------------
-- 5. REVIEWS DEDUPLICATION & UNIQUE CONSTRAINT
-- ------------------------------------------------------------------------------

CREATE UNIQUE INDEX IF NOT EXISTS idx_reviews_order_reviewer 
  ON public.reviews (order_id, reviewer_id);


-- ------------------------------------------------------------------------------
-- 6. DROP LEGACY RPC (ONE SINGLE SERVER-SIDE DELETION PATH)
-- ------------------------------------------------------------------------------

DROP FUNCTION IF EXISTS public.delete_user_account();


-- ------------------------------------------------------------------------------
-- 7. RELOAD POSTGREST SCHEMA CACHE
-- ------------------------------------------------------------------------------

NOTIFY pgrst, 'reload schema';
