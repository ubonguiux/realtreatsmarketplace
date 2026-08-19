
-- ============ ENUMS ============
DO $$ BEGIN CREATE TYPE public.payment_status AS ENUM ('initiated','pending','successful','failed','abandoned','partially_refunded','fully_refunded','reversed'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.settlement_status AS ENUM ('pending','window','ready_for_approval','approved','processing','paid','held','rejected','failed'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.payout_status AS ENUM ('pending','processing','successful','failed','retry_required','cancelled'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.subscription_status AS ENUM ('pending','active','expired','cancelled','suspended'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.payout_party AS ENUM ('vendor','despatcher','platform'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============ FINANCE SETTINGS (on marketplace_settings) ============
ALTER TABLE public.marketplace_settings
  ADD COLUMN IF NOT EXISTS commission_percent numeric NOT NULL DEFAULT 10,
  ADD COLUMN IF NOT EXISTS despatcher_share_percent numeric NOT NULL DEFAULT 80,
  ADD COLUMN IF NOT EXISTS gateway_percent numeric NOT NULL DEFAULT 1.5,
  ADD COLUMN IF NOT EXISTS gateway_flat numeric NOT NULL DEFAULT 100,
  ADD COLUMN IF NOT EXISTS gateway_fee_cap numeric NOT NULL DEFAULT 2000,
  ADD COLUMN IF NOT EXISTS gateway_fee_bearer text NOT NULL DEFAULT 'platform',
  ADD COLUMN IF NOT EXISTS settlement_window_minutes integer NOT NULL DEFAULT 60,
  ADD COLUMN IF NOT EXISTS default_gateway text NOT NULL DEFAULT 'monnify',
  ADD COLUMN IF NOT EXISTS require_vendor_subscription boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS corporate_website_url text,
  ADD COLUMN IF NOT EXISTS contact_address text DEFAULT '6 Oron Road, Uyo, Akwa Ibom State, Nigeria.',
  ADD COLUMN IF NOT EXISTS whatsapp_numbers text DEFAULT '08161816527 / 08069929435';

-- ============ SUBSCRIPTION PACKAGES ============
CREATE TABLE IF NOT EXISTS public.subscription_packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  price numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'NGN',
  product_limit integer NOT NULL DEFAULT 20,
  duration_days integer NOT NULL DEFAULT 30,
  features jsonb NOT NULL DEFAULT '[]'::jsonb,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.subscription_packages TO anon, authenticated;
GRANT ALL ON public.subscription_packages TO service_role;
ALTER TABLE public.subscription_packages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS sp_read ON public.subscription_packages;
CREATE POLICY sp_read ON public.subscription_packages FOR SELECT USING (is_active OR public.is_admin());
DROP POLICY IF EXISTS sp_admin ON public.subscription_packages;
CREATE POLICY sp_admin ON public.subscription_packages FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

INSERT INTO public.subscription_packages (name, slug, price, product_limit, duration_days, features, sort_order)
VALUES
  ('Starter','starter',5000,20,30,'["Up to 20 products","Storefront page","Order management"]'::jsonb,1),
  ('Growth','growth',12000,50,30,'["Up to 50 products","Featured eligibility","Priority support"]'::jsonb,2),
  ('Business','business',25000,100,30,'["Up to 100 products","Official store eligibility","Dedicated support"]'::jsonb,3)
ON CONFLICT (slug) DO NOTHING;

-- ============ VENDOR SUBSCRIPTIONS ============
CREATE TABLE IF NOT EXISTS public.vendor_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  package_id uuid NOT NULL REFERENCES public.subscription_packages(id),
  status public.subscription_status NOT NULL DEFAULT 'pending',
  payment_status public.payment_status NOT NULL DEFAULT 'initiated',
  amount numeric NOT NULL DEFAULT 0,
  product_limit integer NOT NULL DEFAULT 20,
  starts_at timestamptz,
  expires_at timestamptz,
  payment_reference text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_vsub_vendor ON public.vendor_subscriptions(vendor_id);
GRANT SELECT, INSERT, UPDATE ON public.vendor_subscriptions TO authenticated;
GRANT ALL ON public.vendor_subscriptions TO service_role;
ALTER TABLE public.vendor_subscriptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS vsub_read ON public.vendor_subscriptions;
CREATE POLICY vsub_read ON public.vendor_subscriptions FOR SELECT TO authenticated
  USING (public.is_vendor_member(vendor_id) OR public.is_admin());
DROP POLICY IF EXISTS vsub_admin ON public.vendor_subscriptions;
CREATE POLICY vsub_admin ON public.vendor_subscriptions FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ============ PAYMENTS ============
CREATE TABLE IF NOT EXISTS public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference text NOT NULL UNIQUE,
  order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  vendor_subscription_id uuid REFERENCES public.vendor_subscriptions(id) ON DELETE SET NULL,
  customer_id uuid,
  purpose text NOT NULL DEFAULT 'order',
  gateway text NOT NULL DEFAULT 'monnify',
  gateway_reference text,
  amount numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'NGN',
  gateway_fee numeric NOT NULL DEFAULT 0,
  status public.payment_status NOT NULL DEFAULT 'initiated',
  checkout_url text,
  failure_reason text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  verified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_payments_order ON public.payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_customer ON public.payments(customer_id);
GRANT SELECT ON public.payments TO authenticated;
GRANT ALL ON public.payments TO service_role;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS pay_read ON public.payments;
CREATE POLICY pay_read ON public.payments FOR SELECT TO authenticated
  USING (customer_id = auth.uid() OR public.is_admin()
    OR EXISTS (SELECT 1 FROM public.vendor_orders vo WHERE vo.order_id = payments.order_id AND public.is_vendor_member(vo.vendor_id)));

-- gateway callback log (idempotency)
CREATE TABLE IF NOT EXISTS public.payment_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gateway text NOT NULL,
  event_key text NOT NULL,
  payment_id uuid REFERENCES public.payments(id) ON DELETE SET NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  processed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (gateway, event_key)
);
GRANT ALL ON public.payment_events TO service_role;
ALTER TABLE public.payment_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS pe_admin ON public.payment_events;
CREATE POLICY pe_admin ON public.payment_events FOR SELECT TO authenticated USING (public.is_admin());

-- ============ LEDGER (immutable) ============
CREATE TABLE IF NOT EXISTS public.ledger_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_type text NOT NULL,
  order_id uuid,
  vendor_order_id uuid,
  delivery_id uuid,
  payment_id uuid,
  settlement_id uuid,
  payout_id uuid,
  vendor_id uuid,
  despatcher_id uuid,
  customer_id uuid,
  amount numeric NOT NULL,
  currency text NOT NULL DEFAULT 'NGN',
  gateway text,
  gateway_reference text,
  description text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ledger_order ON public.ledger_entries(order_id);
CREATE INDEX IF NOT EXISTS idx_ledger_vendor ON public.ledger_entries(vendor_id);
CREATE INDEX IF NOT EXISTS idx_ledger_desp ON public.ledger_entries(despatcher_id);
GRANT SELECT ON public.ledger_entries TO authenticated;
GRANT ALL ON public.ledger_entries TO service_role;
ALTER TABLE public.ledger_entries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS ledger_read ON public.ledger_entries;
CREATE POLICY ledger_read ON public.ledger_entries FOR SELECT TO authenticated
  USING (public.is_admin() OR customer_id = auth.uid()
    OR (vendor_id IS NOT NULL AND public.is_vendor_member(vendor_id))
    OR (despatcher_id IS NOT NULL AND despatcher_id = public.my_despatcher_id()));

-- ============ SETTLEMENTS ============
CREATE TABLE IF NOT EXISTS public.settlements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  vendor_order_id uuid NOT NULL UNIQUE REFERENCES public.vendor_orders(id) ON DELETE CASCADE,
  delivery_id uuid REFERENCES public.deliveries(id) ON DELETE SET NULL,
  vendor_id uuid NOT NULL REFERENCES public.vendors(id),
  despatcher_id uuid REFERENCES public.despatchers(id),
  customer_id uuid NOT NULL,
  payment_id uuid REFERENCES public.payments(id),
  currency text NOT NULL DEFAULT 'NGN',
  gross_amount numeric NOT NULL DEFAULT 0,
  product_amount numeric NOT NULL DEFAULT 0,
  delivery_amount numeric NOT NULL DEFAULT 0,
  platform_commission numeric NOT NULL DEFAULT 0,
  platform_delivery_margin numeric NOT NULL DEFAULT 0,
  gateway_fee numeric NOT NULL DEFAULT 0,
  vendor_allocation numeric NOT NULL DEFAULT 0,
  despatcher_allocation numeric NOT NULL DEFAULT 0,
  platform_allocation numeric NOT NULL DEFAULT 0,
  refund_amount numeric NOT NULL DEFAULT 0,
  adjustment_amount numeric NOT NULL DEFAULT 0,
  status public.settlement_status NOT NULL DEFAULT 'window',
  hold_reason text,
  delivered_at timestamptz,
  ready_at timestamptz,
  approved_at timestamptz,
  approved_by uuid,
  locked boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_settle_vendor ON public.settlements(vendor_id);
CREATE INDEX IF NOT EXISTS idx_settle_desp ON public.settlements(despatcher_id);
CREATE INDEX IF NOT EXISTS idx_settle_status ON public.settlements(status);
GRANT SELECT ON public.settlements TO authenticated;
GRANT ALL ON public.settlements TO service_role;
ALTER TABLE public.settlements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS settle_read ON public.settlements;
CREATE POLICY settle_read ON public.settlements FOR SELECT TO authenticated
  USING (public.is_admin() OR customer_id = auth.uid() OR public.is_vendor_member(vendor_id)
    OR (despatcher_id IS NOT NULL AND despatcher_id = public.my_despatcher_id()));

-- ============ PAYOUTS ============
CREATE TABLE IF NOT EXISTS public.payouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  settlement_id uuid NOT NULL REFERENCES public.settlements(id) ON DELETE CASCADE,
  party_type public.payout_party NOT NULL,
  vendor_id uuid REFERENCES public.vendors(id),
  despatcher_id uuid REFERENCES public.despatchers(id),
  amount numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'NGN',
  status public.payout_status NOT NULL DEFAULT 'pending',
  provider text,
  provider_reference text,
  failure_reason text,
  attempts integer NOT NULL DEFAULT 0,
  processed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (settlement_id, party_type)
);
GRANT SELECT ON public.payouts TO authenticated;
GRANT ALL ON public.payouts TO service_role;
ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS payout_read ON public.payouts;
CREATE POLICY payout_read ON public.payouts FOR SELECT TO authenticated
  USING (public.is_admin() OR (vendor_id IS NOT NULL AND public.is_vendor_member(vendor_id))
    OR (despatcher_id IS NOT NULL AND despatcher_id = public.my_despatcher_id()));

DROP TRIGGER IF EXISTS t_settlements_u ON public.settlements;
CREATE TRIGGER t_settlements_u BEFORE UPDATE ON public.settlements FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS t_payouts_u ON public.payouts;
CREATE TRIGGER t_payouts_u BEFORE UPDATE ON public.payouts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS t_payments_u ON public.payments;
CREATE TRIGGER t_payments_u BEFORE UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS t_vsub_u ON public.vendor_subscriptions;
CREATE TRIGGER t_vsub_u BEFORE UPDATE ON public.vendor_subscriptions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ IMMUTABILITY GUARDS ============
CREATE OR REPLACE FUNCTION public.guard_ledger_immutable() RETURNS trigger
LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'Ledger entries are immutable'; END $$;
DROP TRIGGER IF EXISTS t_ledger_immutable ON public.ledger_entries;
CREATE TRIGGER t_ledger_immutable BEFORE UPDATE OR DELETE ON public.ledger_entries FOR EACH ROW EXECUTE FUNCTION public.guard_ledger_immutable();

CREATE OR REPLACE FUNCTION public.guard_settlement_locked() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF OLD.locked AND (
      NEW.gross_amount IS DISTINCT FROM OLD.gross_amount OR
      NEW.vendor_allocation IS DISTINCT FROM OLD.vendor_allocation OR
      NEW.despatcher_allocation IS DISTINCT FROM OLD.despatcher_allocation OR
      NEW.platform_allocation IS DISTINCT FROM OLD.platform_allocation OR
      NEW.gateway_fee IS DISTINCT FROM OLD.gateway_fee)
  THEN RAISE EXCEPTION 'Approved settlement allocations are immutable; record an adjustment instead'; END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS t_settlement_locked ON public.settlements;
CREATE TRIGGER t_settlement_locked BEFORE UPDATE ON public.settlements FOR EACH ROW EXECUTE FUNCTION public.guard_settlement_locked();

-- ============ HELPERS ============
CREATE OR REPLACE FUNCTION public.calc_gateway_fee(_amount numeric) RETURNS numeric
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT least(round((_amount * coalesce(s.gateway_percent,0) / 100) + coalesce(s.gateway_flat,0), 2), coalesce(nullif(s.gateway_fee_cap,0), 1e9))
  FROM public.marketplace_settings s WHERE s.id
$$;

CREATE OR REPLACE FUNCTION public.vendor_product_limit(_vendor_id uuid) RETURNS integer
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT coalesce((SELECT vs.product_limit FROM public.vendor_subscriptions vs
    WHERE vs.vendor_id = _vendor_id AND vs.status = 'active' AND (vs.expires_at IS NULL OR vs.expires_at > now())
    ORDER BY vs.product_limit DESC LIMIT 1), 0)
$$;

CREATE OR REPLACE FUNCTION public.guard_product_subscription_limit() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE _limit integer; _count integer; _require boolean;
BEGIN
  IF public.is_admin() THEN RETURN NEW; END IF;
  SELECT require_vendor_subscription INTO _require FROM public.marketplace_settings WHERE id;
  IF NOT coalesce(_require, true) THEN RETURN NEW; END IF;
  _limit := public.vendor_product_limit(NEW.vendor_id);
  IF _limit = 0 THEN RAISE EXCEPTION 'An active subscription is required before adding products'; END IF;
  SELECT count(*) INTO _count FROM public.products WHERE vendor_id = NEW.vendor_id;
  IF _count >= _limit THEN RAISE EXCEPTION 'Your subscription package allows a maximum of % products', _limit; END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS t_product_sub_limit ON public.products;
CREATE TRIGGER t_product_sub_limit BEFORE INSERT ON public.products FOR EACH ROW EXECUTE FUNCTION public.guard_product_subscription_limit();

-- ============ SETTLEMENT ENGINE ============
CREATE OR REPLACE FUNCTION public.create_settlement_for_delivery(_delivery_id uuid) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE _d public.deliveries; _vo public.vendor_orders; _s public.marketplace_settings;
        _gross numeric; _fee numeric; _comm numeric; _desp numeric; _margin numeric; _plat numeric;
        _pay public.payments; _id uuid; _vendor_owner uuid; _desp_user uuid;
BEGIN
  SELECT * INTO _d FROM public.deliveries WHERE id = _delivery_id;
  IF _d.id IS NULL OR _d.status <> 'delivered' THEN RETURN NULL; END IF;
  IF EXISTS (SELECT 1 FROM public.settlements WHERE vendor_order_id = _d.vendor_order_id) THEN
    RETURN (SELECT id FROM public.settlements WHERE vendor_order_id = _d.vendor_order_id);
  END IF;
  SELECT * INTO _vo FROM public.vendor_orders WHERE id = _d.vendor_order_id;
  SELECT * INTO _s FROM public.marketplace_settings WHERE id;
  SELECT * INTO _pay FROM public.payments WHERE order_id = _d.order_id AND status = 'successful' ORDER BY created_at LIMIT 1;

  _gross := coalesce(_vo.total, 0);
  _fee := round(coalesce(_pay.gateway_fee, public.calc_gateway_fee(_gross)), 2);
  _comm := round(coalesce(_vo.subtotal,0) * coalesce(_s.commission_percent,0) / 100, 2);
  _desp := CASE WHEN _d.despatcher_id IS NULL THEN 0
                ELSE round(coalesce(_vo.delivery_fee,0) * coalesce(_s.despatcher_share_percent,0) / 100, 2) END;
  _margin := round(coalesce(_vo.delivery_fee,0) - _desp, 2);
  _plat := _comm + _margin - CASE WHEN coalesce(_s.gateway_fee_bearer,'platform') = 'platform' THEN _fee ELSE 0 END;

  INSERT INTO public.settlements (order_id, vendor_order_id, delivery_id, vendor_id, despatcher_id, customer_id,
    payment_id, currency, gross_amount, product_amount, delivery_amount, platform_commission,
    platform_delivery_margin, gateway_fee, vendor_allocation, despatcher_allocation, platform_allocation,
    status, delivered_at, ready_at)
  VALUES (_d.order_id, _d.vendor_order_id, _d.id, _d.vendor_id, _d.despatcher_id, _d.customer_id,
    _pay.id, coalesce(_s.default_currency,'NGN'), _gross, coalesce(_vo.subtotal,0), coalesce(_vo.delivery_fee,0),
    _comm, _margin, _fee,
    round(coalesce(_vo.subtotal,0) - _comm - CASE WHEN coalesce(_s.gateway_fee_bearer,'vendor') = 'vendor' THEN _fee ELSE 0 END, 2),
    _desp, _plat, 'window', coalesce(_d.delivered_at, now()),
    coalesce(_d.delivered_at, now()) + make_interval(mins => coalesce(_s.settlement_window_minutes,60)))
  RETURNING id INTO _id;

  INSERT INTO public.ledger_entries (entry_type, order_id, vendor_order_id, delivery_id, payment_id, settlement_id,
    vendor_id, despatcher_id, customer_id, amount, description)
  SELECT * FROM (VALUES
    ('allocation.vendor', _d.order_id, _d.vendor_order_id, _d.id, _pay.id, _id, _d.vendor_id, NULL::uuid, _d.customer_id,
      (SELECT vendor_allocation FROM public.settlements WHERE id = _id), 'Vendor allocation'),
    ('allocation.despatcher', _d.order_id, _d.vendor_order_id, _d.id, _pay.id, _id, NULL::uuid, _d.despatcher_id, _d.customer_id,
      _desp, 'Dispatcher allocation'),
    ('allocation.platform', _d.order_id, _d.vendor_order_id, _d.id, _pay.id, _id, NULL::uuid, NULL::uuid, _d.customer_id,
      _plat, 'RealTreats allocation'),
    ('fee.gateway', _d.order_id, _d.vendor_order_id, _d.id, _pay.id, _id, NULL::uuid, NULL::uuid, _d.customer_id,
      _fee, 'Gateway fee')
  ) v;

  SELECT owner_id INTO _vendor_owner FROM public.vendors WHERE id = _d.vendor_id;
  PERFORM public.notify_user(_vendor_owner, 'Settlement calculated', 'Your earnings for a delivered order are being held for the settlement window.', 'finance','settlement',_id);
  IF _d.despatcher_id IS NOT NULL THEN
    SELECT user_id INTO _desp_user FROM public.despatchers WHERE id = _d.despatcher_id;
    PERFORM public.notify_user(_desp_user, 'Delivery earning calculated', 'Your delivery earning is in the settlement window.', 'finance','settlement',_id);
  END IF;
  PERFORM public.log_audit('settlement.created','settlement',_id, jsonb_build_object('gross',_gross));
  RETURN _id;
END $$;

CREATE OR REPLACE FUNCTION public.on_delivery_settlement() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NEW.status = 'delivered' AND OLD.status IS DISTINCT FROM 'delivered' THEN
    PERFORM public.create_settlement_for_delivery(NEW.id);
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS t_delivery_settlement ON public.deliveries;
CREATE TRIGGER t_delivery_settlement AFTER UPDATE ON public.deliveries FOR EACH ROW EXECUTE FUNCTION public.on_delivery_settlement();

-- mature settlements whose window elapsed
CREATE OR REPLACE FUNCTION public.mature_settlements() RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE _n integer;
BEGIN
  UPDATE public.settlements SET status = 'ready_for_approval'
   WHERE status = 'window' AND ready_at IS NOT NULL AND ready_at <= now();
  GET DIAGNOSTICS _n = ROW_COUNT;
  RETURN _n;
END $$;
GRANT EXECUTE ON FUNCTION public.mature_settlements() TO authenticated;

CREATE OR REPLACE FUNCTION public.hold_settlement(_settlement_id uuid, _reason text) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Forbidden'; END IF;
  UPDATE public.settlements SET status = 'held', hold_reason = _reason
    WHERE id = _settlement_id AND status IN ('window','ready_for_approval');
  PERFORM public.log_audit('settlement.held','settlement',_settlement_id, jsonb_build_object('reason',_reason));
END $$;

CREATE OR REPLACE FUNCTION public.release_settlement(_settlement_id uuid) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Forbidden'; END IF;
  UPDATE public.settlements SET status = CASE WHEN ready_at <= now() THEN 'ready_for_approval'::public.settlement_status ELSE 'window'::public.settlement_status END,
    hold_reason = NULL WHERE id = _settlement_id AND status = 'held';
  PERFORM public.log_audit('settlement.released','settlement',_settlement_id,'{}'::jsonb);
END $$;

CREATE OR REPLACE FUNCTION public.reject_settlement(_settlement_id uuid, _reason text) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Forbidden'; END IF;
  UPDATE public.settlements SET status = 'rejected', hold_reason = _reason WHERE id = _settlement_id AND status <> 'paid';
  PERFORM public.log_audit('settlement.rejected','settlement',_settlement_id, jsonb_build_object('reason',_reason));
END $$;

CREATE OR REPLACE FUNCTION public.approve_settlement(_settlement_id uuid) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE _s public.settlements; _owner uuid; _duser uuid;
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Forbidden'; END IF;
  SELECT * INTO _s FROM public.settlements WHERE id = _settlement_id FOR UPDATE;
  IF _s.id IS NULL THEN RAISE EXCEPTION 'Settlement not found'; END IF;
  IF _s.status <> 'ready_for_approval' THEN RAISE EXCEPTION 'Only settlements ready for approval can be approved'; END IF;

  UPDATE public.settlements SET status = 'approved', approved_at = now(), approved_by = auth.uid(), locked = true
    WHERE id = _settlement_id;

  IF _s.vendor_allocation > 0 THEN
    INSERT INTO public.payouts (settlement_id, party_type, vendor_id, amount, currency)
    VALUES (_settlement_id, 'vendor', _s.vendor_id, _s.vendor_allocation, _s.currency)
    ON CONFLICT (settlement_id, party_type) DO NOTHING;
  END IF;
  IF _s.despatcher_id IS NOT NULL AND _s.despatcher_allocation > 0 THEN
    INSERT INTO public.payouts (settlement_id, party_type, despatcher_id, amount, currency)
    VALUES (_settlement_id, 'despatcher', _s.despatcher_id, _s.despatcher_allocation, _s.currency)
    ON CONFLICT (settlement_id, party_type) DO NOTHING;
  END IF;

  SELECT owner_id INTO _owner FROM public.vendors WHERE id = _s.vendor_id;
  PERFORM public.notify_user(_owner, 'Payout approved', 'Your settlement was approved and the payout is being processed.', 'finance','settlement',_settlement_id);
  IF _s.despatcher_id IS NOT NULL THEN
    SELECT user_id INTO _duser FROM public.despatchers WHERE id = _s.despatcher_id;
    PERFORM public.notify_user(_duser, 'Payout approved', 'Your delivery earning was approved for payout.', 'finance','settlement',_settlement_id);
  END IF;
  PERFORM public.log_audit('settlement.approved','settlement',_settlement_id, jsonb_build_object('vendor',_s.vendor_allocation,'despatcher',_s.despatcher_allocation,'platform',_s.platform_allocation));
END $$;

CREATE OR REPLACE FUNCTION public.update_payout_status(_payout_id uuid, _status public.payout_status, _reference text DEFAULT NULL, _reason text DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE _p public.payouts; _sid uuid; _owner uuid; _duser uuid;
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Forbidden'; END IF;
  SELECT * INTO _p FROM public.payouts WHERE id = _payout_id FOR UPDATE;
  IF _p.id IS NULL THEN RAISE EXCEPTION 'Payout not found'; END IF;
  IF _p.status = 'successful' THEN RAISE EXCEPTION 'This payout already completed'; END IF;

  UPDATE public.payouts SET status = _status, provider_reference = coalesce(_reference, provider_reference),
    failure_reason = CASE WHEN _status IN ('failed','retry_required') THEN _reason ELSE NULL END,
    attempts = attempts + 1,
    processed_at = CASE WHEN _status = 'successful' THEN now() ELSE processed_at END
  WHERE id = _payout_id;

  _sid := _p.settlement_id;
  IF _status = 'successful' THEN
    INSERT INTO public.ledger_entries (entry_type, settlement_id, payout_id, vendor_id, despatcher_id, amount, gateway_reference, description)
    VALUES ('payout.' || _p.party_type::text, _sid, _p.id, _p.vendor_id, _p.despatcher_id, _p.amount, _reference, 'Payout completed');
  END IF;

  UPDATE public.settlements s SET status = CASE
    WHEN NOT EXISTS (SELECT 1 FROM public.payouts p WHERE p.settlement_id = s.id AND p.status <> 'successful') THEN 'paid'::public.settlement_status
    WHEN EXISTS (SELECT 1 FROM public.payouts p WHERE p.settlement_id = s.id AND p.status IN ('failed','retry_required')) THEN 'failed'::public.settlement_status
    ELSE 'processing'::public.settlement_status END
  WHERE s.id = _sid AND s.status IN ('approved','processing','failed');

  IF _p.vendor_id IS NOT NULL THEN
    SELECT owner_id INTO _owner FROM public.vendors WHERE id = _p.vendor_id;
    PERFORM public.notify_user(_owner, 'Payout ' || _status::text, 'Your payout status is now ' || replace(_status::text,'_',' ') || '.', 'finance','settlement',_sid);
  END IF;
  IF _p.despatcher_id IS NOT NULL THEN
    SELECT user_id INTO _duser FROM public.despatchers WHERE id = _p.despatcher_id;
    PERFORM public.notify_user(_duser, 'Payout ' || _status::text, 'Your payout status is now ' || replace(_status::text,'_',' ') || '.', 'finance','settlement',_sid);
  END IF;
  PERFORM public.log_audit('payout.' || _status::text, 'payout', _payout_id, jsonb_build_object('reference',_reference,'reason',_reason));
END $$;

-- ============ PAYMENT LIFECYCLE ============
CREATE OR REPLACE FUNCTION public.initiate_order_payment(_order_id uuid, _gateway text DEFAULT NULL)
RETURNS public.payments LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE _o public.orders; _s public.marketplace_settings; _p public.payments; _gw text; _fee numeric;
BEGIN
  SELECT * INTO _o FROM public.orders WHERE id = _order_id;
  IF _o.id IS NULL THEN RAISE EXCEPTION 'Order not found'; END IF;
  IF _o.customer_id <> auth.uid() AND NOT public.is_admin() THEN RAISE EXCEPTION 'Forbidden'; END IF;
  SELECT * INTO _s FROM public.marketplace_settings WHERE id;
  _gw := coalesce(_gateway, _s.default_gateway, 'monnify');

  SELECT * INTO _p FROM public.payments WHERE order_id = _order_id AND status IN ('initiated','pending') ORDER BY created_at DESC LIMIT 1;
  IF _p.id IS NOT NULL THEN RETURN _p; END IF;
  IF EXISTS (SELECT 1 FROM public.payments WHERE order_id = _order_id AND status = 'successful') THEN
    RAISE EXCEPTION 'This order is already paid';
  END IF;

  _fee := public.calc_gateway_fee(_o.total);
  INSERT INTO public.payments (reference, order_id, customer_id, purpose, gateway, amount, currency, gateway_fee, status)
  VALUES ('RT-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,12)), _order_id, _o.customer_id, 'order',
          _gw, _o.total, coalesce(_o.currency,'NGN'), _fee, 'initiated')
  RETURNING * INTO _p;
  PERFORM public.log_audit('payment.initiated','payment',_p.id, jsonb_build_object('gateway',_gw,'amount',_o.total));
  RETURN _p;
END $$;

CREATE OR REPLACE FUNCTION public.confirm_payment(_reference text, _gateway_reference text, _paid_amount numeric, _gateway_fee numeric DEFAULT NULL, _payload jsonb DEFAULT '{}'::jsonb)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE _p public.payments; _owner uuid; _vo record;
BEGIN
  SELECT * INTO _p FROM public.payments WHERE reference = _reference FOR UPDATE;
  IF _p.id IS NULL THEN RAISE EXCEPTION 'Unknown payment reference'; END IF;
  IF _p.status = 'successful' THEN RETURN _p.id; END IF;
  IF _paid_amount < _p.amount THEN
    UPDATE public.payments SET status = 'pending', gateway_reference = _gateway_reference, metadata = _payload WHERE id = _p.id;
    RETURN _p.id;
  END IF;

  UPDATE public.payments SET status = 'successful', gateway_reference = _gateway_reference,
    gateway_fee = coalesce(_gateway_fee, gateway_fee), verified_at = now(), metadata = _payload WHERE id = _p.id;

  INSERT INTO public.ledger_entries (entry_type, order_id, payment_id, customer_id, amount, gateway, gateway_reference, description)
  VALUES ('payment.received', _p.order_id, _p.id, _p.customer_id, _p.amount, _p.gateway, _gateway_reference, 'Customer payment received');

  IF _p.order_id IS NOT NULL THEN
    UPDATE public.orders SET status = 'processing' WHERE id = _p.order_id;
    FOR _vo IN SELECT vo.id, vo.vendor_id FROM public.vendor_orders vo WHERE vo.order_id = _p.order_id LOOP
      SELECT owner_id INTO _owner FROM public.vendors WHERE id = _vo.vendor_id;
      PERFORM public.notify_user(_owner, 'Payment confirmed', 'A paid order is ready for you to prepare.', 'order','vendor_order',_vo.id);
    END LOOP;
    PERFORM public.notify_user(_p.customer_id, 'Payment successful', 'Your payment was confirmed and your order is being prepared.', 'payment','order',_p.order_id);
  END IF;

  IF _p.vendor_subscription_id IS NOT NULL THEN
    UPDATE public.vendor_subscriptions vs SET status = 'active', payment_status = 'successful',
      starts_at = now(), expires_at = now() + make_interval(days => (SELECT duration_days FROM public.subscription_packages WHERE id = vs.package_id))
    WHERE vs.id = _p.vendor_subscription_id;
  END IF;

  PERFORM public.log_audit('payment.successful','payment',_p.id, jsonb_build_object('gateway_reference',_gateway_reference));
  RETURN _p.id;
END $$;

CREATE OR REPLACE FUNCTION public.fail_payment(_reference text, _reason text) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  UPDATE public.payments SET status = 'failed', failure_reason = _reason WHERE reference = _reference AND status <> 'successful';
END $$;

CREATE OR REPLACE FUNCTION public.subscribe_vendor(_package_id uuid) RETURNS public.payments
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE _v public.vendors; _pkg public.subscription_packages; _sub uuid; _p public.payments; _gw text;
BEGIN
  SELECT * INTO _v FROM public.vendors WHERE owner_id = auth.uid();
  IF _v.id IS NULL THEN RAISE EXCEPTION 'No vendor account'; END IF;
  SELECT * INTO _pkg FROM public.subscription_packages WHERE id = _package_id AND is_active;
  IF _pkg.id IS NULL THEN RAISE EXCEPTION 'Package not available'; END IF;
  SELECT coalesce(default_gateway,'monnify') INTO _gw FROM public.marketplace_settings WHERE id;

  INSERT INTO public.vendor_subscriptions (vendor_id, package_id, amount, product_limit, status)
  VALUES (_v.id, _pkg.id, _pkg.price, _pkg.product_limit, 'pending') RETURNING id INTO _sub;

  INSERT INTO public.payments (reference, vendor_subscription_id, customer_id, purpose, gateway, amount, currency, gateway_fee, status)
  VALUES ('RTSUB-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,10)), _sub, auth.uid(), 'subscription',
          _gw, _pkg.price, _pkg.currency, public.calc_gateway_fee(_pkg.price), 'initiated')
  RETURNING * INTO _p;
  UPDATE public.vendor_subscriptions SET payment_reference = _p.reference WHERE id = _sub;
  PERFORM public.log_audit('subscription.initiated','vendor_subscription',_sub, jsonb_build_object('package',_pkg.slug));
  RETURN _p;
END $$;

REVOKE ALL ON FUNCTION public.confirm_payment(text,text,numeric,numeric,jsonb) FROM public, anon, authenticated;
REVOKE ALL ON FUNCTION public.fail_payment(text,text) FROM public, anon, authenticated;
REVOKE ALL ON FUNCTION public.create_settlement_for_delivery(uuid) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.initiate_order_payment(uuid,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.subscribe_vendor(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.approve_settlement(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.hold_settlement(uuid,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.release_settlement(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reject_settlement(uuid,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_payout_status(uuid,public.payout_status,text,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.vendor_product_limit(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.calc_gateway_fee(numeric) TO authenticated;

ALTER PUBLICATION supabase_realtime ADD TABLE public.settlements;
ALTER PUBLICATION supabase_realtime ADD TABLE public.payments;
