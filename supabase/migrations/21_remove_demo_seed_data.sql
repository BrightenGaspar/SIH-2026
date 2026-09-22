-- Remove records created by the old demo seed migrations.
-- Keep this migration limited to stable demo identifiers so real farmer data is untouched.

DELETE FROM public.produce_listings
WHERE id IN (
  'a1111111-1111-4111-8111-111111111111',
  'b2222222-2222-4222-8222-222222222222',
  'c3333333-3333-4333-8333-333333333333',
  'd4444444-4444-4444-8444-444444444444'
);

DELETE FROM public.produce
WHERE farmer_id IS NULL
  AND crop_name IN (
    'Onion (Nashik Red)',
    'Tomato (Hybrid Desi)',
    'Green Chilli (G4 Teja)',
    'Potato (Kufri Jyoti)'
  )
  AND location IN (
    'Nashik APMC Hub, Maharashtra',
    'Shadnagar Farm Hub, Telangana',
    'Guntur Mirchi Yard, Andhra Pradesh',
    'Hassan Cold Hub, Karnataka'
  );

DELETE FROM public.logistics_trips
WHERE id IN ('TRK-CONS-ROAD-9021', 'TRK-CONS-ROAD-9022');

DELETE FROM public.orders
WHERE id IN ('ORD-HYD-5001', 'ORD-HYD-5002');