-- Keep the farmer -> consumer -> logistics workflow fully realtime.

-- New listings are relevant to every consumer account. The marketplace itself
-- remains the source of truth for visibility and stock.
CREATE OR REPLACE FUNCTION public.trg_listing_created()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_farmer_name TEXT;
BEGIN
  SELECT full_name INTO v_farmer_name
  FROM public.profiles
  WHERE id = NEW.farmer_id;

  INSERT INTO public.notifications (user_id, type, title, body, data)
  SELECT
    c.id,
    'new_listing',
    'Fresh produce available',
    format('%s: %s %s of %s at %s/%s',
           COALESCE(v_farmer_name, 'Verified Farmer'),
           NEW.available_quantity,
           NEW.unit,
           NEW.produce_name,
           NEW.price_per_unit,
           NEW.unit),
    jsonb_build_object(
      'listing_id', NEW.id,
      'crop_name', NEW.produce_name,
      'farmer_name', COALESCE(v_farmer_name, 'Verified Farmer'),
      'quantity', NEW.available_quantity,
      'unit', NEW.unit,
      'price', NEW.price_per_unit
    )
  FROM public.profiles c
  WHERE c.role IN ('consumer', 'buyer')
    AND c.id <> NEW.farmer_id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_listing_created ON public.produce_listings;
CREATE TRIGGER trigger_listing_created
  AFTER INSERT ON public.produce_listings
  FOR EACH ROW EXECUTE FUNCTION public.trg_listing_created();

-- Ensure the tables used by the workflow continue to stream to all clients.
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
      AND tablename = 'notifications'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications';
  END IF;
END $$;

NOTIFY pgrst, 'reload schema';