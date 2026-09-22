-- Keep the auth-created profile complete when email confirmation delays the session.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO public.profiles (
    id, full_name, role, phone, email, state, district, fpo_name,
    place, area, username
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'consumer'),
    COALESCE(NEW.phone, NEW.raw_user_meta_data->>'phone', ''),
    COALESCE(NEW.email, NEW.raw_user_meta_data->>'email', ''),
    NULLIF(NEW.raw_user_meta_data->>'state', ''),
    NULLIF(NEW.raw_user_meta_data->>'district', ''),
    NULLIF(NEW.raw_user_meta_data->>'fpo_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'place', ''),
    COALESCE(NEW.raw_user_meta_data->>'area', ''),
    NULLIF(trim(COALESCE(NEW.raw_user_meta_data->>'username', '')), '')
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
    role = COALESCE(EXCLUDED.role, public.profiles.role),
    phone = COALESCE(EXCLUDED.phone, public.profiles.phone),
    email = COALESCE(EXCLUDED.email, public.profiles.email),
    state = COALESCE(EXCLUDED.state, public.profiles.state),
    district = COALESCE(EXCLUDED.district, public.profiles.district),
    fpo_name = COALESCE(EXCLUDED.fpo_name, public.profiles.fpo_name),
    place = COALESCE(EXCLUDED.place, public.profiles.place),
    area = COALESCE(EXCLUDED.area, public.profiles.area);
  RETURN NEW;
END;
$$;

NOTIFY pgrst, 'reload schema';