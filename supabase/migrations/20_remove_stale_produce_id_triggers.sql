-- Remove legacy triggers compiled against the old produce_id schema.
-- Current checkout records use orders.listing_id instead.
DO $$
DECLARE
  trigger_row RECORD;
BEGIN
  FOR trigger_row IN
    SELECT
      ns.nspname AS schema_name,
      cls.relname AS table_name,
      trg.tgname AS trigger_name
    FROM pg_trigger trg
    JOIN pg_class cls ON cls.oid = trg.tgrelid
    JOIN pg_namespace ns ON ns.oid = cls.relnamespace
    WHERE NOT trg.tgisinternal
      AND ns.nspname = 'public'
      AND pg_get_functiondef(trg.tgfoid) ~* '(new|old)\.produce_id'
  LOOP
    EXECUTE format(
      'DROP TRIGGER IF EXISTS %I ON %I.%I',
      trigger_row.trigger_name,
      trigger_row.schema_name,
      trigger_row.table_name
    );
  END LOOP;
END $$;

NOTIFY pgrst, 'reload schema';