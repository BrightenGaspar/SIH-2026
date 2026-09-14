-- Migration: 01_auth_trigger_and_rls.sql
-- Description: Comprehensive Supabase SQL script to configure schemas, RLS policies, Realtime publication, and initial seed data.

-- 1. Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  role TEXT DEFAULT 'consumer',
  phone TEXT,
  state TEXT,
  district TEXT,
  fpo_name TEXT,
  place TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Auth Trigger: Auto-populate public.profiles on new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role, phone, state, district, fpo_name, place)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'consumer'),
    COALESCE(NEW.phone, NEW.raw_user_meta_data->>'phone', ''),
    COALESCE(NEW.raw_user_meta_data->>'state', ''),
    COALESCE(NEW.raw_user_meta_data->>'district', ''),
    COALESCE(NEW.raw_user_meta_data->>'fpo_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'place', '')
  )
  ON CONFLICT (id) DO UPDATE
  SET
    full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
    role = COALESCE(EXCLUDED.role, public.profiles.role),
    phone = COALESCE(EXCLUDED.phone, public.profiles.phone);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Ensure logistics_trips has necessary telematics columns
ALTER TABLE public.logistics_trips 
  ADD COLUMN IF NOT EXISTS trip_code TEXT,
  ADD COLUMN IF NOT EXISTS vehicle_type TEXT DEFAULT 'Tata 407 Reefer',
  ADD COLUMN IF NOT EXISTS driver_phone TEXT DEFAULT '+91 98480 99881',
  ADD COLUMN IF NOT EXISTS source_hub TEXT DEFAULT 'Shadnagar Cold Hub',
  ADD COLUMN IF NOT EXISTS destination_hub TEXT DEFAULT 'Hyderabad Central APMC',
  ADD COLUMN IF NOT EXISTS total_distance_km NUMERIC DEFAULT 74,
  ADD COLUMN IF NOT EXISTS distance_completed_km NUMERIC DEFAULT 46,
  ADD COLUMN IF NOT EXISTS commodity TEXT DEFAULT 'Tomato (Hybrid Desi)',
  ADD COLUMN IF NOT EXISTS total_kg NUMERIC DEFAULT 2400,
  ADD COLUMN IF NOT EXISTS current_location TEXT DEFAULT 'Shamshabad Corridor (KM 42)',
  ADD COLUMN IF NOT EXISTS spoilage_risk TEXT DEFAULT 'LOW';

-- 4. Enable Row Level Security (RLS) across tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.produce ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logistics_trips ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies: public.profiles
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone"
  ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE USING (true);

-- 6. RLS Policies: public.produce
DROP POLICY IF EXISTS "Produce catalog is viewable by everyone" ON public.produce;
CREATE POLICY "Produce catalog is viewable by everyone"
  ON public.produce FOR SELECT USING (true);

DROP POLICY IF EXISTS "Farmers can insert produce" ON public.produce;
CREATE POLICY "Farmers can insert produce"
  ON public.produce FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Farmers can update own produce" ON public.produce;
CREATE POLICY "Farmers can update own produce"
  ON public.produce FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Farmers can delete own produce" ON public.produce;
CREATE POLICY "Farmers can delete own produce"
  ON public.produce FOR DELETE USING (true);

-- 7. RLS Policies: public.orders
DROP POLICY IF EXISTS "Orders are viewable by participants" ON public.orders;
CREATE POLICY "Orders are viewable by participants"
  ON public.orders FOR SELECT USING (true);

DROP POLICY IF EXISTS "Consumers can insert orders" ON public.orders;
CREATE POLICY "Consumers can insert orders"
  ON public.orders FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Participants can update order statuses" ON public.orders;
CREATE POLICY "Participants can update order statuses"
  ON public.orders FOR UPDATE USING (true);

-- 8. RLS Policies: public.logistics_trips
DROP POLICY IF EXISTS "Logistics trips are viewable by everyone" ON public.logistics_trips;
CREATE POLICY "Logistics trips are viewable by everyone"
  ON public.logistics_trips FOR SELECT USING (true);

DROP POLICY IF EXISTS "Logistics trips can be inserted" ON public.logistics_trips;
CREATE POLICY "Logistics trips can be inserted"
  ON public.logistics_trips FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Logistics trips can be updated" ON public.logistics_trips;
CREATE POLICY "Logistics trips can be updated"
  ON public.logistics_trips FOR UPDATE USING (true);

-- 9. Storage: produce-images bucket and policies
INSERT INTO storage.buckets (id, name, public)
VALUES ('produce-images', 'produce-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Public access to produce images" ON storage.objects;
CREATE POLICY "Public access to produce images"
  ON storage.objects FOR SELECT USING (bucket_id = 'produce-images');

DROP POLICY IF EXISTS "Allow produce image uploads" ON storage.objects;
CREATE POLICY "Allow produce image uploads"
  ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'produce-images');

DROP POLICY IF EXISTS "Allow produce image updates" ON storage.objects;
CREATE POLICY "Allow produce image updates"
  ON storage.objects FOR UPDATE USING (bucket_id = 'produce-images');

-- 10. Enable Supabase Realtime WebSocket Streaming on key tables
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.produce;
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.logistics_trips;
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;
END $$;

-- 11. Seed Active Cold-Chain Fleet Trips
INSERT INTO public.logistics_trips (
  id, vehicle_number, vehicle_type, driver_name, driver_phone,
  source_hub, destination_hub, total_distance_km, distance_completed_km,
  commodity, total_kg, current_lat, current_lng, current_temp,
  target_temp, humidity, status, spoilage_risk
)
VALUES
  (
    'TRK-CONS-ROAD-9021', 'TS 08 UB 4192', 'Tata 407 Reefer', 'Gurdeep Singh', '+91 98480 99881',
    'Shadnagar Cold Hub', 'Hyderabad Central APMC', 74, 46,
    'Tomato (Hybrid Desi)', 2400, 17.2403, 78.4294, 6.2,
    6.0, 88, 'IN TRANSIT', 'LOW'
  ),
  (
    'TRK-CONS-ROAD-9022', 'TS 07 EA 8831', 'Mahindra Bolero Maxi Truck', 'Suresh Mane', '+91 97661 23456',
    'Kothur Agro Center', 'Bowenpally Wholesale Terminal', 62, 24,
    'Green Chilli (G4 Teja)', 1200, 17.1524, 78.2912, 8.5,
    8.0, 75, 'IN TRANSIT', 'LOW'
  )
ON CONFLICT (id) DO UPDATE SET
  current_temp = EXCLUDED.current_temp,
  target_temp = EXCLUDED.target_temp,
  humidity = EXCLUDED.humidity,
  current_lat = EXCLUDED.current_lat,
  current_lng = EXCLUDED.current_lng;

-- 12. Seed Demo Orders
INSERT INTO public.orders (
  id, commodity, quantity_kg, total_amount, farmer_realization,
  logistics_fee, platform_fee, status, delivery_address, delivery_city
)
VALUES
  (
    'ORD-HYD-5001', 'Tomato (Hybrid Desi)', 2400, 67200, 60480,
    4200, 2520, 'In Transit', 'Bowenpally Market Yard Bay 4', 'Hyderabad'
  ),
  (
    'ORD-HYD-5002', 'Green Chilli (G4 Teja)', 1200, 54000, 48600,
    3400, 2000, 'In Transit', 'Kothur Perishable Distribution Hub', 'Hyderabad'
  )
ON CONFLICT (id) DO UPDATE SET
  status = EXCLUDED.status;
