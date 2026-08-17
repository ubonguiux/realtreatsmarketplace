
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_approval_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_branding ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- PROFILES
CREATE POLICY p_profiles_self ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid() OR public.is_admin());
CREATE POLICY p_profiles_ins ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY p_profiles_upd ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid() OR public.is_admin()) WITH CHECK (id = auth.uid() OR public.is_admin());

-- ROLES (read-only from client; writes via security definer functions)
CREATE POLICY p_roles_sel ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_admin());

-- VENDORS
CREATE POLICY p_vendors_public ON public.vendors FOR SELECT USING (status = 'approved');
CREATE POLICY p_vendors_own ON public.vendors FOR SELECT TO authenticated USING (owner_id = auth.uid() OR public.is_vendor_member(id) OR public.is_admin());
CREATE POLICY p_vendors_ins ON public.vendors FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid() AND status = 'pending');
CREATE POLICY p_vendors_upd ON public.vendors FOR UPDATE TO authenticated USING (public.is_vendor_member(id) OR public.is_admin()) WITH CHECK (public.is_vendor_member(id) OR public.is_admin());
CREATE POLICY p_vendors_del ON public.vendors FOR DELETE TO authenticated USING (public.is_admin());

CREATE OR REPLACE FUNCTION public.guard_vendor_status()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only administrators can change vendor status';
  END IF;
  IF NEW.is_featured IS DISTINCT FROM OLD.is_featured AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only administrators can feature vendors';
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER t_vendor_status BEFORE UPDATE ON public.vendors FOR EACH ROW EXECUTE FUNCTION public.guard_vendor_status();

-- VENDOR USERS
CREATE POLICY p_vu_sel ON public.vendor_users FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_vendor_member(vendor_id) OR public.is_admin());
CREATE POLICY p_vu_ins ON public.vendor_users FOR INSERT TO authenticated WITH CHECK (
  public.is_admin() OR (user_id = auth.uid() AND EXISTS (SELECT 1 FROM public.vendors v WHERE v.id = vendor_id AND v.owner_id = auth.uid()))
);
CREATE POLICY p_vu_del ON public.vendor_users FOR DELETE TO authenticated USING (public.is_admin());

-- VENDOR SETTINGS / LOCATIONS
CREATE POLICY p_vs_all ON public.vendor_settings FOR ALL TO authenticated USING (public.is_vendor_member(vendor_id) OR public.is_admin()) WITH CHECK (public.is_vendor_member(vendor_id) OR public.is_admin());
CREATE POLICY p_vl_pub ON public.vendor_locations FOR SELECT USING (EXISTS (SELECT 1 FROM public.vendors v WHERE v.id = vendor_id AND v.status = 'approved'));
CREATE POLICY p_vl_all ON public.vendor_locations FOR ALL TO authenticated USING (public.is_vendor_member(vendor_id) OR public.is_admin()) WITH CHECK (public.is_vendor_member(vendor_id) OR public.is_admin());

-- CATEGORIES
CREATE POLICY p_cat_pub ON public.categories FOR SELECT USING (true);
CREATE POLICY p_cat_admin ON public.categories FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- PRODUCTS
CREATE POLICY p_prod_pub ON public.products FOR SELECT USING (
  status IN ('approved','out_of_stock') AND EXISTS (SELECT 1 FROM public.vendors v WHERE v.id = vendor_id AND v.status = 'approved')
);
CREATE POLICY p_prod_own ON public.products FOR SELECT TO authenticated USING (public.is_vendor_member(vendor_id) OR public.is_admin());
CREATE POLICY p_prod_ins ON public.products FOR INSERT TO authenticated WITH CHECK (public.is_vendor_member(vendor_id) OR public.is_admin());
CREATE POLICY p_prod_upd ON public.products FOR UPDATE TO authenticated USING (public.is_vendor_member(vendor_id) OR public.is_admin()) WITH CHECK (public.is_vendor_member(vendor_id) OR public.is_admin());
CREATE POLICY p_prod_del ON public.products FOR DELETE TO authenticated USING (public.is_vendor_member(vendor_id) OR public.is_admin());

