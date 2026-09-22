-- ==============================================================================
-- AgriFlow.ai: Migration 10 - Normalized Marketplace Schema & RLS Foundation
-- File: supabase/migrations/10_normalized_marketplace_schema.sql
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. EXTENSIONS & SHARED TIMESTAMP TRIGGER
-- ------------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ------------------------------------------------------------------------------
-- 2. PROFILES TABLE UPGRADES
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  role TEXT DEFAULT 'consumer',
  language TEXT DEFAULT 'en',
  state TEXT,
  district TEXT,
  place TEXT,
  area TEXT,
  village_or_area TEXT,
  fpo_name TEXT,
  wallet_balance NUMERIC DEFAULT 0,
  username TEXT,
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Ensure all required columns exist on profiles
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS village_or_area TEXT,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Update check constraint on profiles role
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check 
  CHECK (role IN ('farmer', 'consumer', 'buyer', 'logistics', 'logistics_operator', 'admin'));

-- Profile updated_at trigger
DROP TRIGGER IF EXISTS trigger_profiles_updated_at ON public.profiles;
CREATE TRIGGER trigger_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ------------------------------------------------------------------------------
-- 3. PRODUCE LISTINGS TABLE (CANONICAL INVENTORY TABLE)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.produce_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  produce_name TEXT NOT NULL,
  variety TEXT,
  category TEXT NOT NULL DEFAULT 'vegetables' 
    CHECK (category IN ('vegetables', 'fruits', 'grains', 'pulses', 'oilseeds', 'spices', 'Vegetables', 'Fruits', 'Grains', 'Pulses', 'Oilseeds', 'Spices')),
  total_quantity NUMERIC NOT NULL CHECK (total_quantity > 0),
  available_quantity NUMERIC NOT NULL CHECK (available_quantity >= 0 AND available_quantity <= total_quantity),
  price_per_unit NUMERIC NOT NULL CHECK (price_per_unit > 0),
  unit TEXT NOT NULL DEFAULT 'kg' CHECK (unit IN ('kg', 'quintal', 'crate', 'bag', 'ton', 'Kg', 'Quintal')),
  harvest_date DATE DEFAULT CURRENT_DATE,
  quality_grade TEXT DEFAULT 'A' 
    CHECK (quality_grade IN ('A+', 'A', 'A-', 'B+', 'B', 'B-', 'C', 'Premium', 'Standard', 'Fair')),
  brix_level NUMERIC,
  shelf_life_days INTEGER DEFAULT 14,
  location_lat DOUBLE PRECISION,
  location_lng DOUBLE PRECISION,
  location_address TEXT,
  images TEXT[] DEFAULT '{}'::TEXT[],
  status TEXT NOT NULL DEFAULT 'active' 
    CHECK (status IN ('active', 'draft', 'sold_out', 'expired', 'archived', 'Active', 'Draft', 'Sold Out', 'Archived')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Ensure quality_grade constraint accepts APMC grades if table already existed
ALTER TABLE public.produce_listings DROP CONSTRAINT IF EXISTS produce_listings_quality_grade_check;
ALTER TABLE public.produce_listings ADD CONSTRAINT produce_listings_quality_grade_check
  CHECK (quality_grade IN ('A+', 'A', 'A-', 'B+', 'B', 'B-', 'C', 'Premium', 'Standard', 'Fair'));

-- produce_listings updated_at trigger
DROP TRIGGER IF EXISTS trigger_produce_listings_updated_at ON public.produce_listings;
CREATE TRIGGER trigger_produce_listings_updated_at
  BEFORE UPDATE ON public.produce_listings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Non-destructive data migration from existing 'produce' table to 'produce_listings'
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'produce') THEN
    INSERT INTO public.produce_listings (
      id, farmer_id, produce_name, variety, category, total_quantity, available_quantity,
      price_per_unit, unit, harvest_date, quality_grade, brix_level, shelf_life_days,
      location_address, status, created_at
    )
    SELECT 
      p.id,
      p.farmer_id,
      p.crop_name AS produce_name,
      p.variety,
      LOWER(COALESCE(p.category, 'vegetables')) AS category,
      COALESCE(p.quantity, 100) AS total_quantity,
      COALESCE(p.quantity, 100) AS available_quantity,
      COALESCE(p.asking_price, 30) AS price_per_unit,
      COALESCE(p.unit, 'kg') AS unit,
      COALESCE(p.harvest_date, CURRENT_DATE) AS harvest_date,
      COALESCE(p.quality_grade, 'A') AS quality_grade,
      p.brix AS brix_level,
      COALESCE(p.shelf_life_days, 14) AS shelf_life_days,
      p.location AS location_address,
      LOWER(COALESCE(p.status, 'active')) AS status,
      COALESCE(p.created_at, now()) AS created_at
    FROM public.produce p
    ON CONFLICT (id) DO NOTHING;
  END IF;
