-- ============ helpers ============
CREATE OR REPLACE FUNCTION public.distance_km(lat1 double precision, lng1 double precision, lat2 double precision, lng2 double precision)
RETURNS double precision LANGUAGE sql IMMUTABLE PARALLEL SAFE AS $$
  SELECT CASE WHEN lat1 IS NULL OR lng1 IS NULL OR lat2 IS NULL OR lng2 IS NULL THEN NULL
  ELSE 2 * 6371 * asin(sqrt(
    power(sin(radians(lat2-lat1)/2),2) +
    cos(radians(lat1))*cos(radians(lat2))*power(sin(radians(lng2-lng1)/2),2)))
  END
$$;

-- ============ despatchers ============
CREATE TABLE IF NOT EXISTS public.despatchers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  full_name text NOT NULL,
  phone text,
  email text,
  vehicle_type text NOT NULL DEFAULT 'motorcycle',
  vehicle_plate text,
  id_document_url text,
  business_name text,
  address text,
  city text,
  state text,
  country text NOT NULL DEFAULT 'Nigeria',
  latitude double precision,
  longitude double precision,
  service_radius_km numeric NOT NULL DEFAULT 15,
  status public.despatcher_status NOT NULL DEFAULT 'pending',
  rejection_reason text,
  availability public.despatcher_availability NOT NULL DEFAULT 'offline',
  current_latitude double precision,
  current_longitude double precision,
  location_updated_at timestamptz,
  active_deliveries integer NOT NULL DEFAULT 0,
  completed_deliveries integer NOT NULL DEFAULT 0,
  rating numeric,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.despatchers TO authenticated;
GRANT ALL ON public.despatchers TO service_role;
ALTER TABLE public.despatchers ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_despatchers_status ON public.despatchers(status, availability);
CREATE INDEX IF NOT EXISTS idx_despatchers_geo ON public.despatchers(latitude, longitude);

DROP POLICY IF EXISTS "despatchers own row" ON public.despatchers;
CREATE POLICY "despatchers own row" ON public.despatchers FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_admin());
DROP POLICY IF EXISTS "despatchers self insert" ON public.despatchers;
CREATE POLICY "despatchers self insert" ON public.despatchers FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "despatchers self update" ON public.despatchers;
CREATE POLICY "despatchers self update" ON public.despatchers FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR public.is_admin())
  WITH CHECK (user_id = auth.uid() OR public.is_admin());

DROP TRIGGER IF EXISTS t_despatchers_u ON public.despatchers;
CREATE TRIGGER t_despatchers_u BEFORE UPDATE ON public.despatchers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.my_despatcher_id()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT id FROM public.despatchers WHERE user_id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION public.guard_despatcher_update()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_admin() THEN
    IF NEW.status IS DISTINCT FROM OLD.status THEN
      RAISE EXCEPTION 'Only administrators can change despatcher status';
    END IF;
    IF OLD.status <> 'approved' AND NEW.availability IS DISTINCT FROM OLD.availability THEN
      RAISE EXCEPTION 'Your despatcher account is not approved yet';
    END IF;
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS t_despatcher_guard ON public.despatchers;
CREATE TRIGGER t_despatcher_guard BEFORE UPDATE ON public.despatchers
  FOR EACH ROW EXECUTE FUNCTION public.guard_despatcher_update();

-- ============ deliveries extensions ============
ALTER TABLE public.deliveries
  ADD COLUMN IF NOT EXISTS despatcher_id uuid REFERENCES public.despatchers(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS assigned_at timestamptz,
  ADD COLUMN IF NOT EXISTS accepted_at timestamptz,
  ADD COLUMN IF NOT EXISTS failure_reason text,
  ADD COLUMN IF NOT EXISTS despatcher_latitude double precision,
  ADD COLUMN IF NOT EXISTS despatcher_longitude double precision,
  ADD COLUMN IF NOT EXISTS despatcher_location_at timestamptz,
  ADD COLUMN IF NOT EXISTS distance_km numeric,
  ADD COLUMN IF NOT EXISTS delivery_instructions text;

CREATE INDEX IF NOT EXISTS idx_deliveries_despatcher ON public.deliveries(despatcher_id, status);
CREATE INDEX IF NOT EXISTS idx_deliveries_status ON public.deliveries(status);

DROP POLICY IF EXISTS "despatcher reads relevant deliveries" ON public.deliveries;
CREATE POLICY "despatcher reads relevant deliveries" ON public.deliveries FOR SELECT TO authenticated
  USING (
    despatcher_id = public.my_despatcher_id()
    OR (status = 'awaiting_assignment' AND despatcher_id IS NULL AND public.my_despatcher_id() IS NOT NULL)
  );

DROP POLICY IF EXISTS "despatcher reads own delivery events" ON public.delivery_events;
CREATE POLICY "despatcher reads own delivery events" ON public.delivery_events FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.deliveries d WHERE d.id = delivery_id AND d.despatcher_id = public.my_despatcher_id()));