CREATE OR REPLACE FUNCTION public.guard_product_status()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_admin() THEN
    IF NEW.status IS DISTINCT FROM OLD.status AND NEW.status NOT IN ('draft','pending_approval','out_of_stock') THEN
      RAISE EXCEPTION 'Only administrators can set this product status';
    END IF;
    IF NEW.is_featured IS DISTINCT FROM OLD.is_featured THEN
      RAISE EXCEPTION 'Only administrators can feature products';
    END IF;
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER t_product_status BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.guard_product_status();

CREATE OR REPLACE FUNCTION public.guard_product_insert()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_admin() AND NEW.status NOT IN ('draft','pending_approval') THEN
    NEW.status := 'draft';
  END IF;
  IF NOT public.is_admin() THEN NEW.is_featured := false; END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER t_product_insert BEFORE INSERT ON public.products FOR EACH ROW EXECUTE FUNCTION public.guard_product_insert();

-- PRODUCT IMAGES / INVENTORY / APPROVALS
CREATE POLICY p_pi_pub ON public.product_images FOR SELECT USING (EXISTS (SELECT 1 FROM public.products p WHERE p.id = product_id AND p.status IN ('approved','out_of_stock')));
CREATE POLICY p_pi_all ON public.product_images FOR ALL TO authenticated USING (public.is_vendor_member(vendor_id) OR public.is_admin()) WITH CHECK (public.is_vendor_member(vendor_id) OR public.is_admin());
CREATE POLICY p_inv_all ON public.inventory FOR ALL TO authenticated USING (public.is_vendor_member(vendor_id) OR public.is_admin()) WITH CHECK (public.is_vendor_member(vendor_id) OR public.is_admin());
CREATE POLICY p_par_sel ON public.product_approval_requests FOR SELECT TO authenticated USING (public.is_vendor_member(vendor_id) OR public.is_admin());
CREATE POLICY p_par_ins ON public.product_approval_requests FOR INSERT TO authenticated WITH CHECK (public.is_vendor_member(vendor_id) OR public.is_admin());
CREATE POLICY p_par_upd ON public.product_approval_requests FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- CART
CREATE POLICY p_cart_all ON public.carts FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY p_ci_all ON public.cart_items FOR ALL TO authenticated USING (public.owns_cart(cart_id)) WITH CHECK (public.owns_cart(cart_id));

-- ADDRESSES / FAVORITES / NOTIFICATIONS
CREATE POLICY p_addr_all ON public.customer_addresses FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY p_fav_all ON public.favorites FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY p_notif_sel ON public.notifications FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_admin());
CREATE POLICY p_notif_upd ON public.notifications FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ORDERS
CREATE POLICY p_orders_sel ON public.orders FOR SELECT TO authenticated USING (
  customer_id = auth.uid() OR public.is_admin()
  OR EXISTS (SELECT 1 FROM public.vendor_orders vo WHERE vo.order_id = orders.id AND public.is_vendor_member(vo.vendor_id))
);
CREATE POLICY p_orders_upd ON public.orders FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY p_vo_sel ON public.vendor_orders FOR SELECT TO authenticated USING (customer_id = auth.uid() OR public.is_vendor_member(vendor_id) OR public.is_admin());
CREATE POLICY p_vo_upd ON public.vendor_orders FOR UPDATE TO authenticated USING (public.is_vendor_member(vendor_id) OR public.is_admin()) WITH CHECK (public.is_vendor_member(vendor_id) OR public.is_admin());

CREATE POLICY p_oi_sel ON public.order_items FOR SELECT TO authenticated USING (customer_id = auth.uid() OR public.is_vendor_member(vendor_id) OR public.is_admin());

