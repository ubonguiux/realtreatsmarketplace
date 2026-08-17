import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { SiteShell } from "@/components/marketplace/SiteShell";
import { VendorCard } from "@/components/marketplace/VendorCard";
import { EmptyState } from "@/components/marketplace/EmptyState";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchVendors } from "@/lib/queries";
import { NIGERIAN_STATES, haversineKm } from "@/lib/marketplace";
import { useUserLocation } from "@/hooks/useMarketplace";

export const Route = createFileRoute("/vendors")({
  head: () => ({
    meta: [
      { title: "Vendor directory — RealTreats Marketplace" },
      { name: "description", content: "Browse approved vendors and visit their storefronts on RealTreats Marketplace." },
      { property: "og:title", content: "Vendor directory — RealTreats Marketplace" },
      { property: "og:description", content: "Browse approved vendors and visit their storefronts." },
    ],
  }),
  component: VendorsPage,
});

function VendorsPage() {
  const [q, setQ] = useState("");
  const [state, setState] = useState("all");
  const { data: location } = useUserLocation();
  const vendors = useQuery({ queryKey: ["vendors", q, state], queryFn: () => fetchVendors({ q: q || undefined, state: state === "all" ? undefined : state }) });

  const items = (vendors.data ?? []).map((v) => ({
    ...v,
    distanceKm: location ? haversineKm(location, { lat: v.latitude, lng: v.longitude }) : null,
  }));

  return (
    <SiteShell>
      <div className="mx-auto w-full max-w-7xl px-4 py-8">
        <h1 className="font-display text-xl font-semibold sm:text-2xl">Vendors</h1>
        <p className="text-sm text-muted-foreground">Independent stores trading on the marketplace.</p>
        <div className="my-5 flex flex-wrap gap-3">
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
        </div>
        {vendors.isLoading ? (
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
          <EmptyState title="No vendors found" description="Try a different search or state filter." />
        )}
      </div>
    </SiteShell>
  );
}
