import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Minus, Plus, ShieldCheck, Store, Truck } from "lucide-react";
import { SiteShell } from "@/components/marketplace/SiteShell";
import { StoredImage } from "@/components/marketplace/StoredImage";
import { EmptyState } from "@/components/marketplace/EmptyState";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { effectivePrice, formatMoney } from "@/lib/marketplace";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useMarketplace";

export const Route = createFileRoute("/product/$id")({
  head: () => ({
    meta: [
      { title: "Product — RealTreats Marketplace" },
      { name: "description", content: "View product details, pricing, stock and vendor information." },
      { property: "og:title", content: "Product — RealTreats Marketplace" },
      { property: "og:description", content: "View product details, pricing and vendor information." },
    ],
  }),
  component: ProductPage,
});

function ProductPage() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const [qty, setQty] = useState(1);

  const product = useQuery({
    queryKey: ["product", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*, vendors(id,name,slug,city,state,logo_url,status), categories(name), product_images(image_url,position)")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const p = product.data;

  if (product.isLoading) {
    return (
      <SiteShell>
        <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-8 lg:grid-cols-2">
          <Skeleton className="aspect-square w-full" />
          <div className="space-y-4">
            <Skeleton className="h-8 w-2/3" />
            <Skeleton className="h-6 w-1/3" />
            <Skeleton className="h-24 w-full" />
          </div>
        </div>
      </SiteShell>
    );
  }

  if (!p) {
    return (
      <SiteShell>
        <div className="mx-auto w-full max-w-3xl px-4 py-16">
          <EmptyState
            title="Product not available"
            description="This product may have been removed or is awaiting approval."
            action={
              <Button asChild>
                <Link to="/marketplace">Back to marketplace</Link>
              </Button>
            }
          />
        </div>
      </SiteShell>
    );
  }

  const price = effectivePrice(p as never);
  const gallery = [p.image_url, ...((p.product_images ?? []) as { image_url: string }[]).map((i) => i.image_url)].filter(
    Boolean,
  ) as string[];
  const outOfStock = (p.stock_quantity ?? 0) <= 0;

  const add = () => {
    if (!user) {
      navigate({ to: "/auth", search: { redirect: `/product/${id}` } });
      return;
    }
    addItem.mutate({ id: p.id, vendor_id: p.vendor_id, price: Number(p.price), discount_price: p.discount_price, quantity: qty });
  };

  return (
    <SiteShell>
      <div className="mx-auto w-full max-w-7xl px-4 py-8">
        <nav className="mb-4 text-xs text-muted-foreground">
          <Link to="/marketplace" className="hover:text-foreground">
            Marketplace
          </Link>
          <span className="mx-1">/</span>
          <span>{p.categories?.name ?? "Product"}</span>
        </nav>

        <div className="grid gap-8 lg:grid-cols-2">
          <div className="space-y-3">
            <div className="surface aspect-square overflow-hidden">
              <StoredImage path={gallery[0]} alt={p.name} className="h-full w-full object-cover" />
            </div>
            {gallery.length > 1 ? (
              <div className="grid grid-cols-4 gap-2">
                {gallery.slice(0, 8).map((g, i) => (
                  <div key={i} className="surface aspect-square overflow-hidden">
                    <StoredImage path={g} alt="" className="h-full w-full object-cover" />
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              {p.is_featured ? <Badge>Featured</Badge> : null}
              <Badge variant={outOfStock ? "destructive" : "secondary"}>{outOfStock ? "Out of stock" : "In stock"}</Badge>
            </div>
            <h1 className="mt-3 font-display text-2xl font-semibold sm:text-3xl">{p.name}</h1>
            <div className="mt-3 flex items-baseline gap-3">
              <span className="font-display text-2xl font-semibold text-primary">{formatMoney(price, p.currency ?? "NGN")}</span>
              {p.discount_price && Number(p.discount_price) > 0 ? (
                <span className="text-sm text-muted-foreground line-through">{formatMoney(Number(p.price), p.currency ?? "NGN")}</span>
              ) : null}
            </div>
            <p className="mt-4 whitespace-pre-line text-sm text-muted-foreground">{p.description ?? "No description provided."}</p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <div className="flex items-center rounded-md border border-border">
                <Button variant="ghost" size="icon" onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Decrease quantity">
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="w-10 text-center text-sm font-medium">{qty}</span>
                <Button variant="ghost" size="icon" onClick={() => setQty((q) => q + 1)} aria-label="Increase quantity">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <Button size="lg" onClick={add} disabled={outOfStock || addItem.isPending}>
                {outOfStock ? "Out of stock" : "Add to cart"}
              </Button>
            </div>

            {p.vendors ? (
              <div className="surface mt-6 flex items-center gap-3 p-4">
                <span className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full bg-primary/10">
                  {p.vendors.logo_url ? (
                    <StoredImage path={p.vendors.logo_url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <Store className="h-5 w-5 text-primary" />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{p.vendors.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {[p.vendors.city, p.vendors.state].filter(Boolean).join(", ") || "Location not set"}
                  </p>
                </div>
                <Button asChild size="sm" variant="outline">
                  <Link to="/store/$slug" params={{ slug: p.vendors.slug }}>
                    Visit store
                  </Link>
                </Button>
              </div>
            ) : null}

            <div className="mt-4 grid grid-cols-2 gap-3 text-xs text-muted-foreground">
              <p className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-primary" /> Reviewed before listing
              </p>
              <p className="flex items-center gap-2">
                <Truck className="h-4 w-4 text-primary" /> Delivery arranged per vendor
              </p>
            </div>
          </div>
        </div>
      </div>
    </SiteShell>
  );
}
