CREATE OR REPLACE FUNCTION public.guard_vendor_order_dispatch_lock()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _locked boolean;
BEGIN
  IF NEW.status IS NOT DISTINCT FROM OLD.status THEN
    RETURN NEW;
  END IF;

  -- system / definer contexts (auth.uid() null) and admins are unrestricted
  IF auth.uid() IS NULL OR public.is_admin() THEN
    RETURN NEW;
  END IF;

  -- only restrict vendor members
  IF NOT public.is_vendor_member(NEW.vendor_id) THEN
    RETURN NEW;
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.deliveries d
    WHERE d.vendor_order_id = NEW.id
      AND d.status NOT IN ('cancelled', 'failed')
  ) INTO _locked;

  IF _locked THEN
    RAISE EXCEPTION 'This order has been handed over to Dispatch and can no longer be changed by the vendor.';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS t_vo_dispatch_lock ON public.vendor_orders;
CREATE TRIGGER t_vo_dispatch_lock
BEFORE UPDATE ON public.vendor_orders
FOR EACH ROW EXECUTE FUNCTION public.guard_vendor_order_dispatch_lock();

REVOKE EXECUTE ON FUNCTION public.guard_vendor_order_dispatch_lock() FROM PUBLIC;