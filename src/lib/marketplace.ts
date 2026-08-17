export const CURRENCY_SYMBOLS: Record<string, string> = { NGN: "₦", USD: "$", GBP: "£", EUR: "€" };

export function formatMoney(value: number | null | undefined, currency = "NGN") {
  const amount = Number(value ?? 0);
  const symbol = CURRENCY_SYMBOLS[currency] ?? "";
  return `${symbol}${amount.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

export function effectivePrice(p: { price: number; discount_price?: number | null }) {
  return p.discount_price && Number(p.discount_price) > 0 ? Number(p.discount_price) : Number(p.price);
}

export function haversineKm(
  a: { lat: number; lng: number },
  b: { lat?: number | null | undefined; lng?: number | null | undefined },
): number | null {
  if (b.lat == null || b.lng == null) return null;
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(s)) * 10) / 10;
}

export const NIGERIAN_STATES = [
  "Abia","Abuja (FCT)","Adamawa","Akwa Ibom","Anambra","Bauchi","Bayelsa","Benue","Borno","Cross River",
  "Delta","Ebonyi","Edo","Ekiti","Enugu","Gombe","Imo","Jigawa","Kaduna","Kano","Katsina","Kebbi","Kogi",
  "Kwara","Lagos","Nasarawa","Niger","Ogun","Ondo","Osun","Oyo","Plateau","Rivers","Sokoto","Taraba","Yobe","Zamfara",
];

export const PRODUCT_STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  pending_approval: "Pending approval",
  approved: "Approved",
  rejected: "Rejected",
  suspended: "Suspended",
  out_of_stock: "Out of stock",
};

export const VENDOR_ORDER_STATUSES = [
  "new","accepted","processing","ready_for_dispatch","dispatched","completed","cancelled",
] as const;

export const DELIVERY_STATUSES = [
  "pending","requested","assigned","en_route","picked_up","in_transit","delivered","failed","cancelled",
] as const;

export function titleize(value: string | null | undefined) {
  if (!value) return "";
  return value.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export const GOOGLE_MAPS_BROWSER_KEY =
  (import.meta.env["VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_BROWSER_KEY"] as string | undefined) ?? "";
export const mapsConfigured = Boolean(GOOGLE_MAPS_BROWSER_KEY);