-- DELIVERIES
CREATE POLICY p_del_sel ON public.deliveries FOR SELECT TO authenticated USING (customer_id = auth.uid() OR public.is_vendor_member(vendor_id) OR public.is_admin());
CREATE POLICY p_del_upd ON public.deliveries FOR UPDATE TO authenticated USING (public.is_vendor_member(vendor_id) OR public.is_admin()) WITH CHECK (public.is_vendor_member(vendor_id) OR public.is_admin());
CREATE POLICY p_del_ins ON public.deliveries FOR INSERT TO authenticated WITH CHECK (public.is_vendor_member(vendor_id) OR public.is_admin());
CREATE POLICY p_de_sel ON public.delivery_events FOR SELECT TO authenticated USING (customer_id = auth.uid() OR public.is_vendor_member(vendor_id) OR public.is_admin());
CREATE POLICY p_de_ins ON public.delivery_events FOR INSERT TO authenticated WITH CHECK (public.is_vendor_member(vendor_id) OR public.is_admin());

-- SETTINGS
CREATE POLICY p_ms_pub ON public.marketplace_settings FOR SELECT USING (true);
CREATE POLICY p_ms_admin ON public.marketplace_settings FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY p_mb_pub ON public.marketplace_branding FOR SELECT USING (true);
CREATE POLICY p_mb_admin ON public.marketplace_branding FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- AUDIT
CREATE POLICY p_audit_admin ON public.audit_logs FOR SELECT TO authenticated USING (public.is_admin());

-- HELPERS
CREATE OR REPLACE FUNCTION public.log_audit(_action TEXT, _entity_type TEXT, _entity_id UUID, _metadata JSONB DEFAULT '{}'::jsonb)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.audit_logs (actor_id, actor_email, action, entity_type, entity_id, metadata)
  VALUES (auth.uid(), (SELECT email FROM public.profiles WHERE id = auth.uid()), _action, _entity_type, _entity_id, _metadata);
END; $$;

CREATE OR REPLACE FUNCTION public.notify_user(_user_id UUID, _title TEXT, _body TEXT, _type TEXT DEFAULT 'info', _entity_type TEXT DEFAULT NULL, _entity_id UUID DEFAULT NULL)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.notifications (user_id, title, body, type, entity_type, entity_id)
  VALUES (_user_id, _title, _body, _type, _entity_type, _entity_id);
END; $$;

-- Bootstrap profile + role on first sign-in (called by the app)
CREATE OR REPLACE FUNCTION public.bootstrap_current_user(_full_name TEXT DEFAULT NULL, _phone TEXT DEFAULT NULL)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _uid UUID := auth.uid();
DECLARE _email TEXT := (auth.jwt() ->> 'email');
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  INSERT INTO public.profiles (id, email, full_name, phone)
  VALUES (_uid, _email, _full_name, _phone)
  ON CONFLICT (id) DO UPDATE SET
    email = COALESCE(EXCLUDED.email, public.profiles.email),
    full_name = COALESCE(public.profiles.full_name, EXCLUDED.full_name),
    phone = COALESCE(public.profiles.phone, EXCLUDED.phone);

  IF lower(coalesce(_email,'')) = 'ubonguiux@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (_uid, 'super_admin') ON CONFLICT DO NOTHING;
  END IF;
  INSERT INTO public.user_roles (user_id, role) VALUES (_uid, 'customer') ON CONFLICT DO NOTHING;
END; $$;

