import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, MapPin, Sparkles, Store, Truck } from "lucide-react";
import { SiteShell } from "@/components/marketplace/SiteShell";
import { ProductCard, ProductCardSkeleton } from "@/components/marketplace/ProductCard";
import { VendorCard } from "@/components/marketplace/VendorCard";
import { EmptyState } from "@/components/marketplace/EmptyState";
import { Button } from "@/components/ui/button";
import { fetchProducts, fetchVendors } from "@/lib/queries";
import { useCart, useCategories, useSettings, useUserLocation } from "@/hooks/useMarketplace";
import { haversineKm } from "@/lib/marketplace";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "RealTreats Marketplace — Shop trusted local vendors" },
      {
        name: "description",
        content:
          "Browse products from independent vendors near you. Groceries, fashion, electronics and more on RealTreats Marketplace.",
      },
      { property: "og:title", content: "RealTreats Marketplace — Shop trusted local vendors" },
      {
        property: "og:description",
        content: "Browse products from independent vendors near you on RealTreats Marketplace.",
      },
    ],
  }),
  component: Home,
});

function Section({
  title,
  action,
  children,
}: {
  title: string;
  action?: { to: string; label: string };
  children: React.ReactNode;
}) {
  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-8">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="font-display text-lg font-semibold sm:text-xl">{title}</h2>
        {action ? (
          <Button asChild variant="ghost" size="sm">
            <Link to={action.to}>
              {action.label} <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        ) : null}
      </div>
      {children}
    </section>
  );
}

function Home() {
  const { data: settings } = useSettings();
  const { data: categories = [] } = useCategories();
  const { data: location } = useUserLocation();
  const { addItem } = useCart();

  const featuredProducts = useQuery({ queryKey: ["home", "featured"], queryFn: () => fetchProducts({ featured: true, limit: 8 }) });
  const recent = useQuery({ queryKey: ["home", "recent"], queryFn: () => fetchProducts({ limit: 12 }) });
  const vendors = useQuery({ queryKey: ["home", "vendors"], queryFn: () => fetchVendors({ limit: 8 }) });

  const nearby = (recent.data ?? [])
    .map((p) => ({
      ...p,
      distanceKm: location
        ? haversineKm(location, { lat: p.latitude ?? p.vendors?.latitude, lng: p.longitude ?? p.vendors?.longitude })
        : null,
    }))
    .filter((p) => p.distanceKm != null)
    .sort((a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0))
    .slice(0, 8);

  const name = settings?.name ?? "RealTreats Marketplace";

  return (
    <SiteShell>
      <section className="border-b border-border bg-secondary/40">
        <div className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-12 lg:grid-cols-2 lg:items-center lg:py-16">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              <Sparkles className="h-3.5 w-3.5" /> Multi-vendor marketplace
            </span>
            <h1 className="mt-4 font-display text-3xl font-semibold leading-tight sm:text-4xl lg:text-5xl">
              {name}
            </h1>
            <p className="mt-3 max-w-xl text-muted-foreground">
              {settings?.tagline ?? "Discover great products from trusted local vendors."}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link to="/marketplace">Start shopping</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/sell">Sell on {name}</Link>
              </Button>
            </div>
            <dl className="mt-8 grid grid-cols-3 gap-4 text-sm">
              <div>
                <dt className="text-muted-foreground">Vendors</dt>
                <dd className="font-display text-lg font-semibold">{vendors.data?.length ?? 0}+</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Categories</dt>
                <dd className="font-display text-lg font-semibold">{categories.length}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Delivery</dt>
                <dd className="font-display text-lg font-semibold">Nationwide</dd>
              </div>
            </dl>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: Store, title: "Independent storefronts", text: "Every vendor runs their own store, products and orders." },
              { icon: MapPin, title: "Shop near you", text: "Filter products and vendors by distance, city or state." },
              { icon: Truck, title: "Dispatch ready", text: "Delivery tracking built in, provider-agnostic." },
              { icon: Sparkles, title: "Quality checked", text: "Products are reviewed before they hit the catalog." },
            ].map((f) => (
              <div key={f.title} className="surface p-4">
                <f.icon className="h-5 w-5 text-primary" />
                <p className="mt-2 text-sm font-semibold">{f.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">{f.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Section title="Browse categories" action={{ to: "/categories", label: "All categories" }}>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
          {categories.map((c) => (
            <Link
              key={c.id}
              to="/marketplace"
              search={{ category: c.id } as never}
              className="surface flex flex-col items-center gap-2 p-4 text-center transition-colors hover:bg-muted"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                {c.name.charAt(0)}
              </span>
              <span className="text-xs font-medium leading-tight">{c.name}</span>
            </Link>
          ))}
        </div>
      </Section>

      <Section title="Featured products" action={{ to: "/marketplace", label: "See all" }}>
        <ProductGrid
          loading={featuredProducts.isLoading}
          items={featuredProducts.data ?? []}
          empty="No featured products yet."
          onAdd={(p) => addItem.mutate(p)}
        />
      </Section>

      {nearby.length > 0 ? (
        <Section title="Near you" action={{ to: "/nearby", label: "Explore nearby" }}>
          <ProductGrid loading={false} items={nearby} empty="" onAdd={(p) => addItem.mutate(p)} />
        </Section>
      ) : null}

      <Section title="Recently added" action={{ to: "/marketplace", label: "See all" }}>
        <ProductGrid
          loading={recent.isLoading}
          items={recent.data ?? []}
          empty="No products in the catalog yet. Approved vendor products appear here."
          onAdd={(p) => addItem.mutate(p)}
        />
      </Section>

      <Section title="Featured vendors" action={{ to: "/vendors", label: "Vendor directory" }}>
        {vendors.isLoading ? (
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="surface h-48 animate-pulse bg-muted/40" />
            ))}
          </div>
        ) : vendors.data?.length ? (
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {vendors.data.map((v) => (
              <VendorCard key={v.id} vendor={v} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="No approved vendors yet"
            description="Vendors appear here once their applications are approved."
            action={
              <Button asChild size="sm">
                <Link to="/sell">Become a vendor</Link>
              </Button>
            }
          />
        )}
      </Section>
    </SiteShell>
  );
}

export function ProductGrid({
  loading,
  items,
  empty,
  onAdd,
}: {
  loading: boolean;
  items: any[];
  empty: string;
  onAdd: (p: any) => void;
}) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    );
  }
  if (!items.length) {
    return empty ? <EmptyState title={empty} /> : null;
  }
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {items.map((p) => (
        <ProductCard key={p.id} product={p} onAdd={() => onAdd(p)} />
      ))}
    </div>
  );
}
