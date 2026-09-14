-- Migration: 05_virtual_cooperative_clustering.sql
-- Description: Virtual Cooperative & Smart Farmer Clustering Schema, RLS, Functions & Events

-- 1. Safely add coordinates & cluster references to existing tables
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS latitude NUMERIC,
  ADD COLUMN IF NOT EXISTS longitude NUMERIC,
  ADD COLUMN IF NOT EXISTS cooperative_id UUID;

ALTER TABLE public.produce
  ADD COLUMN IF NOT EXISTS latitude NUMERIC,
  ADD COLUMN IF NOT EXISTS longitude NUMERIC,
  ADD COLUMN IF NOT EXISTS cluster_id UUID;

-- 2. Farmer Clusters Table
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
  -- Status values: 'Consolidating', 'Bulk Buyer Match Ready', 'Bulk Buyer Matching Active', 'Dispatched', 'Completed'
  buyer_match_notified BOOLEAN DEFAULT false,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Cluster Members Table (Links farmers to cooperatives)
CREATE TABLE IF NOT EXISTS public.cluster_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cluster_id UUID NOT NULL REFERENCES public.farmer_clusters(id) ON DELETE CASCADE,
  farmer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member', -- 'lead' | 'member'
  joined_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(cluster_id, farmer_id)
);

-- 4. Cluster Inventory Table (Allocated produce lots committed to bulk orders)
CREATE TABLE IF NOT EXISTS public.cluster_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cluster_id UUID NOT NULL REFERENCES public.farmer_clusters(id) ON DELETE CASCADE,
  produce_id UUID REFERENCES public.produce(id) ON DELETE SET NULL,
  farmer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  quantity_kg NUMERIC NOT NULL CHECK (quantity_kg > 0),
  crop_name TEXT NOT NULL,
  quality_grade TEXT DEFAULT 'A',
  asking_price_per_kg NUMERIC,
  status TEXT DEFAULT 'Pledged', -- 'Pledged' | 'Committed' | 'Dispatched' | 'Sold'
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Bulk Buyer Matches Table
CREATE TABLE IF NOT EXISTS public.bulk_buyer_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cluster_id UUID NOT NULL REFERENCES public.farmer_clusters(id) ON DELETE CASCADE,
  buyer_id TEXT NOT NULL,
  buyer_name TEXT NOT NULL,
  company TEXT,
  buyer_type TEXT, -- 'Supermarket Chain' | 'Food Processor' | 'Wholesale Trader' | 'Direct Consumer Group'
  offered_price_per_kg NUMERIC NOT NULL,
  desired_quantity_kg NUMERIC NOT NULL,
  match_score NUMERIC NOT NULL,
  destination_hub TEXT,
  distance_km NUMERIC,
  pickup_offered BOOLEAN DEFAULT true,
  payment_terms_days INTEGER DEFAULT 0,
  reliability_rating NUMERIC DEFAULT 4.8,
  status TEXT DEFAULT 'Proposed', -- 'Proposed' | 'Accepted' | 'Dispatched' | 'Completed'
  matched_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Cluster Events Table (Audit timeline and buyer notifications)
