-- ===== despatcher onboarding =====
CREATE OR REPLACE FUNCTION public.register_despatcher(_payload jsonb)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _uid uuid := auth.uid(); _id uuid;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF EXISTS (SELECT 1 FROM public.despatchers WHERE user_id = _uid) THEN
    RAISE EXCEPTION 'You already have a despatcher account';
  END IF;
  INSERT INTO public.despatchers (user_id, full_name, phone, email, vehicle_type, vehicle_plate, id_document_url,
    business_name, address, city, state, country, latitude, longitude, service_radius_km)
  VALUES (_uid, coalesce(_payload->>'full_name','Despatcher'), _payload->>'phone', coalesce(_payload->>'email', auth.jwt()->>'email'),
    coalesce(_payload->>'vehicle_type','motorcycle'), _payload->>'vehicle_plate', _payload->>'id_document_url',
    _payload->>'business_name', _payload->>'address', _payload->>'city', _payload->>'state',
    coalesce(_payload->>'country','Nigeria'),
    nullif(_payload->>'latitude','')::double precision, nullif(_payload->>'longitude','')::double precision,
    coalesce(nullif(_payload->>'service_radius_km','')::numeric, 15))
  RETURNING id INTO _id;
  INSERT INTO public.user_roles (user_id, role) VALUES (_uid, 'despatcher') ON CONFLICT DO NOTHING;
  PERFORM public.log_audit('despatcher.applied','despatcher',_id, jsonb_build_object('name', _payload->>'full_name'));
  RETURN _id;
END $$;

