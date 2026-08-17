import { supabase } from "@/integrations/supabase/client";

export const PRODUCT_SELECT =
  "id,name,price,discount_price,currency,image_url,stock_quantity,city,state,latitude,longitude,vendor_id,category_id,is_featured,created_at,vendors!inner(name,slug,city,state,latitude,longitude,rating,status)";

export type ProductFilters = {
  q?: string | undefined;
  category?: string | undefined;
  vendor?: string | undefined;
  city?: string | undefined;
  state?: string | undefined;
  minPrice?: number | undefined;
  maxPrice?: number | undefined;
  featured?: boolean | undefined;
  inStock?: boolean | undefined;
  sort?: "newest" | "price_asc" | "price_desc" | undefined;
  limit?: number | undefined;
};

export async function fetchProducts(filters: ProductFilters = {}) {
  let query = supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .in("status", ["approved", "out_of_stock"])
    .eq("vendors.status", "approved");

  if (filters.q) {
    const term = `%${filters.q}%`;
    query = query.or(`name.ilike.${term},description.ilike.${term},sku.ilike.${term}`);
  }
  if (filters.category) query = query.eq("category_id", filters.category);
  if (filters.vendor) query = query.eq("vendor_id", filters.vendor);
  if (filters.city) query = query.eq("city", filters.city);
  if (filters.state) query = query.eq("state", filters.state);
  if (filters.minPrice != null) query = query.gte("price", filters.minPrice);
  if (filters.maxPrice != null) query = query.lte("price", filters.maxPrice);
  if (filters.featured) query = query.eq("is_featured", true);
  if (filters.inStock) query = query.gt("stock_quantity", 0);

  if (filters.sort === "price_asc") query = query.order("price", { ascending: true });
  else if (filters.sort === "price_desc") query = query.order("price", { ascending: false });
  else query = query.order("created_at", { ascending: false });

  const { data, error } = await query.limit(filters.limit ?? 48);
  if (error) throw error;
  return data ?? [];
}

export async function fetchVendors(filters: { q?: string | undefined; city?: string | undefined; state?: string | undefined; featured?: boolean | undefined; limit?: number | undefined } = {}) {
  let query = supabase
    .from("vendors")
    .select("id,name,slug,city,state,business_category,logo_url,storefront_image_url,is_featured,latitude,longitude,description")
    .eq("status", "approved");
  if (filters.q) query = query.ilike("name", `%${filters.q}%`);
  if (filters.city) query = query.eq("city", filters.city);
  if (filters.state) query = query.eq("state", filters.state);
  if (filters.featured) query = query.eq("is_featured", true);
  const { data, error } = await query.order("is_featured", { ascending: false }).limit(filters.limit ?? 48);
  if (error) throw error;
  return data ?? [];
}
