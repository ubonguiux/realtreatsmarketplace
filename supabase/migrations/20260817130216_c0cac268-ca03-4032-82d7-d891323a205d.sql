
-- ENUMS
CREATE TYPE public.app_role AS ENUM ('super_admin','vendor','customer');
CREATE TYPE public.vendor_status AS ENUM ('pending','approved','rejected','suspended');
CREATE TYPE public.product_status AS ENUM ('draft','pending_approval','approved','rejected','suspended','out_of_stock');
CREATE TYPE public.order_status AS ENUM ('pending','processing','completed','cancelled');
CREATE TYPE public.vendor_order_status AS ENUM ('new','accepted','processing','ready_for_dispatch','dispatched','completed','cancelled');
CREATE TYPE public.delivery_status AS ENUM ('pending','requested','assigned','en_route','picked_up','in_transit','delivered','failed','cancelled');

-- UTIL
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- PROFILES
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  is_demo BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_role(auth.uid(), 'super_admin');
$$;

-- VENDORS
CREATE TABLE public.vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  owner_name TEXT,
  email TEXT,
  phone TEXT,
  description TEXT,
  business_category TEXT,
  registration_number TEXT,
  logo_url TEXT,
  storefront_image_url TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  country TEXT DEFAULT 'Nigeria',
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  status public.vendor_status NOT NULL DEFAULT 'pending',
  rejection_reason TEXT,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  rating NUMERIC(3,2),
  is_demo BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX vendors_status_idx ON public.vendors(status);
CREATE INDEX vendors_city_idx ON public.vendors(city);
CREATE INDEX vendors_owner_idx ON public.vendors(owner_id);

CREATE TABLE public.vendor_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT NOT NULL DEFAULT 'owner',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (vendor_id, user_id)
);
CREATE INDEX vendor_users_user_idx ON public.vendor_users(user_id);

CREATE OR REPLACE FUNCTION public.is_vendor_member(_vendor_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.vendor_users WHERE vendor_id = _vendor_id AND user_id = auth.uid());
$$;

CREATE TABLE public.vendor_settings (
  vendor_id UUID PRIMARY KEY REFERENCES public.vendors(id) ON DELETE CASCADE,
  currency TEXT NOT NULL DEFAULT 'NGN',
  accepts_delivery BOOLEAN NOT NULL DEFAULT true,
  delivery_fee NUMERIC(12,2) NOT NULL DEFAULT 0,
  min_order_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  auto_accept_orders BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.vendor_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  label TEXT NOT NULL DEFAULT 'Main',
  address TEXT,
  city TEXT,
  state TEXT,
  country TEXT DEFAULT 'Nigeria',
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  is_primary BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- CATEGORIES
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  parent_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  icon TEXT,
  description TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- PRODUCTS
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT,
  description TEXT,
  short_description TEXT,
  sku TEXT,
  price NUMERIC(12,2) NOT NULL DEFAULT 0,
  discount_price NUMERIC(12,2),
  currency TEXT NOT NULL DEFAULT 'NGN',
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  subcategory_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  image_url TEXT,
  stock_quantity INT NOT NULL DEFAULT 0,
  min_order_quantity INT NOT NULL DEFAULT 1,
  is_available BOOLEAN NOT NULL DEFAULT true,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  city TEXT,
  state TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  status public.product_status NOT NULL DEFAULT 'draft',
  rejection_reason TEXT,
  is_demo BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX products_vendor_idx ON public.products(vendor_id);
CREATE INDEX products_status_idx ON public.products(status);
CREATE INDEX products_category_idx ON public.products(category_id);
CREATE INDEX products_search_idx ON public.products USING gin (to_tsvector('english', coalesce(name,'') || ' ' || coalesce(description,'') || ' ' || coalesce(sku,'')));

CREATE TABLE public.product_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  change INT NOT NULL,
  reason TEXT,
  resulting_quantity INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.product_approval_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending',
  reviewer_id UUID,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMPTZ
);