-- ============ marketplace delivery settings ============
ALTER TABLE public.marketplace_settings
  ADD COLUMN IF NOT EXISTS default_radius_km numeric NOT NULL DEFAULT 10,
  ADD COLUMN IF NOT EXISTS max_radius_km numeric NOT NULL DEFAULT 50,
  ADD COLUMN IF NOT EXISTS delivery_fee_model text NOT NULL DEFAULT 'vendor',
  ADD COLUMN IF NOT EXISTS delivery_base_fee numeric NOT NULL DEFAULT 500,
  ADD COLUMN IF NOT EXISTS delivery_fee_per_km numeric NOT NULL DEFAULT 100,
  ADD COLUMN IF NOT EXISTS auto_assign_deliveries boolean NOT NULL DEFAULT true;

ALTER TABLE public.vendor_settings
  ADD COLUMN IF NOT EXISTS delivery_radius_km numeric NOT NULL DEFAULT 15;

-- ============ geo discovery ============
CREATE INDEX IF NOT EXISTS idx_vendors_geo ON public.vendors(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_products_vendor_status ON public.products(status, vendor_id);

CREATE OR REPLACE FUNCTION public.nearby_vendors(_lat double precision, _lng double precision, _radius numeric DEFAULT 10, _q text DEFAULT NULL, _limit integer DEFAULT 48)
RETURNS TABLE (
  id uuid, name text, slug text, city text, state text, business_category text,
  logo_url text, storefront_image_url text, is_featured boolean, latitude double precision,
  longitude double precision, description text, rating numeric, distance_km double precision
) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT v.id, v.name, v.slug, v.city, v.state, v.business_category, v.logo_url, v.storefront_image_url,
         v.is_featured, v.latitude, v.longitude, v.description, v.rating,
         round(public.distance_km(_lat,_lng,v.latitude,v.longitude)::numeric, 1)::double precision
  FROM public.vendors v
  WHERE v.status = 'approved'
    AND v.latitude IS NOT NULL AND v.longitude IS NOT NULL
    AND public.distance_km(_lat,_lng,v.latitude,v.longitude) <= _radius
    AND (_q IS NULL OR _q = '' OR v.name ILIKE '%'||_q||'%' OR coalesce(v.business_category,'') ILIKE '%'||_q||'%')
  ORDER BY public.distance_km(_lat,_lng,v.latitude,v.longitude)
  LIMIT coalesce(_limit,48)
$$;

CREATE OR REPLACE FUNCTION public.nearby_products(
  _lat double precision, _lng double precision, _radius numeric DEFAULT 10,
  _q text DEFAULT NULL, _category uuid DEFAULT NULL, _limit integer DEFAULT 48, _offset integer DEFAULT 0,
  _sort text DEFAULT 'distance'
)
RETURNS TABLE (
  id uuid, name text, price numeric, discount_price numeric, currency text, image_url text,
  stock_quantity integer, city text, state text, vendor_id uuid, category_id uuid, is_featured boolean,
  created_at timestamptz, vendor_name text, vendor_slug text, vendor_city text, vendor_state text,
  latitude double precision, longitude double precision, distance_km double precision
) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT p.id, p.name, p.price, p.discount_price, p.currency, p.image_url, p.stock_quantity,
         p.city, p.state, p.vendor_id, p.category_id, p.is_featured, p.created_at,
         v.name, v.slug, v.city, v.state,
         coalesce(p.latitude, v.latitude), coalesce(p.longitude, v.longitude),
         round(public.distance_km(_lat,_lng,coalesce(p.latitude,v.latitude),coalesce(p.longitude,v.longitude))::numeric,1)::double precision
  FROM public.products p
  JOIN public.vendors v ON v.id = p.vendor_id AND v.status = 'approved'
  WHERE p.status IN ('approved','out_of_stock')
    AND coalesce(p.latitude, v.latitude) IS NOT NULL
    AND public.distance_km(_lat,_lng,coalesce(p.latitude,v.latitude),coalesce(p.longitude,v.longitude)) <= _radius
    AND (_category IS NULL OR p.category_id = _category)
    AND (_q IS NULL OR _q = '' OR p.name ILIKE '%'||_q||'%' OR coalesce(p.description,'') ILIKE '%'||_q||'%')
  ORDER BY
    CASE WHEN _sort = 'price_asc' THEN coalesce(nullif(p.discount_price,0), p.price) END ASC,
    CASE WHEN _sort = 'price_desc' THEN coalesce(nullif(p.discount_price,0), p.price) END DESC,
    CASE WHEN _sort = 'newest' THEN p.created_at END DESC,
    public.distance_km(_lat,_lng,coalesce(p.latitude,v.latitude),coalesce(p.longitude,v.longitude)) ASC
  LIMIT coalesce(_limit,48) OFFSET coalesce(_offset,0)
$$;

GRANT EXECUTE ON FUNCTION public.nearby_vendors(double precision,double precision,numeric,text,integer) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.nearby_products(double precision,double precision,numeric,text,uuid,integer,integer,text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.distance_km(double precision,double precision,double precision,double precision) TO anon, authenticated;