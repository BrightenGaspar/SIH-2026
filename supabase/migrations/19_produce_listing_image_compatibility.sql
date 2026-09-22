-- Keep the legacy single-image API field compatible with the canonical listing table.
ALTER TABLE public.produce_listings
  ADD COLUMN IF NOT EXISTS image_url TEXT;

UPDATE public.produce_listings
SET image_url = images[1]
WHERE image_url IS NULL
  AND images IS NOT NULL
  AND cardinality(images) > 0;

NOTIFY pgrst, 'reload schema';