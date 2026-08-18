ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'despatcher';
ALTER TYPE public.delivery_status ADD VALUE IF NOT EXISTS 'awaiting_assignment';
ALTER TYPE public.delivery_status ADD VALUE IF NOT EXISTS 'accepted';
ALTER TYPE public.delivery_status ADD VALUE IF NOT EXISTS 'heading_to_pickup';
ALTER TYPE public.delivery_status ADD VALUE IF NOT EXISTS 'arrived_at_pickup';
ALTER TYPE public.delivery_status ADD VALUE IF NOT EXISTS 'near_destination';
ALTER TYPE public.delivery_status ADD VALUE IF NOT EXISTS 'arrived_at_destination';

DO $$ BEGIN
  CREATE TYPE public.despatcher_status AS ENUM ('pending','approved','rejected','suspended');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.despatcher_availability AS ENUM ('offline','online','assigned','on_delivery','busy');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;