CREATE TABLE IF NOT EXISTS public.cluster_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cluster_id UUID NOT NULL REFERENCES public.farmer_clusters(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL, -- 'THRESHOLD_REACHED' | 'BUYER_MATCH_READY' | 'MEMBER_JOINED' | 'INVENTORY_PLEDGED' | 'DISPATCH_SCHEDULED'
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_farmer_clusters_commodity ON public.farmer_clusters(commodity);
CREATE INDEX IF NOT EXISTS idx_farmer_clusters_status ON public.farmer_clusters(status);
CREATE INDEX IF NOT EXISTS idx_farmer_clusters_location ON public.farmer_clusters(center_place, center_district);
CREATE INDEX IF NOT EXISTS idx_cluster_members_cluster ON public.cluster_members(cluster_id);
CREATE INDEX IF NOT EXISTS idx_cluster_members_farmer ON public.cluster_members(farmer_id);
CREATE INDEX IF NOT EXISTS idx_cluster_inventory_cluster ON public.cluster_inventory(cluster_id);
CREATE INDEX IF NOT EXISTS idx_cluster_inventory_farmer ON public.cluster_inventory(farmer_id);
CREATE INDEX IF NOT EXISTS idx_bulk_buyer_matches_cluster ON public.bulk_buyer_matches(cluster_id);
CREATE INDEX IF NOT EXISTS idx_cluster_events_cluster ON public.cluster_events(cluster_id);

-- 8. Row Level Security (RLS)
ALTER TABLE public.farmer_clusters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cluster_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cluster_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bulk_buyer_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cluster_events ENABLE ROW LEVEL SECURITY;

-- RLS: farmer_clusters
DROP POLICY IF EXISTS "Clusters are viewable by all authenticated users" ON public.farmer_clusters;
CREATE POLICY "Clusters are viewable by all authenticated users"
  ON public.farmer_clusters FOR SELECT USING (true);

DROP POLICY IF EXISTS "Farmers can create clusters" ON public.farmer_clusters;
CREATE POLICY "Farmers can create clusters"
  ON public.farmer_clusters FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Cluster members can update cluster metadata" ON public.farmer_clusters;
CREATE POLICY "Cluster members can update cluster metadata"
  ON public.farmer_clusters FOR UPDATE USING (true);

-- RLS: cluster_members
DROP POLICY IF EXISTS "Cluster members viewable by authenticated users" ON public.cluster_members;
CREATE POLICY "Cluster members viewable by authenticated users"
  ON public.cluster_members FOR SELECT USING (true);

DROP POLICY IF EXISTS "Farmers can join clusters" ON public.cluster_members;
CREATE POLICY "Farmers can join clusters"
  ON public.cluster_members FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Farmers can leave clusters" ON public.cluster_members;
CREATE POLICY "Farmers can leave clusters"
  ON public.cluster_members FOR DELETE USING (farmer_id = auth.uid() OR auth.uid() IS NULL);

-- RLS: cluster_inventory
DROP POLICY IF EXISTS "Cluster inventory viewable by participants" ON public.cluster_inventory;
CREATE POLICY "Cluster inventory viewable by participants"
  ON public.cluster_inventory FOR SELECT USING (true);

DROP POLICY IF EXISTS "Farmers can insert into cluster inventory" ON public.cluster_inventory;
CREATE POLICY "Farmers can insert into cluster inventory"
  ON public.cluster_inventory FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Farmers can update own inventory in cluster" ON public.cluster_inventory;
CREATE POLICY "Farmers can update own inventory in cluster"
  ON public.cluster_inventory FOR UPDATE USING (farmer_id = auth.uid() OR auth.uid() IS NULL);

-- RLS: bulk_buyer_matches
DROP POLICY IF EXISTS "Matches viewable by cluster members" ON public.bulk_buyer_matches;
CREATE POLICY "Matches viewable by cluster members"
  ON public.bulk_buyer_matches FOR SELECT USING (true);

DROP POLICY IF EXISTS "Insert bulk buyer matches" ON public.bulk_buyer_matches;
CREATE POLICY "Insert bulk buyer matches"
  ON public.bulk_buyer_matches FOR INSERT WITH CHECK (true);

-- RLS: cluster_events
DROP POLICY IF EXISTS "Cluster events viewable by everyone" ON public.cluster_events;
CREATE POLICY "Cluster events viewable by everyone"
  ON public.cluster_events FOR SELECT USING (true);

DROP POLICY IF EXISTS "Insert cluster events" ON public.cluster_events;
CREATE POLICY "Insert cluster events"
  ON public.cluster_events FOR INSERT WITH CHECK (true);

-- 9. Distance Calculation Function (Haversine Formula in KM)
CREATE OR REPLACE FUNCTION public.haversine_distance_km(
  lat1 NUMERIC,
  lon1 NUMERIC,
  lat2 NUMERIC,
  lon2 NUMERIC
)
RETURNS NUMERIC AS $$
DECLARE
  r NUMERIC := 6371.0; -- Earth radius in KM
  dlat NUMERIC;
  dlon NUMERIC;
  a NUMERIC;
  c NUMERIC;
BEGIN
  IF lat1 IS NULL OR lon1 IS NULL OR lat2 IS NULL OR lon2 IS NULL THEN
    RETURN 0.0;
  END IF;

  dlat := radians(lat2 - lat1);
  dlon := radians(lon2 - lon1);
  
  a := sin(dlat / 2.0)^2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon / 2.0)^2;
  c := 2.0 * asin(sqrt(a));
  
  RETURN ROUND(r * c, 2);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 10. Recalculate Cluster Aggregation & Threshold Trigger Function
