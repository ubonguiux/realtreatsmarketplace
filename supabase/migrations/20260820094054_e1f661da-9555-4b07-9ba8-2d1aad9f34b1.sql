ALTER FUNCTION public.distance_km(double precision, double precision, double precision, double precision) SET search_path = public;
ALTER FUNCTION public.delivery_next_states(public.delivery_status) SET search_path = public;
ALTER FUNCTION public.guard_ledger_immutable() SET search_path = public;

DO $$
DECLARE
  f record;
  anon_ok text[] := ARRAY['nearby_products','nearby_vendors','distance_km','delivery_next_states'];
  auth_ok text[] := ARRAY[
    'accept_delivery','claim_delivery','reject_delivery','cancel_delivery','assign_delivery',
    'admin_update_despatcher_status','approve_settlement','hold_settlement','release_settlement',
    'reject_settlement','initiate_order_payment','request_delivery','register_despatcher','register_vendor',
    'review_despatcher','review_product','review_vendor','update_delivery_status','update_despatcher_location',
    'update_payout_status','set_despatcher_availability','submit_product','subscribe_vendor','checkout',
    'bootstrap_current_user','has_role','is_admin','is_vendor_member','my_despatcher_id','owns_cart',
    'mature_settlements','vendor_product_limit'
  ];
BEGIN
  FOR f IN
    SELECT p.oid::regprocedure AS sig, p.proname
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.prokind = 'f'
  LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon, authenticated', f.sig);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', f.sig);
    IF f.proname = ANY(anon_ok) THEN
      EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO anon, authenticated', f.sig);
    ELSIF f.proname = ANY(auth_ok) THEN
      EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated', f.sig);
    END IF;
  END LOOP;
END $$;