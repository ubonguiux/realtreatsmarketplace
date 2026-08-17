import { createFileRoute, Link } from "@tanstack/react-router";
import { Minus, Plus, Trash2 } from "lucide-react";
import { SiteShell } from "@/components/marketplace/SiteShell";
import { StoredImage } from "@/components/marketplace/StoredImage";
import { EmptyState } from "@/components/marketplace/EmptyState";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatMoney } from "@/lib/marketplace";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useMarketplace";

export const Route = createFileRoute("/cart")({
  head: () => ({
    meta: [
      { title: "Your cart — RealTreats Marketplace" },
      { name: "description", content: "Review items from multiple vendors before checking out." },
      { property: "og:title", content: "Your cart — RealTreats Marketplace" },
      { property: "og:description", content: "Review items from multiple vendors before checking out." },
    ],
  }),
  component: CartPage,
});

function CartPage() {
  const { user } = useAuth();
  const { items, subtotal, updateItem, isLoading } = useCart();

  const groups = items.reduce<Record<string, typeof items>>((acc, item) => {
    const key = item.vendor_id as string;
    (acc[key] ||= []).push(item);
    return acc;
  }, {});

  return (
    <SiteShell>
      <div className="mx-auto w-full max-w-5xl px-4 py-8">
        <h1 className="font-display text-xl font-semibold sm:text-2xl">Your cart</h1>
        <p className="mb-6 text-sm text-muted-foreground">Items are grouped by vendor and delivered separately.</p>

        {!user ? (
          <EmptyState
            title="Sign in to view your cart"
            description="Your cart is saved to your account so it follows you across devices."
            action={
              <Button asChild>
                <Link to="/auth" search={{ redirect: "/cart" }}>
                  Sign in
                </Link>
              </Button>
            }
          />
        ) : isLoading ? (
          <Skeleton className="h-48 w-full" />
        ) : !items.length ? (
          <EmptyState
            title="Your cart is empty"
            description="Browse the marketplace and add something you like."
            action={
              <Button asChild>
                <Link to="/marketplace">Start shopping</Link>
              </Button>
            }
          />
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
            <div className="space-y-5">
              {Object.entries(groups).map(([vendorId, group]) => (
                <div key={vendorId} className="surface p-4">
                  <p className="mb-3 text-sm font-semibold">{group[0]?.vendors?.name ?? "Vendor"}</p>
                  <div className="space-y-4">
                    {group.map((item) => (
                      <div key={item.id} className="flex gap-3">
                        <div className="h-20 w-20 shrink-0 overflow-hidden rounded-md bg-muted">
                          <StoredImage path={item.products?.image_url} alt="" className="h-full w-full object-cover" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{item.products?.name ?? "Product"}</p>
                          <p className="text-sm text-primary">{formatMoney(Number(item.unit_price), item.products?.currency ?? "NGN")}</p>
                          <div className="mt-2 flex items-center gap-2">
                            <div className="flex items-center rounded-md border border-border">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                aria-label="Decrease"
                                onClick={() => updateItem.mutate({ id: item.id, quantity: item.quantity - 1 })}
                              >
                                <Minus className="h-3.5 w-3.5" />
                              </Button>
                              <span className="w-8 text-center text-sm">{item.quantity}</span>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                aria-label="Increase"
                                onClick={() => updateItem.mutate({ id: item.id, quantity: item.quantity + 1 })}
                              >
                                <Plus className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground"
                              aria-label="Remove item"
                              onClick={() => updateItem.mutate({ id: item.id, quantity: 0 })}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <p className="text-sm font-semibold">{formatMoney(Number(item.unit_price) * item.quantity)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <aside className="surface h-fit p-4 lg:sticky lg:top-24">
              <p className="font-display text-sm font-semibold">Order summary</p>
              <dl className="mt-3 space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Subtotal</dt>
                  <dd>{formatMoney(subtotal)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Delivery</dt>
                  <dd className="text-muted-foreground">Calculated at checkout</dd>
                </div>
              </dl>
              <Button asChild className="mt-4 w-full" size="lg">
                <Link to="/checkout">Proceed to checkout</Link>
              </Button>
            </aside>
          </div>
        )}
      </div>
    </SiteShell>
  );
}