-- CART
CREATE TABLE public.carts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id UUID NOT NULL REFERENCES public.carts(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  quantity INT NOT NULL DEFAULT 1,
  unit_price NUMERIC(12,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (cart_id, product_id)
);

CREATE OR REPLACE FUNCTION public.owns_cart(_cart_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.carts WHERE id = _cart_id AND user_id = auth.uid());
$$;

-- ADDRESSES
CREATE TABLE public.customer_addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  label TEXT DEFAULT 'Home',
  recipient_name TEXT,
  phone TEXT,
  address TEXT NOT NULL,
  city TEXT,
  state TEXT,
  country TEXT DEFAULT 'Nigeria',
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ORDERS
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference TEXT NOT NULL UNIQUE DEFAULT ('RT-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,8))),
  customer_id UUID NOT NULL,
  status public.order_status NOT NULL DEFAULT 'pending',
  subtotal NUMERIC(12,2) NOT NULL DEFAULT 0,
  delivery_total NUMERIC(12,2) NOT NULL DEFAULT 0,
  total NUMERIC(12,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'NGN',
  delivery_address TEXT,
  delivery_city TEXT,
  delivery_state TEXT,
  delivery_latitude DOUBLE PRECISION,
  delivery_longitude DOUBLE PRECISION,
  contact_phone TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX orders_customer_idx ON public.orders(customer_id);

CREATE TABLE public.vendor_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL,
  status public.vendor_order_status NOT NULL DEFAULT 'new',
  subtotal NUMERIC(12,2) NOT NULL DEFAULT 0,
  delivery_fee NUMERIC(12,2) NOT NULL DEFAULT 0,
  total NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX vendor_orders_vendor_idx ON public.vendor_orders(vendor_id);
CREATE INDEX vendor_orders_order_idx ON public.vendor_orders(order_id);

CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  vendor_order_id UUID NOT NULL REFERENCES public.vendor_orders(id) ON DELETE CASCADE,
  vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  customer_id UUID NOT NULL,
  product_name TEXT NOT NULL,
  quantity INT NOT NULL,
  unit_price NUMERIC(12,2) NOT NULL,
  line_total NUMERIC(12,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- DELIVERIES
CREATE TABLE public.deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  vendor_order_id UUID NOT NULL REFERENCES public.vendor_orders(id) ON DELETE CASCADE,
  vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL,
  provider TEXT NOT NULL DEFAULT 'manual',
  pickup_address TEXT,
  pickup_latitude DOUBLE PRECISION,
  pickup_longitude DOUBLE PRECISION,
  delivery_address TEXT,
  delivery_latitude DOUBLE PRECISION,
  delivery_longitude DOUBLE PRECISION,
  fee NUMERIC(12,2) NOT NULL DEFAULT 0,
  driver_name TEXT,
  driver_phone TEXT,
  tracking_reference TEXT,
  status public.delivery_status NOT NULL DEFAULT 'pending',
  estimated_delivery_at TIMESTAMPTZ,
  picked_up_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.delivery_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_id UUID NOT NULL REFERENCES public.deliveries(id) ON DELETE CASCADE,
  vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL,
  status public.delivery_status NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- MARKETPLACE SETTINGS
CREATE TABLE public.marketplace_settings (
  id BOOLEAN PRIMARY KEY DEFAULT true CHECK (id),
  name TEXT NOT NULL DEFAULT 'RealTreats Marketplace',
  tagline TEXT DEFAULT 'Discover great products from trusted local vendors',
  description TEXT,
  support_email TEXT,
  support_phone TEXT,
  default_currency TEXT NOT NULL DEFAULT 'NGN',
  default_city TEXT DEFAULT 'Lagos',
  default_state TEXT DEFAULT 'Lagos',
  default_country TEXT DEFAULT 'Nigeria',
  auto_approve_vendors BOOLEAN NOT NULL DEFAULT false,
  auto_approve_products BOOLEAN NOT NULL DEFAULT false,
  marketplace_active BOOLEAN NOT NULL DEFAULT true,
  announcement TEXT,
  dispatch_mode TEXT NOT NULL DEFAULT 'manual',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.marketplace_branding (
  id BOOLEAN PRIMARY KEY DEFAULT true CHECK (id),
  logo_url TEXT,
  favicon_url TEXT,
  primary_color TEXT DEFAULT '#0F7B3E',
  website_url TEXT,
  facebook_url TEXT,
  instagram_url TEXT,
  twitter_url TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- NOTIFICATIONS / FAVOURITES / AUDIT
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  type TEXT NOT NULL DEFAULT 'info',
  entity_type TEXT,
  entity_id UUID,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX notifications_user_idx ON public.notifications(user_id);

CREATE TABLE public.favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  vendor_id UUID REFERENCES public.vendors(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID,
  actor_email TEXT,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- updated_at triggers
CREATE TRIGGER t_profiles_u BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER t_vendors_u BEFORE UPDATE ON public.vendors FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER t_products_u BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER t_orders_u BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER t_vorders_u BEFORE UPDATE ON public.vendor_orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER t_deliveries_u BEFORE UPDATE ON public.deliveries FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- GRANTS
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles, public.user_roles, public.vendors, public.vendor_users,
  public.vendor_settings, public.vendor_locations, public.categories, public.products, public.product_images,
  public.inventory, public.product_approval_requests, public.carts, public.cart_items, public.customer_addresses,
  public.orders, public.vendor_orders, public.order_items, public.deliveries, public.delivery_events,
  public.marketplace_settings, public.marketplace_branding, public.notifications, public.favorites, public.audit_logs
  TO authenticated;
GRANT SELECT ON public.vendors, public.categories, public.products, public.product_images,
  public.marketplace_settings, public.marketplace_branding TO anon;
GRANT ALL ON public.profiles, public.user_roles, public.vendors, public.vendor_users,
  public.vendor_settings, public.vendor_locations, public.categories, public.products, public.product_images,
  public.inventory, public.product_approval_requests, public.carts, public.cart_items, public.customer_addresses,
  public.orders, public.vendor_orders, public.order_items, public.deliveries, public.delivery_events,
  public.marketplace_settings, public.marketplace_branding, public.notifications, public.favorites, public.audit_logs
  TO service_role;