CREATE OR REPLACE FUNCTION public.review_despatcher(_despatcher_id uuid, _status public.despatcher_status, _reason text DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _uid uuid; _name text;
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Forbidden'; END IF;
  UPDATE public.despatchers SET status = _status, rejection_reason = _reason,
    availability = CASE WHEN _status <> 'approved' THEN 'offline'::public.despatcher_availability ELSE availability END
  WHERE id = _despatcher_id RETURNING user_id, full_name INTO _uid, _name;
  PERFORM public.notify_user(_uid, 'Despatcher application ' || _status::text,
    'Your despatcher account is now ' || _status::text || coalesce('. Reason: ' || _reason,''), 'despatch','despatcher',_despatcher_id);
  PERFORM public.log_audit('despatcher.' || _status::text, 'despatcher', _despatcher_id, jsonb_build_object('reason',_reason));
END $$;

CREATE OR REPLACE FUNCTION public.set_despatcher_availability(_availability public.despatcher_availability)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _d public.despatchers;
BEGIN
  SELECT * INTO _d FROM public.despatchers WHERE user_id = auth.uid();
  IF _d.id IS NULL THEN RAISE EXCEPTION 'No despatcher account'; END IF;
  IF _d.status <> 'approved' THEN RAISE EXCEPTION 'Your despatcher account is not approved yet'; END IF;
  IF _availability = 'offline' AND EXISTS (
    SELECT 1 FROM public.deliveries WHERE despatcher_id = _d.id
      AND status IN ('accepted','heading_to_pickup','arrived_at_pickup','picked_up','in_transit','near_destination','arrived_at_destination')
  ) THEN RAISE EXCEPTION 'Finish or hand over your active delivery before going offline'; END IF;
  UPDATE public.despatchers SET availability = _availability WHERE id = _d.id;
END $$;

CREATE OR REPLACE FUNCTION public.update_despatcher_location(_lat double precision, _lng double precision)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _id uuid;
BEGIN
  SELECT id INTO _id FROM public.despatchers WHERE user_id = auth.uid();
  IF _id IS NULL THEN RAISE EXCEPTION 'No despatcher account'; END IF;
  UPDATE public.despatchers SET current_latitude=_lat, current_longitude=_lng, location_updated_at=now() WHERE id=_id;
  UPDATE public.deliveries SET despatcher_latitude=_lat, despatcher_longitude=_lng, despatcher_location_at=now()
   WHERE despatcher_id=_id AND status IN ('accepted','heading_to_pickup','arrived_at_pickup','picked_up','in_transit','near_destination','arrived_at_destination');
END $$;

-- ===== assignment engine =====
CREATE OR REPLACE FUNCTION public.pick_despatcher(_lat double precision, _lng double precision)
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT d.id FROM public.despatchers d
  WHERE d.status = 'approved' AND d.availability IN ('online')
    AND d.active_deliveries = 0
    AND (_lat IS NULL OR d.latitude IS NULL OR public.distance_km(_lat,_lng,coalesce(d.current_latitude,d.latitude),coalesce(d.current_longitude,d.longitude)) <= d.service_radius_km)
  ORDER BY coalesce(public.distance_km(_lat,_lng,coalesce(d.current_latitude,d.latitude),coalesce(d.current_longitude,d.longitude)), 99999) ASC
  LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.request_delivery(_vendor_order_id uuid)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _d public.deliveries; _vo public.vendor_orders; _v public.vendors; _pick uuid; _auto boolean; _dist numeric;
BEGIN
  SELECT * INTO _vo FROM public.vendor_orders WHERE id = _vendor_order_id;
  IF _vo.id IS NULL THEN RAISE EXCEPTION 'Order not found'; END IF;
  IF NOT (public.is_vendor_member(_vo.vendor_id) OR public.is_admin()) THEN RAISE EXCEPTION 'Forbidden'; END IF;
  SELECT * INTO _v FROM public.vendors WHERE id = _vo.vendor_id;
  SELECT * INTO _d FROM public.deliveries WHERE vendor_order_id = _vendor_order_id LIMIT 1;
  IF _d.id IS NULL THEN RAISE EXCEPTION 'No delivery record for this order'; END IF;
  IF _d.status NOT IN ('pending','requested','cancelled','failed') THEN RETURN _d.id; END IF;

  _dist := round(coalesce(public.distance_km(_v.latitude,_v.longitude,_d.delivery_latitude,_d.delivery_longitude),0)::numeric,1);

  UPDATE public.deliveries SET
    status = 'awaiting_assignment',
    pickup_address = coalesce(pickup_address, _v.address),
    pickup_latitude = coalesce(pickup_latitude, _v.latitude),
    pickup_longitude = coalesce(pickup_longitude, _v.longitude),
    distance_km = _dist
  WHERE id = _d.id;

  UPDATE public.vendor_orders SET status = 'ready_for_dispatch'
    WHERE id = _vendor_order_id AND status NOT IN ('dispatched','completed','cancelled');

  SELECT auto_assign_deliveries INTO _auto FROM public.marketplace_settings WHERE id;
  IF coalesce(_auto,true) THEN
    _pick := public.pick_despatcher(_v.latitude, _v.longitude);
    IF _pick IS NOT NULL THEN PERFORM public.assign_delivery(_d.id, _pick); END IF;
  END IF;
  PERFORM public.notify_user(_vo.customer_id, 'Delivery requested', 'Your order is ready and a despatcher is being arranged.', 'delivery','delivery',_d.id);
  PERFORM public.log_audit('delivery.requested','delivery',_d.id,'{}'::jsonb);
  RETURN _d.id;
END $$;

CREATE OR REPLACE FUNCTION public.assign_delivery(_delivery_id uuid, _despatcher_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _d public.deliveries; _uid uuid;
BEGIN
  SELECT * INTO _d FROM public.deliveries WHERE id = _delivery_id;
  IF _d.id IS NULL THEN RAISE EXCEPTION 'Delivery not found'; END IF;
  IF _d.status IN ('delivered','cancelled') THEN RAISE EXCEPTION 'This delivery is already closed'; END IF;
  SELECT user_id INTO _uid FROM public.despatchers WHERE id = _despatcher_id AND status = 'approved';
  IF _uid IS NULL THEN RAISE EXCEPTION 'Despatcher is not approved'; END IF;

  IF _d.despatcher_id IS NOT NULL AND _d.despatcher_id <> _despatcher_id THEN
    UPDATE public.despatchers SET active_deliveries = greatest(active_deliveries - 1, 0), availability =
      CASE WHEN availability = 'on_delivery' THEN 'online'::public.despatcher_availability ELSE availability END
      WHERE id = _d.despatcher_id;
  END IF;

  UPDATE public.deliveries SET despatcher_id = _despatcher_id, assigned_at = now(), status = 'assigned' WHERE id = _delivery_id;
  UPDATE public.despatchers SET availability = 'assigned' WHERE id = _despatcher_id AND availability = 'online';
  PERFORM public.notify_user(_uid, 'New delivery assignment', 'You have been assigned a delivery. Open your despatch dashboard to accept it.', 'despatch','delivery',_delivery_id);
  PERFORM public.notify_user((SELECT owner_id FROM public.vendors WHERE id = _d.vendor_id), 'Despatcher assigned', 'A despatcher has been assigned to collect an order.', 'delivery','delivery',_delivery_id);
  PERFORM public.notify_user(_d.customer_id, 'Despatcher assigned', 'A despatcher has been assigned to your delivery.', 'delivery','delivery',_delivery_id);
  PERFORM public.log_audit('delivery.assigned','delivery',_delivery_id, jsonb_build_object('despatcher_id',_despatcher_id));
END $$;

CREATE OR REPLACE FUNCTION public.claim_delivery(_delivery_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _me uuid; _d public.deliveries;
BEGIN
  SELECT id INTO _me FROM public.despatchers WHERE user_id = auth.uid() AND status = 'approved';
  IF _me IS NULL THEN RAISE EXCEPTION 'Your despatcher account is not approved'; END IF;
  IF EXISTS (SELECT 1 FROM public.deliveries WHERE despatcher_id = _me AND status IN
     ('accepted','heading_to_pickup','arrived_at_pickup','picked_up','in_transit','near_destination','arrived_at_destination'))
  THEN RAISE EXCEPTION 'Finish your active delivery first'; END IF;
  SELECT * INTO _d FROM public.deliveries WHERE id = _delivery_id FOR UPDATE;
  IF _d.id IS NULL THEN RAISE EXCEPTION 'Delivery not found'; END IF;
  IF _d.despatcher_id IS NOT NULL AND _d.despatcher_id <> _me THEN RAISE EXCEPTION 'This delivery has already been taken'; END IF;
  PERFORM public.assign_delivery(_delivery_id, _me);
  PERFORM public.accept_delivery(_delivery_id);
END $$;

CREATE OR REPLACE FUNCTION public.accept_delivery(_delivery_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _me uuid; _d public.deliveries;
BEGIN
  SELECT id INTO _me FROM public.despatchers WHERE user_id = auth.uid() AND status = 'approved';
  SELECT * INTO _d FROM public.deliveries WHERE id = _delivery_id;
  IF _d.id IS NULL THEN RAISE EXCEPTION 'Delivery not found'; END IF;
  IF _d.despatcher_id IS DISTINCT FROM _me AND NOT public.is_admin() THEN RAISE EXCEPTION 'Forbidden'; END IF;
  IF _d.status <> 'assigned' THEN RAISE EXCEPTION 'This delivery cannot be accepted right now'; END IF;
  UPDATE public.deliveries SET status = 'accepted', accepted_at = now() WHERE id = _delivery_id;
  UPDATE public.despatchers SET availability = 'on_delivery', active_deliveries = active_deliveries + 1 WHERE id = _d.despatcher_id;
  PERFORM public.notify_user((SELECT owner_id FROM public.vendors WHERE id = _d.vendor_id), 'Delivery accepted', 'The despatcher accepted the pickup.', 'delivery','delivery',_delivery_id);
  PERFORM public.notify_user(_d.customer_id, 'Delivery accepted', 'A despatcher accepted your delivery.', 'delivery','delivery',_delivery_id);
END $$;

CREATE OR REPLACE FUNCTION public.reject_delivery(_delivery_id uuid, _reason text DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _me uuid; _d public.deliveries;
BEGIN
  SELECT id INTO _me FROM public.despatchers WHERE user_id = auth.uid();
  SELECT * INTO _d FROM public.deliveries WHERE id = _delivery_id;
  IF _d.despatcher_id IS DISTINCT FROM _me THEN RAISE EXCEPTION 'Forbidden'; END IF;
  IF _d.status <> 'assigned' THEN RAISE EXCEPTION 'You can only decline a delivery before accepting it'; END IF;
  UPDATE public.deliveries SET despatcher_id = NULL, assigned_at = NULL, status = 'awaiting_assignment' WHERE id = _delivery_id;
  UPDATE public.despatchers SET availability = CASE WHEN availability = 'assigned' THEN 'online'::public.despatcher_availability ELSE availability END WHERE id = _me;
  PERFORM public.log_audit('delivery.declined','delivery',_delivery_id, jsonb_build_object('reason',_reason));
END $$;

-- ===== state machine =====
CREATE OR REPLACE FUNCTION public.delivery_next_states(_status public.delivery_status)
RETURNS public.delivery_status[] LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE _status
    WHEN 'accepted' THEN ARRAY['heading_to_pickup','cancelled']::public.delivery_status[]
    WHEN 'heading_to_pickup' THEN ARRAY['arrived_at_pickup','failed','cancelled']::public.delivery_status[]
    WHEN 'arrived_at_pickup' THEN ARRAY['picked_up','failed','cancelled']::public.delivery_status[]
    WHEN 'picked_up' THEN ARRAY['in_transit','failed']::public.delivery_status[]
    WHEN 'in_transit' THEN ARRAY['near_destination','arrived_at_destination','delivered','failed']::public.delivery_status[]
    WHEN 'near_destination' THEN ARRAY['arrived_at_destination','delivered','failed']::public.delivery_status[]
    WHEN 'arrived_at_destination' THEN ARRAY['delivered','failed']::public.delivery_status[]
    ELSE ARRAY[]::public.delivery_status[]
  END
$$;

CREATE OR REPLACE FUNCTION public.update_delivery_status(_delivery_id uuid, _status public.delivery_status, _note text DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _me uuid; _d public.deliveries; _owner uuid;
BEGIN
  SELECT id INTO _me FROM public.despatchers WHERE user_id = auth.uid();
  SELECT * INTO _d FROM public.deliveries WHERE id = _delivery_id;
  IF _d.id IS NULL THEN RAISE EXCEPTION 'Delivery not found'; END IF;
  IF _d.despatcher_id IS DISTINCT FROM _me AND NOT public.is_admin() THEN RAISE EXCEPTION 'Forbidden'; END IF;
  IF NOT (_status = ANY (public.delivery_next_states(_d.status))) THEN
    RAISE EXCEPTION 'Cannot move delivery from % to %', _d.status, _status;
  END IF;

  UPDATE public.deliveries SET status = _status,
    picked_up_at = CASE WHEN _status = 'picked_up' THEN now() ELSE picked_up_at END,
    delivered_at = CASE WHEN _status = 'delivered' THEN now() ELSE delivered_at END,
    failure_reason = CASE WHEN _status = 'failed' THEN _note ELSE failure_reason END
  WHERE id = _delivery_id;

  SELECT owner_id INTO _owner FROM public.vendors WHERE id = _d.vendor_id;

  IF _status = 'picked_up' THEN
    UPDATE public.vendor_orders SET status = 'dispatched' WHERE id = _d.vendor_order_id AND status NOT IN ('completed','cancelled');
    PERFORM public.notify_user(_owner, 'Order picked up', 'The despatcher collected the order.', 'delivery','delivery',_delivery_id);
  END IF;

  IF _status IN ('delivered','failed') THEN
    UPDATE public.despatchers SET
      active_deliveries = greatest(active_deliveries - 1, 0),
      completed_deliveries = completed_deliveries + CASE WHEN _status = 'delivered' THEN 1 ELSE 0 END,
      availability = CASE WHEN availability IN ('on_delivery','assigned') THEN 'online'::public.despatcher_availability ELSE availability END
      WHERE id = _d.despatcher_id;
  END IF;

  IF _status = 'delivered' THEN
    UPDATE public.vendor_orders SET status = 'completed' WHERE id = _d.vendor_order_id AND status <> 'cancelled';
    PERFORM public.notify_user(_owner, 'Delivery completed', 'The order was delivered to the customer.', 'delivery','delivery',_delivery_id);
  END IF;

  PERFORM public.log_audit('delivery.' || _status::text, 'delivery', _delivery_id, jsonb_build_object('note',_note));
END $$;

CREATE OR REPLACE FUNCTION public.cancel_delivery(_delivery_id uuid, _reason text DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _d public.deliveries;
BEGIN
  SELECT * INTO _d FROM public.deliveries WHERE id = _delivery_id;
  IF _d.id IS NULL THEN RAISE EXCEPTION 'Delivery not found'; END IF;
  IF NOT (public.is_admin() OR public.is_vendor_member(_d.vendor_id)) THEN RAISE EXCEPTION 'Forbidden'; END IF;
  IF _d.status IN ('delivered','cancelled') THEN RAISE EXCEPTION 'This delivery is already closed'; END IF;
  UPDATE public.deliveries SET status = 'cancelled', failure_reason = _reason, despatcher_id = NULL WHERE id = _delivery_id;
  IF _d.despatcher_id IS NOT NULL THEN
    UPDATE public.despatchers SET active_deliveries = greatest(active_deliveries-1,0),
      availability = CASE WHEN availability IN ('on_delivery','assigned') THEN 'online'::public.despatcher_availability ELSE availability END
      WHERE id = _d.despatcher_id;
  END IF;
  PERFORM public.log_audit('delivery.cancelled','delivery',_delivery_id, jsonb_build_object('reason',_reason));
END $$;

-- ===== realtime =====
ALTER TABLE public.deliveries REPLICA IDENTITY FULL;
ALTER TABLE public.notifications REPLICA IDENTITY FULL;
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.deliveries;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.delivery_events;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

REVOKE EXECUTE ON FUNCTION public.assign_delivery(uuid,uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.pick_despatcher(double precision,double precision) FROM anon, authenticated;