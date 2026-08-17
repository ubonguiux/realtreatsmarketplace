import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { MapPin } from "lucide-react";
import { SiteShell } from "@/components/marketplace/SiteShell";
import { ProductGrid } from "./index";
import { VendorCard } from "@/components/marketplace/VendorCard";
import { EmptyState } from "@/components/marketplace/EmptyState";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { fetchProducts, fetchVendors } from "@/lib/queries";
import { haversineKm, mapsConfigured } from "@/lib/marketplace";
import { useCart, useUserLocation } from "@/hooks/useMarketplace";

export const Route = createFileRoute("/nearby")({
  head: () => ({
    meta: [
      { title: "Nearby products and vendors — RealTreats Marketplace" },
      { name: "description", content: "Find products and vendors closest to your current location." },
      { property: "og:title", content: "Nearby products and vendors" },
      { property: "og:description", content: "Find products and vendors closest to you." },
    ],
  }),
  component: NearbyPage,
});

function NearbyPage() {
  const { data: location, refetch, isFetching } = useUserLocation();
  const { addItem } = useCart();
  const [radius, setRadius] = useState(10);
  const products = useQuery({ queryKey: ["nearby-products"], queryFn: () => fetchProducts({ limit: 60 }) });
  const vendors = useQuery({ queryKey: ["nearby-vendors"], queryFn: () => fetchVendors({ limit: 60 }) });

  const withDistance = <T extends { latitude?: number | null | undefined; longitude?: number | null | undefined }>(rows: T[]) =>
    rows
      .map((r) => ({ ...r, distanceKm: location ? haversineKm(location, { lat: r.latitude, lng: r.longitude }) : null }))
      .filter((r) => r.distanceKm != null && r.distanceKm <= radius)
      .sort((a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0));

  const nearProducts = withDistance(
    (products.data ?? []).map((p) => ({ ...p, latitude: p.latitude ?? p.vendors?.latitude, longitude: p.longitude ?? p.vendors?.longitude })),
  );
  const nearVendors = withDistance(vendors.data ?? []);

  return (
    <SiteShell>
      <div className="mx-auto w-full max-w-7xl px-4 py-8">
        <h1 className="font-display text-xl font-semibold sm:text-2xl">Near me</h1>
        <p className="text-sm text-muted-foreground">
          {location ? "Showing results closest to your current location." : "Share your location to see what's around you."}
        </p>

        {!mapsConfigured ? (
          <div className="surface mt-4 flex items-start gap-3 p-4 text-sm">
            <MapPin className="mt-0.5 h-4 w-4 text-muted-foreground" />
            <p className="text-muted-foreground">
              Map view is not configured yet. Distance filtering still works using your device location; an administrator can
              connect a maps provider later from Admin → Integrations.
            </p>
          </div>
        ) : null}

        <div className="my-5 flex flex-wrap items-center gap-2">
          {!location ? (
            <Button onClick={() => refetch()} disabled={isFetching}>
              {isFetching ? "Locating…" : "Use my location"}
            </Button>
          ) : null}
          {[5, 10, 25].map((r) => (
            <Button key={r} size="sm" variant={radius === r ? "default" : "outline"} onClick={() => setRadius(r)}>
              Within {r} km
            </Button>
          ))}
        </div>

        {!location ? (
          <EmptyState title="Location required" description="Allow location access in your browser to discover nearby vendors." />
        ) : (
          <Tabs defaultValue="products">
            <TabsList>
              <TabsTrigger value="products">Products ({nearProducts.length})</TabsTrigger>
              <TabsTrigger value="vendors">Vendors ({nearVendors.length})</TabsTrigger>
            </TabsList>
            <TabsContent value="products" className="mt-4">
              <ProductGrid loading={products.isLoading} items={nearProducts} empty="No products within this radius." onAdd={(p) => addItem.mutate(p)} />
            </TabsContent>
            <TabsContent value="vendors" className="mt-4">
              {nearVendors.length ? (
                <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                  {nearVendors.map((v) => (
                    <VendorCard key={v.id} vendor={v} />
                  ))}
                </div>
              ) : (
                <EmptyState title="No vendors within this radius." />
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </SiteShell>
  );
}
