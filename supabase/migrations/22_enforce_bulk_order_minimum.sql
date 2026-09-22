-- Enforce the marketplace bulk-buy minimum at the database boundary.
-- This prevents direct RPC/API calls from creating orders below 50 kg.

CREATE OR REPLACE FUNCTION public.enforce_bulk_order_minimum()
RETURNS TRIGGER AS $$
DECLARE
  order_quantity NUMERIC;
BEGIN
  order_quantity := COALESCE(NEW.quantity, NEW.quantity_kg, 0);

  IF NEW.listing_id IS NOT NULL AND order_quantity < 50 THEN
    RAISE EXCEPTION 'Bulk orders require a minimum quantity of 50 kg.'
      USING ERRCODE = '22023';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS enforce_bulk_order_minimum_trigger ON public.orders;
CREATE TRIGGER enforce_bulk_order_minimum_trigger
  BEFORE INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_bulk_order_minimum();