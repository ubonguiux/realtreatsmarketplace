import { supabase } from "@/integrations/supabase/client";
import type { ProductCardData } from "@/components/marketplace/ProductCard";

export type GeoPoint = { lat: number; lng: number };

export type SelectedLocation = GeoPoint & {
  label: string;
  city?: string | null;
  state?: string | null;
  source: "gps" | "manual" | "saved";
};

/** Reference coordinates for major Nigerian cities (used for manual location selection). */
export const CITY_PRESETS: { city: string; state: string; lat: number; lng: number }[] = [
  { city: "Uyo", state: "Akwa Ibom", lat: 5.0377, lng: 7.9128 },
  { city: "Eket", state: "Akwa Ibom", lat: 4.6413, lng: 7.9273 },
  { city: "Calabar", state: "Cross River", lat: 4.9757, lng: 8.3417 },
  { city: "Port Harcourt", state: "Rivers", lat: 4.8156, lng: 7.0498 },
  { city: "Aba", state: "Abia", lat: 5.1167, lng: 7.3667 },
  { city: "Owerri", state: "Imo", lat: 5.4836, lng: 7.0333 },
  { city: "Enugu", state: "Enugu", lat: 6.4402, lng: 7.4943 },
  { city: "Onitsha", state: "Anambra", lat: 6.1667, lng: 6.7833 },
  { city: "Asaba", state: "Delta", lat: 6.2, lng: 6.7333 },
  { city: "Warri", state: "Delta", lat: 5.5167, lng: 5.75 },
  { city: "Benin City", state: "Edo", lat: 6.335, lng: 5.6037 },
  { city: "Lagos", state: "Lagos", lat: 6.5244, lng: 3.3792 },
  { city: "Ikeja", state: "Lagos", lat: 6.6018, lng: 3.3515 },
  { city: "Lekki", state: "Lagos", lat: 6.4698, lng: 3.5852 },
  { city: "Abeokuta", state: "Ogun", lat: 7.1557, lng: 3.3451 },
  { city: "Ibadan", state: "Oyo", lat: 7.3775, lng: 3.947 },
  { city: "Akure", state: "Ondo", lat: 7.25, lng: 5.195 },
  { city: "Ilorin", state: "Kwara", lat: 8.4966, lng: 4.5421 },
  { city: "Abuja", state: "Abuja (FCT)", lat: 9.0765, lng: 7.3986 },
  { city: "Jos", state: "Plateau", lat: 9.8965, lng: 8.8583 },
  { city: "Kaduna", state: "Kaduna", lat: 10.5222, lng: 7.4383 },
  { city: "Kano", state: "Kano", lat: 12.0022, lng: 8.592 },
  { city: "Maiduguri", state: "Borno", lat: 11.8333, lng: 13.15 },
];

export const RADIUS_OPTIONS = [1, 5, 10, 20, 50];

export function nearestCity(point: GeoPoint) {
  let best = CITY_PRESETS[0]!;
  let bestD = Number.POSITIVE_INFINITY;
  for (const c of CITY_PRESETS) {
    const d = (c.lat - point.lat) ** 2 + (c.lng - point.lng) ** 2;
    if (d < bestD) {
      bestD = d;
      best = c;
    }
  }
  return best;
}

export type NearbyProduct = ProductCardData & { distance_km: number | null; vendor_slug: string };

export async function fetchNearbyProducts(args: {
  point: GeoPoint;
  radius: number;
  q?: string | undefined;
  category?: string | undefined;
  sort?: string | undefined;
  limit?: number | undefined;
  offset?: number | undefined;
}): Promise<NearbyProduct[]> {
  const { data, error } = await supabase.rpc("nearby_products", {
    _lat: args.point.lat,
    _lng: args.point.lng,
    _radius: args.radius,
    _limit: args.limit ?? 48,
    _offset: args.offset ?? 0,
    _sort: args.sort ?? "distance",
    ...(args.q ? { _q: args.q } : {}),
    ...(args.category ? { _category: args.category } : {}),
  });
  if (error) throw error;
  return (data ?? []).map((row: Record<string, unknown>) => ({
    id: row["id"] as string,
    name: row["name"] as string,
    price: Number(row["price"]),
    discount_price: row["discount_price"] == null ? null : Number(row["discount_price"]),
    currency: (row["currency"] as string) ?? "NGN",
    image_url: (row["image_url"] as string) ?? null,
    stock_quantity: Number(row["stock_quantity"] ?? 0),
    city: (row["city"] as string) ?? (row["vendor_city"] as string) ?? null,
    vendor_id: row["vendor_id"] as string,
    vendor_slug: row["vendor_slug"] as string,
    distance_km: row["distance_km"] == null ? null : Number(row["distance_km"]),
    distanceKm: row["distance_km"] == null ? null : Number(row["distance_km"]),
    vendors: {
      name: (row["vendor_name"] as string) ?? "Vendor",
      slug: (row["vendor_slug"] as string) ?? "",
      city: (row["vendor_city"] as string) ?? null,
      rating: null,
    },
  }));
}

export async function fetchNearbyVendors(args: { point: GeoPoint; radius: number; q?: string | undefined; limit?: number | undefined }) {
  const { data, error } = await supabase.rpc("nearby_vendors", {
    _lat: args.point.lat,
    _lng: args.point.lng,
    _radius: args.radius,
    _limit: args.limit ?? 48,
    ...(args.q ? { _q: args.q } : {}),
  });
  if (error) throw error;
  return (data ?? []) as Array<Record<string, unknown> & { id: string; name: string; slug: string; distance_km: number | null }>;
}

export function mapsDirectionsUrl(to: { lat?: number | null; lng?: number | null; address?: string | null }) {
  if (to.lat != null && to.lng != null) {
    return `https://www.google.com/maps/dir/?api=1&destination=${to.lat},${to.lng}`;
  }
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(to.address ?? "")}`;
}

export function staticMapEmbed(points: { lat: number; lng: number }[]) {
  if (!points.length) return null;
  const first = points[0]!;
  const delta = 0.05;
  const bbox = [first.lng - delta, first.lat - delta, first.lng + delta, first.lat + delta].join(",");
  const markers = points.map((p) => `${p.lat},${p.lng}`).join("&marker=");
  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${markers}`;
}
