
REVOKE EXECUTE ON FUNCTION public.bootstrap_current_user(TEXT,TEXT) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.register_vendor(JSONB) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.review_vendor(UUID, public.vendor_status, TEXT) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.review_product(UUID, public.product_status, TEXT) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.submit_product(UUID) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.checkout(JSONB) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.log_audit(TEXT,TEXT,UUID,JSONB) FROM anon, public, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_user(UUID,TEXT,TEXT,TEXT,TEXT,UUID) FROM anon, public, authenticated;
REVOKE EXECUTE ON FUNCTION public.guard_vendor_status() FROM anon, public, authenticated;
REVOKE EXECUTE ON FUNCTION public.guard_product_status() FROM anon, public, authenticated;
REVOKE EXECUTE ON FUNCTION public.guard_product_insert() FROM anon, public, authenticated;
REVOKE EXECUTE ON FUNCTION public.on_vendor_order_status() FROM anon, public, authenticated;
REVOKE EXECUTE ON FUNCTION public.on_delivery_status() FROM anon, public, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM anon, public, authenticated;
REVOKE EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.owns_cart(UUID) FROM anon, public;

GRANT EXECUTE ON FUNCTION public.bootstrap_current_user(TEXT,TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.register_vendor(JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.review_vendor(UUID, public.vendor_status, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.review_product(UUID, public.product_status, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.submit_product(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.checkout(JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) TO authenticated;