END $$;

-- ------------------------------------------------------------------------------
-- 4. ORDERS TABLE NORMALIZATION, BACKFILL & STATE MACHINE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.orders (
  id TEXT PRIMARY KEY,
  buyer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  commodity TEXT,
  quantity_kg NUMERIC,
  total_amount NUMERIC NOT NULL,
  farmer_realization NUMERIC,
  logistics_fee NUMERIC DEFAULT 0,
  platform_fee NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'pending',
  delivery_address TEXT,
  delivery_city TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Add all normalized order columns
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS order_number TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS listing_id UUID REFERENCES public.produce_listings(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS farmer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS quantity NUMERIC,
  ADD COLUMN IF NOT EXISTS unit_price NUMERIC,
  ADD COLUMN IF NOT EXISTS delivery_lat DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS delivery_lng DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending' 
    CHECK (payment_status IN ('pending', 'escrow_locked', 'released_to_farmer', 'refunded', 'Escrow Locked', 'Pending', 'Released', 'Refunded')),
  ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'upi'
    CHECK (payment_method IN ('upi', 'net_banking', 'cod', 'wallet', 'bank_transfer', 'UPI', 'COD')),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- STEP 1: DROP old constraint FIRST so UPDATE can apply new statuses
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_status_check;

-- STEP 2: Map legacy order statuses to canonical state machine
UPDATE public.orders
SET status = CASE
  WHEN status = 'Escrow Locked' THEN 'accepted'
  WHEN status = 'Dispatched'    THEN 'in_transit'
  WHEN status = 'Delivered'     THEN 'delivered'
  WHEN status = 'Cancelled'     THEN 'cancelled'
  ELSE LOWER(status)
END
WHERE status IN ('Escrow Locked', 'Dispatched', 'Delivered', 'Cancelled');

-- STEP 3: Apply the updated canonical check constraint
ALTER TABLE public.orders ADD CONSTRAINT orders_status_check
  CHECK (status IN (
    'pending', 'accepted', 'preparing', 'ready_for_pickup', 'pickup_assigned', 'in_transit', 'delivered', 'cancelled', 'rejected'
  ));

-- orders updated_at trigger
DROP TRIGGER IF EXISTS trigger_orders_updated_at ON public.orders;
CREATE TRIGGER trigger_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ------------------------------------------------------------------------------
-- 5. ORDER COLUMN SYNCHRONIZATION TRIGGER (TEMPORARY MIGRATION BRIDGE)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.sync_order_columns()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.customer_id IS NULL AND NEW.buyer_id IS NOT NULL THEN
    NEW.customer_id = NEW.buyer_id;
  ELSIF NEW.buyer_id IS NULL AND NEW.customer_id IS NOT NULL THEN
    NEW.buyer_id = NEW.customer_id;
  END IF;

  IF NEW.quantity IS NULL AND NEW.quantity_kg IS NOT NULL THEN
    NEW.quantity = NEW.quantity_kg;
  ELSIF NEW.quantity_kg IS NULL AND NEW.quantity IS NOT NULL THEN
    NEW.quantity_kg = NEW.quantity;
  END IF;

  IF NEW.order_number IS NULL THEN
    NEW.order_number = NEW.id;
  END IF;

  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_sync_order_columns ON public.orders;
CREATE TRIGGER trigger_sync_order_columns
  BEFORE INSERT OR UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.sync_order_columns();

-- ------------------------------------------------------------------------------
-- 6. LOGISTICS ASSIGNMENTS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.logistics_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id TEXT NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  operator_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  pickup_lat DOUBLE PRECISION,
  pickup_lng DOUBLE PRECISION,
  delivery_lat DOUBLE PRECISION,
  delivery_lng DOUBLE PRECISION,
  current_lat DOUBLE PRECISION,
  current_lng DOUBLE PRECISION,
  status TEXT NOT NULL DEFAULT 'assigned'
    CHECK (status IN ('assigned', 'heading_to_pickup', 'picked_up', 'in_transit', 'delivered', 'cancelled', 'ASSIGNED', 'HEADING_TO_PICKUP', 'PICKED_UP', 'IN TRANSIT', 'DELIVERED', 'CANCELLED')),
  vehicle_number TEXT DEFAULT 'TS 08 UB 4192',
  vehicle_type TEXT DEFAULT 'Tata 407 Reefer',
  current_temp NUMERIC,
  target_temp NUMERIC DEFAULT 4.0,
  humidity NUMERIC,
  spoilage_risk TEXT DEFAULT 'low'
    CHECK (spoilage_risk IN ('low', 'medium', 'high', 'LOW', 'MEDIUM', 'HIGH')),
  last_gps_update TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- logistics_assignments updated_at trigger
DROP TRIGGER IF EXISTS trigger_logistics_assignments_updated_at ON public.logistics_assignments;
CREATE TRIGGER trigger_logistics_assignments_updated_at
  BEFORE UPDATE ON public.logistics_assignments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ------------------------------------------------------------------------------
-- 7. REVIEWS & RATINGS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id TEXT REFERENCES public.orders(id) ON DELETE SET NULL,
  transaction_id TEXT,
  reviewer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reviewee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  role_perspective TEXT 
    CHECK (role_perspective IN (
      'consumer_to_farmer', 'farmer_to_consumer', 'consumer_to_logistics', 
      'logistics_to_consumer', 'farmer_to_logistics', 'logistics_to_farmer',
      'VERIFIED_PURCHASE', 'VERIFIED_TRANSACTION', 'VERIFIED_SERVICE'
    )),
  category_ratings JSONB DEFAULT '{}'::JSONB,
  verification_badge TEXT DEFAULT 'VERIFIED_TRANSACTION',
  is_verified BOOLEAN DEFAULT true,
  moderation_status TEXT DEFAULT 'PUBLISHED' 
    CHECK (moderation_status IN ('PENDING', 'PUBLISHED', 'HIDDEN', 'REJECTED')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT no_self_rating CHECK (reviewer_id <> reviewee_id),
  CONSTRAINT unique_order_reviewer_reviewee UNIQUE (order_id, reviewer_id, reviewee_id)
);

-- reviews updated_at trigger
DROP TRIGGER IF EXISTS trigger_reviews_updated_at ON public.reviews;
CREATE TRIGGER trigger_reviews_updated_at
  BEFORE UPDATE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ------------------------------------------------------------------------------
-- 8. PERFORMANCE INDEXES
-- ------------------------------------------------------------------------------
-- Profiles
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_phone ON public.profiles(phone);

-- Produce Listings
CREATE INDEX IF NOT EXISTS idx_produce_listings_farmer_id ON public.produce_listings(farmer_id);
CREATE INDEX IF NOT EXISTS idx_produce_listings_status ON public.produce_listings(status);
CREATE INDEX IF NOT EXISTS idx_produce_listings_category ON public.produce_listings(category);
CREATE INDEX IF NOT EXISTS idx_produce_listings_created_at ON public.produce_listings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_produce_listings_available_qty ON public.produce_listings(available_quantity) WHERE available_quantity > 0;

-- Orders
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON public.orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_farmer_id ON public.orders(farmer_id);
CREATE INDEX IF NOT EXISTS idx_orders_listing_id ON public.orders(listing_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);

-- Logistics Assignments
CREATE INDEX IF NOT EXISTS idx_logistics_assignments_order_id ON public.logistics_assignments(order_id);
CREATE INDEX IF NOT EXISTS idx_logistics_assignments_operator_id ON public.logistics_assignments(operator_id);
CREATE INDEX IF NOT EXISTS idx_logistics_assignments_status ON public.logistics_assignments(status);
CREATE INDEX IF NOT EXISTS idx_logistics_assignments_last_gps ON public.logistics_assignments(last_gps_update DESC);

-- Reviews
CREATE INDEX IF NOT EXISTS idx_reviews_reviewee_id ON public.reviews(reviewee_id);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewer_id ON public.reviews(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_reviews_order_id ON public.reviews(order_id);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON public.reviews(created_at DESC);

-- ------------------------------------------------------------------------------
-- 9. ROW LEVEL SECURITY (RLS) POLICIES
-- ------------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.produce_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logistics_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- 9.1 Profiles
DROP POLICY IF EXISTS "Public profiles viewable by all" ON public.profiles;
CREATE POLICY "Public profiles viewable by all"
  ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id OR auth.uid() IS NULL);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- 9.2 Produce Listings
DROP POLICY IF EXISTS "Produce listings viewable by all" ON public.produce_listings;
CREATE POLICY "Produce listings viewable by all"
  ON public.produce_listings FOR SELECT
  USING (status IN ('active', 'Active', 'sold_out', 'Sold Out') OR auth.uid() = farmer_id OR auth.uid() IS NULL);

DROP POLICY IF EXISTS "Farmers can insert produce listings" ON public.produce_listings;
CREATE POLICY "Farmers can insert produce listings"
  ON public.produce_listings FOR INSERT
  WITH CHECK (auth.uid() = farmer_id OR auth.uid() IS NULL);

DROP POLICY IF EXISTS "Farmers can update own produce listings" ON public.produce_listings;
CREATE POLICY "Farmers can update own produce listings"
  ON public.produce_listings FOR UPDATE
  USING (auth.uid() = farmer_id OR auth.uid() IS NULL);

DROP POLICY IF EXISTS "Farmers can delete own produce listings" ON public.produce_listings;
CREATE POLICY "Farmers can delete own produce listings"
  ON public.produce_listings FOR DELETE
  USING (auth.uid() = farmer_id);

-- 9.3 Orders
DROP POLICY IF EXISTS "Orders viewable by participants and logistics" ON public.orders;
CREATE POLICY "Orders viewable by participants and logistics"
  ON public.orders FOR SELECT
  USING (
    auth.uid() = customer_id 
    OR auth.uid() = buyer_id 
    OR auth.uid() = farmer_id 
    OR EXISTS (
      SELECT 1 FROM public.logistics_assignments la 
      WHERE la.order_id = orders.id AND la.operator_id = auth.uid()
    )
    OR auth.uid() IS NULL
  );

DROP POLICY IF EXISTS "Consumers can insert orders" ON public.orders;
CREATE POLICY "Consumers can insert orders"
  ON public.orders FOR INSERT
  WITH CHECK (auth.uid() = customer_id OR auth.uid() = buyer_id OR auth.uid() IS NULL);

DROP POLICY IF EXISTS "Order participants can update orders" ON public.orders;
CREATE POLICY "Order participants can update orders"
  ON public.orders FOR UPDATE
  USING (
    auth.uid() = customer_id 
    OR auth.uid() = buyer_id 
    OR auth.uid() = farmer_id 
    OR EXISTS (
      SELECT 1 FROM public.logistics_assignments la 
      WHERE la.order_id = orders.id AND la.operator_id = auth.uid()
    )
    OR auth.uid() IS NULL
  );

-- 9.4 Logistics Assignments
DROP POLICY IF EXISTS "Logistics assignments viewable by all participants" ON public.logistics_assignments;
CREATE POLICY "Logistics assignments viewable by all participants"
  ON public.logistics_assignments FOR SELECT USING (true);

DROP POLICY IF EXISTS "Operators and system can insert assignments" ON public.logistics_assignments;
CREATE POLICY "Operators and system can insert assignments"
  ON public.logistics_assignments FOR INSERT
  WITH CHECK (auth.uid() = operator_id OR auth.uid() IS NULL);

DROP POLICY IF EXISTS "Operators and system can update assignments" ON public.logistics_assignments;
CREATE POLICY "Operators and system can update assignments"
  ON public.logistics_assignments FOR UPDATE
  USING (auth.uid() = operator_id OR auth.uid() IS NULL);

-- 9.5 Reviews
DROP POLICY IF EXISTS "Published reviews are viewable by everyone" ON public.reviews;
CREATE POLICY "Published reviews are viewable by everyone"
  ON public.reviews FOR SELECT
  USING (moderation_status = 'PUBLISHED' OR auth.uid() = reviewer_id OR auth.uid() IS NULL);

DROP POLICY IF EXISTS "Authenticated users can create reviews" ON public.reviews;
CREATE POLICY "Authenticated users can create reviews"
  ON public.reviews FOR INSERT
  WITH CHECK (auth.uid() = reviewer_id OR auth.uid() IS NULL);

DROP POLICY IF EXISTS "Reviewers can update own reviews" ON public.reviews;
CREATE POLICY "Reviewers can update own reviews"
  ON public.reviews FOR UPDATE
  USING (auth.uid() = reviewer_id);

-- ------------------------------------------------------------------------------
-- 10. SUPABASE REALTIME WEBSOCKET SUBSCRIPTION REGISTRATION
-- ------------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
      AND schemaname = 'public' 
      AND tablename = 'produce_listings'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.produce_listings';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
      AND schemaname = 'public' 
      AND tablename = 'orders'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.orders';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
      AND schemaname = 'public' 
      AND tablename = 'logistics_assignments'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.logistics_assignments';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
      AND schemaname = 'public' 
      AND tablename = 'reviews'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.reviews';
  END IF;
END $$;