-- Vendor registration (creates vendor + membership + settings + role)
CREATE OR REPLACE FUNCTION public.register_vendor(_payload JSONB)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _uid UUID := auth.uid();
DECLARE _vid UUID;
DECLARE _slug TEXT;
DECLARE _auto BOOLEAN;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF EXISTS (SELECT 1 FROM public.vendors WHERE owner_id = _uid) THEN
    RAISE EXCEPTION 'You already have a vendor account';
  END IF;
  _slug := regexp_replace(lower(coalesce(_payload->>'name','store')), '[^a-z0-9]+', '-', 'g');
  _slug := trim(both '-' from _slug) || '-' || substr(replace(gen_random_uuid()::text,'-',''),1,5);
  SELECT auto_approve_vendors INTO _auto FROM public.marketplace_settings WHERE id;

  INSERT INTO public.vendors (owner_id, name, slug, owner_name, email, phone, description, business_category,
    registration_number, logo_url, storefront_image_url, address, city, state, country, latitude, longitude, status)
  VALUES (_uid, _payload->>'name', _slug, _payload->>'owner_name', _payload->>'email', _payload->>'phone',
    _payload->>'description', _payload->>'business_category', _payload->>'registration_number',
    _payload->>'logo_url', _payload->>'storefront_image_url', _payload->>'address', _payload->>'city',
    _payload->>'state', coalesce(_payload->>'country','Nigeria'),
    nullif(_payload->>'latitude','')::double precision, nullif(_payload->>'longitude','')::double precision,
    CASE WHEN coalesce(_auto,false) THEN 'approved'::public.vendor_status ELSE 'pending'::public.vendor_status END)
  RETURNING id INTO _vid;

  INSERT INTO public.vendor_users (vendor_id, user_id, role) VALUES (_vid, _uid, 'owner');
  INSERT INTO public.vendor_settings (vendor_id) VALUES (_vid);
  INSERT INTO public.vendor_locations (vendor_id, address, city, state, country, latitude, longitude)
  VALUES (_vid, _payload->>'address', _payload->>'city', _payload->>'state', coalesce(_payload->>'country','Nigeria'),
    nullif(_payload->>'latitude','')::double precision, nullif(_payload->>'longitude','')::double precision);
  INSERT INTO public.user_roles (user_id, role) VALUES (_uid, 'vendor') ON CONFLICT DO NOTHING;
  PERFORM public.log_audit('vendor.created', 'vendor', _vid, jsonb_build_object('name', _payload->>'name'));
  RETURN _vid;
END; $$;

-- Admin: review vendor
CREATE OR REPLACE FUNCTION public.review_vendor(_vendor_id UUID, _status public.vendor_status, _reason TEXT DEFAULT NULL)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _owner UUID; DECLARE _name TEXT;
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Forbidden'; END IF;
  UPDATE public.vendors SET status = _status, rejection_reason = _reason WHERE id = _vendor_id
  RETURNING owner_id, name INTO _owner, _name;
  PERFORM public.notify_user(_owner, 'Vendor application ' || _status::text,
    'Your store "' || _name || '" is now ' || _status::text || coalesce('. Reason: ' || _reason, ''), 'vendor', 'vendor', _vendor_id);
  PERFORM public.log_audit('vendor.' || _status::text, 'vendor', _vendor_id, jsonb_build_object('reason', _reason));
END; $$;

-- Admin: review product
CREATE OR REPLACE FUNCTION public.review_product(_product_id UUID, _status public.product_status, _reason TEXT DEFAULT NULL)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _vid UUID; DECLARE _owner UUID; DECLARE _name TEXT;
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Forbidden'; END IF;
  UPDATE public.products SET status = _status, rejection_reason = _reason WHERE id = _product_id
  RETURNING vendor_id, name INTO _vid, _name;
  UPDATE public.product_approval_requests SET status = _status::text, reviewer_id = auth.uid(), notes = _reason, reviewed_at = now()
    WHERE product_id = _product_id AND status = 'pending';
  SELECT owner_id INTO _owner FROM public.vendors WHERE id = _vid;
  PERFORM public.notify_user(_owner, 'Product ' || _status::text, '"' || _name || '" is now ' || _status::text || coalesce('. Reason: ' || _reason, ''), 'product', 'product', _product_id);
  PERFORM public.log_audit('product.' || _status::text, 'product', _product_id, jsonb_build_object('reason', _reason));
END; $$;

