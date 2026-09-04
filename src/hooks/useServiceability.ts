import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { GeoPoint } from "@/lib/geo";

export type Serviceability = {
  vendor_id: string;
  vendor_name: string;
  has_location: boolean;
  distance_km: number | null;
  radius_km: number;
  accepts_delivery: boolean;
  serviceable: boolean;
};

/** Per-vendor delivery serviceability for a customer delivery point. Uses existing vendor coords + delivery radius. */
export function useServiceability(vendorIds: string[], point: GeoPoint | null | undefined) {
  const ids = Array.from(new Set(vendorIds)).sort();
  return useQuery({
    queryKey: ["serviceability", ids, point?.lat ?? null, point?.lng ?? null],
    enabled: ids.length > 0 && point != null,
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("vendor_serviceability", {
        _vendor_ids: ids,
        _lat: point!.lat,
        _lng: point!.lng,
      });
      if (error) throw error;
      const map: Record<string, Serviceability> = {};
      for (const row of (data ?? []) as Record<string, unknown>[]) {
        const id = row["vendor_id"] as string;
        map[id] = {
          vendor_id: id,
          vendor_name: (row["vendor_name"] as string) ?? "Vendor",
          has_location: Boolean(row["has_location"]),
          distance_km: row["distance_km"] == null ? null : Number(row["distance_km"]),
          radius_km: Number(row["radius_km"] ?? 0),
          accepts_delivery: Boolean(row["accepts_delivery"]),
          serviceable: Boolean(row["serviceable"]),
        };
      }
      return map;
    },
  });
}
