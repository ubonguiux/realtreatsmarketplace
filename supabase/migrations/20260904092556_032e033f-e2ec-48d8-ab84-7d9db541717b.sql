CREATE OR REPLACE FUNCTION public.vendor_serviceability(_vendor_ids uuid[], _lat double precision, _lng double precision)
RETURNS TABLE(vendor_id uuid, vendor_name text, has_location boolean, distance_km double precision, radius_km numeric, accepts_delivery boolean, serviceable boolean)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT v.id,
         v.name,
         (v.latitude IS NOT NULL AND v.longitude IS NOT NULL) AS has_location,
         CASE WHEN v.latitude IS NULL OR v.longitude IS NULL OR _lat IS NULL OR _lng IS NULL
              THEN NULL
              ELSE public.distance_km(_lat, _lng, v.latitude, v.longitude) END AS distance_km,
         COALESCE(vs.delivery_radius_km, ms.default_radius_km, 10) AS radius_km,
         COALESCE(vs.accepts_delivery, true) AS accepts_delivery,
         CASE WHEN v.latitude IS NULL OR v.longitude IS NULL OR _lat IS NULL OR _lng IS NULL THEN false
              WHEN COALESCE(vs.accepts_delivery, true) = false THEN false
              ELSE public.distance_km(_lat, _lng, v.latitude, v.longitude) <= COALESCE(vs.delivery_radius_km, ms.default_radius_km, 10)
         END AS serviceable
  FROM public.vendors v
  LEFT JOIN public.vendor_settings vs ON vs.vendor_id = v.id
  LEFT JOIN public.marketplace_settings ms ON ms.id = true
  WHERE v.id = ANY(_vendor_ids) AND v.status = 'approved';
$$;

REVOKE ALL ON FUNCTION public.vendor_serviceability(uuid[], double precision, double precision) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.vendor_serviceability(uuid[], double precision, double precision) TO anon, authenticated, service_role;