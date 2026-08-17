import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { MapPin, Store } from "lucide-react";
import { SiteShell } from "@/components/marketplace/SiteShell";
import { StoredImage } from "@/components/marketplace/StoredImage";
import { EmptyState } from "@/components/marketplace/EmptyState";
import { ProductGrid } from "./index";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { fetchProducts } from "@/lib/queries";
import { useCart } from "@/hooks/useMarketplace";

export const Route = createFileRoute("/store/$slug")({
  head: () => ({
    meta: [
      { title: "Vendor storefront — RealTreats Marketplace" },
      { name: "description", content: "Browse everything this vendor sells, with location and delivery details." },
      { property: "og:title", content: "Vendor storefront — RealTreats Marketplace" },
      { property: "og:description", content: "Browse everything this vendor sells." },
    ],
  }),
  component: StorePage,
});

function StorePage() {
  const { slug } = Route.useParams();
  const { addItem } = useCart();

  const vendor = useQuery({
    queryKey: ["store", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vendors")
        .select("*, vendor_settings(delivery_fee,min_order_amount,accepts_delivery)")
        .eq("slug", slug)
        .eq("status", "approved")
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const products = useQuery({
    queryKey: ["store-products", vendor.data?.id],
    enabled: Boolean(vendor.data?.id),
    queryFn: () => fetchProducts({ vendor: vendor.data!.id, limit: 60 }),
  });

  if (vendor.isLoading) {
    return (
      <SiteShell>
        <div className="mx-auto w-full max-w-7xl px-4 py-8">
          <Skeleton className="h-44 w-full" />
        </div>
      </SiteShell>
    );
  }

  const v = vendor.data;
  if (!v) {
    return (
      <SiteShell>
        <div className="mx-auto w-full max-w-3xl px-4 py-16">
          <EmptyState
            title="Store not found"
            description="This storefront doesn't exist or is not approved yet."
            action={
              <Button asChild>
                <Link to="/vendors">Browse vendors</Link>
              </Button>
            }
          />
        </div>
      </SiteShell>
    );
  }

  const vs = (v as unknown as { vendor_settings?: { delivery_fee?: number; accepts_delivery?: boolean } | { delivery_fee?: number; accepts_delivery?: boolean }[] | null }).vendor_settings;
  const settings = Array.isArray(vs) ? vs[0] : vs;

  return (
    <SiteShell>
      <div className="relative h-40 w-full overflow-hidden bg-secondary sm:h-56">
        {v.storefront_image_url ? (
          <StoredImage path={v.storefront_image_url} alt="" className="h-full w-full object-cover" />
        ) : null}
      </div>
      <div className="mx-auto w-full max-w-7xl px-4">
        <div className="surface -mt-10 flex flex-wrap items-center gap-4 p-5">
          <span className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-xl bg-primary/10">
            {v.logo_url ? (
              <StoredImage path={v.logo_url} alt="" className="h-full w-full object-cover" />
            ) : (
              <Store className="h-7 w-7 text-primary" />
            )}
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="font-display text-xl font-semibold sm:text-2xl">{v.name}</h1>
            <p className="flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="h-3.5 w-3.5" />
              {[v.city, v.state].filter(Boolean).join(", ") || "Location not set"}
            </p>
          </div>
          <div className="text-right text-xs text-muted-foreground">
            {settings?.accepts_delivery ? <p>Delivery available</p> : <p>Pickup only</p>}
          </div>
        </div>
        {v.description ? <p className="mt-4 max-w-3xl text-sm text-muted-foreground">{v.description}</p> : null}

        <div className="py-8">
          <h2 className="mb-4 font-display text-lg font-semibold">Products</h2>
          <ProductGrid
            loading={products.isLoading}
            items={products.data ?? []}
            empty="This vendor has no approved products yet."
            onAdd={(p) => addItem.mutate(p)}
          />
        </div>
      </div>
    </SiteShell>
  );
}