-- Vendor: submit product for approval
CREATE OR REPLACE FUNCTION public.submit_product(_product_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _vid UUID; DECLARE _auto BOOLEAN;
BEGIN
  SELECT vendor_id INTO _vid FROM public.products WHERE id = _product_id;
  IF _vid IS NULL OR NOT (public.is_vendor_member(_vid) OR public.is_admin()) THEN RAISE EXCEPTION 'Forbidden'; END IF;
  SELECT auto_approve_products INTO _auto FROM public.marketplace_settings WHERE id;
  INSERT INTO public.product_approval_requests (product_id, vendor_id) VALUES (_product_id, _vid);
  IF coalesce(_auto,false) THEN
    UPDATE public.products SET status = 'approved', rejection_reason = NULL WHERE id = _product_id;
    UPDATE public.product_approval_requests SET status = 'approved', reviewed_at = now() WHERE product_id = _product_id AND status = 'pending';
  ELSE
    UPDATE public.products SET status = 'pending_approval', rejection_reason = NULL WHERE id = _product_id;
  END IF;
  PERFORM public.log_audit('product.submitted', 'product', _product_id, '{}'::jsonb);
END; $$;

-- Checkout: turn the cart into a multi-vendor order
CREATE OR REPLACE FUNCTION public.checkout(_address JSONB)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _uid UUID := auth.uid();
DECLARE _cart UUID; DECLARE _order UUID; DECLARE _vo UUID; DECLARE _v RECORD; DECLARE _i RECORD;
DECLARE _subtotal NUMERIC := 0; DECLARE _delivery NUMERIC := 0; DECLARE _vsub NUMERIC; DECLARE _vfee NUMERIC;
DECLARE _owner UUID;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  SELECT id INTO _cart FROM public.carts WHERE user_id = _uid;
  IF _cart IS NULL OR NOT EXISTS (SELECT 1 FROM public.cart_items WHERE cart_id = _cart) THEN
    RAISE EXCEPTION 'Your cart is empty';
  END IF;

  INSERT INTO public.orders (customer_id, delivery_address, delivery_city, delivery_state, delivery_latitude, delivery_longitude, contact_phone, notes)
  VALUES (_uid, _address->>'address', _address->>'city', _address->>'state',
    nullif(_address->>'latitude','')::double precision, nullif(_address->>'longitude','')::double precision,
    _address->>'phone', _address->>'notes')
  RETURNING id INTO _order;

  FOR _v IN SELECT DISTINCT vendor_id FROM public.cart_items WHERE cart_id = _cart LOOP
    SELECT coalesce(delivery_fee,0) INTO _vfee FROM public.vendor_settings WHERE vendor_id = _v.vendor_id;
    _vfee := coalesce(_vfee, 0);
    SELECT coalesce(sum(quantity * unit_price),0) INTO _vsub FROM public.cart_items WHERE cart_id = _cart AND vendor_id = _v.vendor_id;

    INSERT INTO public.vendor_orders (order_id, vendor_id, customer_id, subtotal, delivery_fee, total)
    VALUES (_order, _v.vendor_id, _uid, _vsub, _vfee, _vsub + _vfee) RETURNING id INTO _vo;

    FOR _i IN SELECT ci.*, p.name FROM public.cart_items ci JOIN public.products p ON p.id = ci.product_id
              WHERE ci.cart_id = _cart AND ci.vendor_id = _v.vendor_id LOOP
      INSERT INTO public.order_items (order_id, vendor_order_id, vendor_id, product_id, customer_id, product_name, quantity, unit_price, line_total)
      VALUES (_order, _vo, _v.vendor_id, _i.product_id, _uid, _i.name, _i.quantity, _i.unit_price, _i.quantity * _i.unit_price);
      UPDATE public.products SET stock_quantity = greatest(stock_quantity - _i.quantity, 0) WHERE id = _i.product_id;
      INSERT INTO public.inventory (product_id, vendor_id, change, reason) VALUES (_i.product_id, _v.vendor_id, -_i.quantity, 'order');
    END LOOP;

    INSERT INTO public.deliveries (order_id, vendor_order_id, vendor_id, customer_id, provider, delivery_address,
      delivery_latitude, delivery_longitude, fee, pickup_address)
    SELECT _order, _vo, _v.vendor_id, _uid, coalesce((SELECT dispatch_mode FROM public.marketplace_settings WHERE id),'manual'),
      _address->>'address', nullif(_address->>'latitude','')::double precision, nullif(_address->>'longitude','')::double precision,
      _vfee, v.address FROM public.vendors v WHERE v.id = _v.vendor_id;

    SELECT owner_id INTO _owner FROM public.vendors WHERE id = _v.vendor_id;
    PERFORM public.notify_user(_owner, 'New order received', 'You have a new order to process.', 'order', 'vendor_order', _vo);

    _subtotal := _subtotal + _vsub;
    _delivery := _delivery + _vfee;
  END LOOP;

  UPDATE public.orders SET subtotal = _subtotal, delivery_total = _delivery, total = _subtotal + _delivery WHERE id = _order;
  DELETE FROM public.cart_items WHERE cart_id = _cart;
  PERFORM public.notify_user(_uid, 'Order placed', 'Your order has been placed successfully.', 'order', 'order', _order);
  PERFORM public.log_audit('order.created', 'order', _order, jsonb_build_object('total', _subtotal + _delivery));
  RETURN _order;
END; $$;

-- Vendor order status updates keep customer informed
CREATE OR REPLACE FUNCTION public.on_vendor_order_status()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    PERFORM public.notify_user(NEW.customer_id, 'Order update', 'A vendor updated your order to: ' || replace(NEW.status::text,'_',' '), 'order', 'vendor_order', NEW.id);
    PERFORM public.log_audit('vendor_order.status', 'vendor_order', NEW.id, jsonb_build_object('status', NEW.status));
    UPDATE public.orders o SET status = CASE
      WHEN NOT EXISTS (SELECT 1 FROM public.vendor_orders vo WHERE vo.order_id = o.id AND vo.status NOT IN ('completed','cancelled')) THEN 'completed'::public.order_status
      ELSE 'processing'::public.order_status END
      WHERE o.id = NEW.order_id;
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER t_vo_status AFTER UPDATE ON public.vendor_orders FOR EACH ROW EXECUTE FUNCTION public.on_vendor_order_status();

CREATE OR REPLACE FUNCTION public.on_delivery_status()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO public.delivery_events (delivery_id, vendor_id, customer_id, status) VALUES (NEW.id, NEW.vendor_id, NEW.customer_id, NEW.status);
    PERFORM public.notify_user(NEW.customer_id, 'Delivery update', 'Delivery status: ' || replace(NEW.status::text,'_',' '), 'delivery', 'delivery', NEW.id);
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER t_del_status AFTER UPDATE ON public.deliveries FOR EACH ROW EXECUTE FUNCTION public.on_delivery_status();

-- SEED
INSERT INTO public.marketplace_settings (id) VALUES (true) ON CONFLICT DO NOTHING;
INSERT INTO public.marketplace_branding (id) VALUES (true) ON CONFLICT DO NOTHING;
INSERT INTO public.categories (name, slug, icon, sort_order) VALUES
  ('Food & Groceries','food-groceries','ShoppingBasket',1),
  ('Restaurants & Treats','restaurants-treats','UtensilsCrossed',2),
  ('Fashion','fashion','Shirt',3),
  ('Electronics','electronics','Smartphone',4),
  ('Health & Beauty','health-beauty','Sparkles',5),
  ('Home & Living','home-living','Sofa',6),
  ('Baby & Kids','baby-kids','Baby',7),
  ('Agriculture','agriculture','Wheat',8)
ON CONFLICT (slug) DO NOTHING;
