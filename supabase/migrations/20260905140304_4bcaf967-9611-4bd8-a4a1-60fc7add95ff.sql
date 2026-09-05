ALTER TABLE public.marketplace_settings
  ADD COLUMN IF NOT EXISTS bank_name text NOT NULL DEFAULT 'Moniepoint MFB',
  ADD COLUMN IF NOT EXISTS bank_account_number text NOT NULL DEFAULT '6263388058',
  ADD COLUMN IF NOT EXISTS bank_account_name text NOT NULL DEFAULT 'RealTreats Technologies',
  ADD COLUMN IF NOT EXISTS bank_transfer_enabled boolean NOT NULL DEFAULT true;

ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS payer_name text,
  ADD COLUMN IF NOT EXISTS payer_bank text,
  ADD COLUMN IF NOT EXISTS transfer_note text,
  ADD COLUMN IF NOT EXISTS declared_at timestamptz,
  ADD COLUMN IF NOT EXISTS reviewed_by uuid,
  ADD COLUMN IF NOT EXISTS reviewed_at timestamptz;

CREATE OR REPLACE FUNCTION public.notify_admins(_title text, _body text, _type text, _entity_type text, _entity_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _u uuid;
BEGIN
  FOR _u IN SELECT user_id FROM public.user_roles WHERE role = 'super_admin' LOOP
    PERFORM public.notify_user(_u, _title, _body, _type, _entity_type, _entity_id);
  END LOOP;
END $$;

CREATE OR REPLACE FUNCTION public.declare_bank_transfer(_reference text, _payer_name text, _payer_bank text, _note text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _p public.payments; _vo record; _owner uuid;
BEGIN
  SELECT * INTO _p FROM public.payments WHERE reference = _reference FOR UPDATE;
  IF _p.id IS NULL THEN RAISE EXCEPTION 'Unknown payment reference'; END IF;
  IF _p.customer_id <> auth.uid() AND NOT public.is_admin() THEN RAISE EXCEPTION 'Forbidden'; END IF;
  IF _p.status = 'successful' THEN RAISE EXCEPTION 'This payment is already confirmed'; END IF;

  UPDATE public.payments
     SET status = 'pending', gateway = 'manual', payer_name = _payer_name, payer_bank = _payer_bank,
         transfer_note = _note, declared_at = now(), failure_reason = NULL
   WHERE id = _p.id;

  PERFORM public.notify_admins('Bank transfer declared',
    coalesce(_payer_name,'A customer') || ' says they paid ' || _p.currency || ' ' || _p.amount || ' for ' || _p.reference || '. Please confirm it.',
    'payment', 'payment', _p.id);

  IF _p.order_id IS NOT NULL THEN
    FOR _vo IN SELECT vo.id, vo.vendor_id FROM public.vendor_orders vo WHERE vo.order_id = _p.order_id LOOP
      SELECT owner_id INTO _owner FROM public.vendors WHERE id = _vo.vendor_id;
      PERFORM public.notify_user(_owner, 'Customer declared a bank transfer',
        'A customer has declared payment for an order. It will be released once RealTreats confirms the transfer.',
        'payment', 'vendor_order', _vo.id);
    END LOOP;
  END IF;

  PERFORM public.log_audit('payment.declared','payment',_p.id, jsonb_build_object('payer_name',_payer_name,'payer_bank',_payer_bank));
END $$;

CREATE OR REPLACE FUNCTION public.admin_review_payment(_payment_id uuid, _approve boolean, _reason text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _p public.payments; _vo record; _owner uuid;
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Forbidden'; END IF;
  SELECT * INTO _p FROM public.payments WHERE id = _payment_id;
  IF _p.id IS NULL THEN RAISE EXCEPTION 'Payment not found'; END IF;

  IF _approve THEN
    PERFORM public.confirm_payment(_p.reference, coalesce(_p.gateway_reference, _p.reference), _p.amount, _p.gateway_fee,
      jsonb_build_object('source','admin_manual_confirmation','reviewed_by',auth.uid()));
  ELSE
    PERFORM public.fail_payment(_p.reference, coalesce(_reason, 'Transfer could not be verified'));
    PERFORM public.notify_user(_p.customer_id, 'Payment not confirmed',
      coalesce(_reason, 'We could not verify your bank transfer. Please contact support.'), 'payment', 'payment', _p.id);
    IF _p.order_id IS NOT NULL THEN
      FOR _vo IN SELECT vo.id, vo.vendor_id FROM public.vendor_orders vo WHERE vo.order_id = _p.order_id LOOP
        SELECT owner_id INTO _owner FROM public.vendors WHERE id = _vo.vendor_id;
        PERFORM public.notify_user(_owner, 'Payment declined',
          'A declared bank transfer for one of your orders was not confirmed.', 'payment', 'vendor_order', _vo.id);
      END LOOP;
    END IF;
  END IF;

  UPDATE public.payments SET reviewed_by = auth.uid(), reviewed_at = now() WHERE id = _p.id;
  PERFORM public.log_audit(CASE WHEN _approve THEN 'payment.admin_confirmed' ELSE 'payment.admin_declined' END,
    'payment', _p.id, jsonb_build_object('reason',_reason));
END $$;

REVOKE ALL ON FUNCTION public.notify_admins(text,text,text,text,uuid) FROM public, anon, authenticated;
REVOKE ALL ON FUNCTION public.declare_bank_transfer(text,text,text,text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.declare_bank_transfer(text,text,text,text) TO authenticated;
REVOKE ALL ON FUNCTION public.admin_review_payment(uuid,boolean,text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.admin_review_payment(uuid,boolean,text) TO authenticated;

ALTER TABLE public.despatchers REPLICA IDENTITY FULL;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='despatchers') THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.despatchers';
  END IF;
END $$;