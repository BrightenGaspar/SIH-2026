-- ==============================================================================
-- AgriFlow.ai: Migration 12 - Realtime Produce Table & Policies
-- File: supabase/migrations/12_realtime_produce_table.sql
-- ==============================================================================

-- 1. Create or ensure 'produce' table exists with specified schema
CREATE TABLE IF NOT EXISTS public.produce (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  crop_name TEXT NOT NULL,
  variety TEXT,
  quantity_kg NUMERIC NOT NULL CHECK (quantity_kg >= 0),
  price_per_kg NUMERIC NOT NULL,
  location TEXT,
  harvest_date DATE,
  image_url TEXT,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Schema compatibility: If 'produce' already existed with legacy columns, add new columns and backfill
ALTER TABLE public.produce
  ADD COLUMN IF NOT EXISTS quantity_kg NUMERIC CHECK (quantity_kg >= 0),
  ADD COLUMN IF NOT EXISTS price_per_kg NUMERIC,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Backfill from legacy columns if present
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'produce' AND column_name = 'quantity') THEN
    UPDATE public.produce
    SET quantity_kg = COALESCE(quantity_kg, quantity, 0)
    WHERE quantity_kg IS NULL;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'produce' AND column_name = 'asking_price') THEN
    UPDATE public.produce
    SET price_per_kg = COALESCE(price_per_kg, asking_price, 0)
    WHERE price_per_kg IS NULL;
  END IF;

  UPDATE public.produce
  SET updated_at = COALESCE(updated_at, now())
  WHERE updated_at IS NULL;
END $$;

-- 3. Trigger to bump updated_at on every UPDATE
CREATE OR REPLACE FUNCTION public.handle_produce_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_produce_updated_at ON public.produce;
CREATE TRIGGER trigger_produce_updated_at
  BEFORE UPDATE ON public.produce
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_produce_updated_at();

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.produce ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies
-- SELECT: allow to anon and authenticated (public marketplace)
DROP POLICY IF EXISTS "Produce catalog is viewable by everyone" ON public.produce;
CREATE POLICY "Produce catalog is viewable by everyone"
  ON public.produce FOR SELECT
  USING (true);

-- INSERT: allow demo/public writes from anon users while still preserving ownership checks for authenticated farmers.
DROP POLICY IF EXISTS "Farmers can insert own produce" ON public.produce;
CREATE POLICY "Farmers can insert own produce"
  ON public.produce FOR INSERT
  WITH CHECK (auth.uid() = farmer_id OR auth.uid() IS NULL);

-- UPDATE: permit anon demo mutation and authenticated farmer-owned updates.
DROP POLICY IF EXISTS "Farmers can update own produce" ON public.produce;
CREATE POLICY "Farmers can update own produce"
  ON public.produce FOR UPDATE
  USING (auth.uid() = farmer_id OR auth.uid() IS NULL)
  WITH CHECK (auth.uid() = farmer_id OR auth.uid() IS NULL);

-- DELETE: same public demo behavior with owner safety when signed in.
DROP POLICY IF EXISTS "Farmers can delete own produce" ON public.produce;
CREATE POLICY "Farmers can delete own produce"
  ON public.produce FOR DELETE
  USING (auth.uid() = farmer_id OR auth.uid() IS NULL);

-- 6. Add table to Supabase Realtime publication (CRITICAL: without this line, no events are emitted)
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.produce;
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;
END $$;
