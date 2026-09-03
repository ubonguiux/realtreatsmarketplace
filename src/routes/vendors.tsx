import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { SiteShell } from "@/components/marketplace/SiteShell";
import { VendorCard } from "@/components/marketplace/VendorCard";
import { EmptyState } from "@/components/marketplace/EmptyState";
import { LocationPicker } from "@/components/marketplace/LocationPicker";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchVendors } from "@/lib/queries";
import { NIGERIAN_STATES, haversineKm } from "@/lib/marketplace";
import { fetchNearbyVendorCards } from "@/lib/geo";
import { useLocationContext } from "@/hooks/useLocationContext";

const DISTANCE_OPTIONS = ["any", "1", "5", "10", "25"] as const;

export const Route = createFileRoute("/vendors")({
  head: () => ({
    meta: [
      { title: "Vendor directory — RealTreats Marketplace" },
      { name: "description", content: "Browse approved vendors near you and visit their storefronts on RealTreats Marketplace." },
      { property: "og:title", content: "Vendor directory — RealTreats Marketplace" },
      { property: "og:description", content: "Browse approved vendors near you and visit their storefronts." },
    ],
  }),
  component: VendorsPage,
});

function VendorsPage() {
  const [q, setQ] = useState("");
  const [state, setState] = useState("all");
  const [distance, setDistance] = useState<string>("any");
  const { location } = useLocationContext();
  const point = location ? { lat: location.lat, lng: location.lng } : null;
  const nearbyMode = distance !== "any" && Boolean(point);

  const vendors = useQuery({
    queryKey: ["vendors", q, state],
    enabled: !nearbyMode,
    queryFn: () => fetchVendors({ q: q || undefined, state: state === "all" ? undefined : state }),
  });

  const nearby = useQuery({
    queryKey: ["vendors-nearby", q, point, distance],
    enabled: nearbyMode,
    queryFn: () => fetchNearbyVendorCards({ point: point!, radius: Number(distance), q: q || undefined, limit: 60 }),
  });

  const loading = nearbyMode ? nearby.isLoading : vendors.isLoading;
  const items = nearbyMode
    ? (nearby.data ?? []).filter((v) => state === "all" || v.state === state)
    : (vendors.data ?? [])
        .map((v) => ({ ...v, distanceKm: point ? haversineKm(point, { lat: v.latitude, lng: v.longitude }) : null }))
        .sort((a, b) => {
          if (a.distanceKm == null && b.distanceKm == null) return 0;
          if (a.distanceKm == null) return 1;
          if (b.distanceKm == null) return -1;
          return a.distanceKm - b.distanceKm;
        });

  return (
    <SiteShell>
      <div className="mx-auto w-full max-w-7xl px-4 py-8">
        <h1 className="font-display text-xl font-semibold sm:text-2xl">Vendors</h1>
        <p className="text-sm text-muted-foreground">
          {point ? "Independent stores, nearest to you first." : "Independent stores trading on the marketplace."}
        </p>
        <div className="my-5 flex flex-wrap items-center gap-3">
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search vendors" className="max-w-xs" />
          <Select value={state} onValueChange={setState}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All states</SelectItem>
              {NIGERIAN_STATES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={distance} onValueChange={setDistance}>
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DISTANCE_OPTIONS.map((d) => (
                <SelectItem key={d} value={d}>
                  {d === "any" ? "Any distance" : `Within ${d} km`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <LocationPicker className="border border-border" />
        </div>
        {distance !== "any" && !point ? (
          <EmptyState
            title="Set your location to discover vendors and products near you."
            description="Pick your city or use your current location to filter by distance."
          />
        ) : loading ? (
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-48" />
            ))}
          </div>
        ) : items.length ? (
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {items.map((v) => (
              <VendorCard key={v.id} vendor={v} />
            ))}
          </div>
        ) : (
          <EmptyState title="No vendors found" description="Try a different search, state or a wider radius." />
        )}
      </div>
    </SiteShell>
  );
}