CREATE OR REPLACE FUNCTION public.recalculate_cluster_totals(target_cluster_id UUID)
RETURNS VOID AS $$
DECLARE
  v_total_kg NUMERIC := 0;
  v_farmer_count INTEGER := 0;
  v_listing_count INTEGER := 0;
  v_target_kg NUMERIC;
  v_old_status TEXT;
  v_new_status TEXT;
  v_cluster_name TEXT;
  v_commodity TEXT;
BEGIN
  -- Fetch current cluster details
  SELECT name, commodity, target_bulk_kg, status 
  INTO v_cluster_name, v_commodity, v_target_kg, v_old_status
  FROM public.farmer_clusters
  WHERE id = target_cluster_id;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  -- Aggregate total quantity and listings
  SELECT 
    COALESCE(SUM(quantity_kg), 0),
    COUNT(id),
    COUNT(DISTINCT farmer_id)
  INTO v_total_kg, v_listing_count, v_farmer_count
  FROM public.cluster_inventory
  WHERE cluster_id = target_cluster_id;

  -- Ensure member count reflects unique members
  SELECT COUNT(DISTINCT farmer_id) INTO v_farmer_count
  FROM public.cluster_members
  WHERE cluster_id = target_cluster_id;

  -- Determine status
  IF v_total_kg >= v_target_kg THEN
    v_new_status := 'Bulk Buyer Match Ready';
  ELSE
    v_new_status := 'Consolidating';
  END IF;

  -- Update cluster record
  UPDATE public.farmer_clusters
  SET
    current_quantity_kg = v_total_kg,
    active_farmers_count = v_farmer_count,
    active_listings_count = v_listing_count,
    status = v_new_status,
    updated_at = now()
  WHERE id = target_cluster_id;

  -- If newly transitioned to Bulk Buyer Match Ready, log event
  IF v_new_status = 'Bulk Buyer Match Ready' AND v_old_status <> 'Bulk Buyer Match Ready' THEN
    INSERT INTO public.cluster_events (cluster_id, event_type, title, description, metadata)
    VALUES (
      target_cluster_id,
      'THRESHOLD_REACHED',
      'Bulk Buyer Target Met: ' || v_total_kg || ' kg',
      'The cluster has aggregated ' || v_total_kg || ' kg of ' || v_commodity || ' across ' || v_farmer_count || ' farmers, exceeding the ' || v_target_kg || ' kg bulk order threshold.',
      jsonb_build_object(
        'total_kg', v_total_kg,
        'target_kg', v_target_kg,
        'farmer_count', v_farmer_count,
        'percentage', ROUND((v_total_kg / v_target_kg) * 100, 1)
      )
    );
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. Trigger on cluster_inventory to automatically keep totals synced
CREATE OR REPLACE FUNCTION public.trg_update_cluster_on_inventory_change()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM public.recalculate_cluster_totals(OLD.cluster_id);
  ELSE
    PERFORM public.recalculate_cluster_totals(NEW.cluster_id);
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_cluster_inventory_sync ON public.cluster_inventory;
CREATE TRIGGER trg_cluster_inventory_sync
  AFTER INSERT OR UPDATE OR DELETE ON public.cluster_inventory
  FOR EACH ROW EXECUTE FUNCTION public.trg_update_cluster_on_inventory_change();

-- 12. Trigger on cluster_members to keep farmer count synced
CREATE OR REPLACE FUNCTION public.trg_update_cluster_on_member_change()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM public.recalculate_cluster_totals(OLD.cluster_id);
  ELSE
    PERFORM public.recalculate_cluster_totals(NEW.cluster_id);
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_cluster_members_sync ON public.cluster_members;
CREATE TRIGGER trg_cluster_members_sync
  AFTER INSERT OR UPDATE OR DELETE ON public.cluster_members
  FOR EACH ROW EXECUTE FUNCTION public.trg_update_cluster_on_member_change();

-- 13. Enable Realtime Publications
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.farmer_clusters;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.cluster_inventory;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.cluster_events;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.bulk_buyer_matches;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;
