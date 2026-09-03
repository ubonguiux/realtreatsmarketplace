import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { MapPin } from "lucide-react";
import { SiteShell } from "@/components/marketplace/SiteShell";
import { ProductGrid } from "./index";
import { VendorCard } from "@/components/marketplace/VendorCard";
import { EmptyState } from "@/components/marketplace/EmptyState";
import { LocationPicker } from "@/components/marketplace/LocationPicker";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { fetchNearbyProducts, fetchNearbyVendorCards, RADIUS_OPTIONS } from "@/lib/geo";
import { mapsConfigured } from "@/lib/marketplace";
import { useCart } from "@/hooks/useMarketplace";
import { useLocationContext } from "@/hooks/useLocationContext";

export const Route = createFileRoute("/nearby")({
  head: () => ({
    meta: [
      { title: "Nearby products and vendors — RealTreats Marketplace" },
      { name: "description", content: "Find products and vendors closest to your saved or current location." },
      { property: "og:title", content: "Nearby products and vendors" },
      { property: "og:description", content: "Find products and vendors closest to you." },
    ],
  }),
  component: NearbyPage,
});

function NearbyPage() {
  const { location, radius, setRadius } = useLocationContext();
  const { addItem } = useCart();
  const point = location ? { lat: location.lat, lng: location.lng } : null;

  const products = useQuery({
    queryKey: ["nearby-products", point, radius],
    enabled: Boolean(point),
    queryFn: () => fetchNearbyProducts({ point: point!, radius, limit: 60, sort: "distance" }),
  });
  const vendors = useQuery({
    queryKey: ["nearby-vendors", point, radius],
    enabled: Boolean(point),
    queryFn: () => fetchNearbyVendorCards({ point: point!, radius, limit: 60 }),
  });

  const nearProducts = products.data ?? [];
  const nearVendors = vendors.data ?? [];

  return (
    <SiteShell>
      <div className="mx-auto w-full max-w-7xl px-4 py-8">
        <h1 className="font-display text-xl font-semibold sm:text-2xl">Near me</h1>
        <p className="text-sm text-muted-foreground">
          {location ? `Showing results around ${location.label}.` : "Set your location to discover vendors and products near you."}
        </p>

        {!mapsConfigured ? (
          <div className="surface mt-4 flex items-start gap-3 p-4 text-sm">
            <MapPin className="mt-0.5 h-4 w-4 text-muted-foreground" />
            <p className="text-muted-foreground">
              Map view is not configured yet. Distance filtering still works using your saved location; an administrator can
              connect a maps provider later from Admin → Integrations.
            </p>
          </div>
        ) : null}

        <div className="my-5 flex flex-wrap items-center gap-2">
          <LocationPicker className="border border-border" />
          {location
            ? RADIUS_OPTIONS.filter((r) => r <= 25).map((r) => (
                <Button key={r} size="sm" variant={radius === r ? "default" : "outline"} onClick={() => setRadius(r)}>
                  Within {r} km
                </Button>
              ))
            : null}
        </div>

        {!location ? (
          <EmptyState
            title="Set your location to discover vendors and products near you."
            description="Use your current location or pick your city — we only ask for GPS permission when you tap it."
          />
        ) : (
          <Tabs defaultValue="products">
            <TabsList>
              <TabsTrigger value="products">Products ({nearProducts.length})</TabsTrigger>
              <TabsTrigger value="vendors">Vendors ({nearVendors.length})</TabsTrigger>
            </TabsList>
            <TabsContent value="products" className="mt-4">
              <ProductGrid
                loading={products.isLoading}
                items={nearProducts}
                empty={`No products within ${radius} km.`}
                onAdd={(p) => addItem.mutate(p)}
              />
            </TabsContent>
            <TabsContent value="vendors" className="mt-4">
              {vendors.isLoading ? (
                <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="surface h-48 animate-pulse bg-muted/40" />
                  ))}
                </div>
              ) : nearVendors.length ? (
                <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                  {nearVendors.map((v) => (
                    <VendorCard key={v.id} vendor={v} />
                  ))}
                </div>
              ) : (
                <EmptyState title={`No vendors within ${radius} km.`} description="Try a wider radius." />
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </SiteShell>
  );
}
