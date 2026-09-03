import { Link } from "@tanstack/react-router";
import { MapPin, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StoredImage } from "./StoredImage";
import { formatMoney, effectivePrice } from "@/lib/marketplace";
import { formatDistance } from "@/lib/geo";

export type ProductCardData = {
  id: string;
  name: string;
  price: number;
  discount_price: number | null;
  currency: string;
  image_url: string | null;
  stock_quantity: number;
  city: string | null;
  vendor_id: string;
  vendors?: { name: string; slug: string; city: string | null; rating: number | null } | null;
  distanceKm?: number | null;
};

export function ProductCard({ product, onAdd }: { product: ProductCardData; onAdd?: () => void }) {
  const price = effectivePrice(product);
  const discounted = product.discount_price && Number(product.discount_price) > 0;
  const inStock = product.stock_quantity > 0;

  return (
    <article className="surface group flex h-full flex-col overflow-hidden transition-shadow hover:shadow-md">
      <Link to="/product/$id" params={{ id: product.id }} className="relative block aspect-square overflow-hidden bg-muted">
        <StoredImage path={product.image_url} alt={product.name} className="h-full w-full transition-transform group-hover:scale-105" />
        {discounted ? <Badge className="absolute left-2 top-2 bg-accent text-accent-foreground">Deal</Badge> : null}
        {!inStock ? (
          <Badge variant="secondary" className="absolute right-2 top-2">
            Out of stock
          </Badge>
        ) : null}
      </Link>
      <div className="flex flex-1 flex-col gap-2 p-3">
        <Link to="/product/$id" params={{ id: product.id }} className="line-clamp-2 text-sm font-medium leading-snug">
          {product.name}
        </Link>
        <div className="flex items-baseline gap-2">
          <span className="font-display text-base font-semibold">{formatMoney(price, product.currency)}</span>
          {discounted ? (
            <span className="text-xs text-muted-foreground line-through">{formatMoney(product.price, product.currency)}</span>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          {product.vendors ? (
            <Link to="/store/$slug" params={{ slug: product.vendors.slug }} className="inline-flex items-center gap-1 hover:text-foreground">
              <Store className="h-3.5 w-3.5" /> {product.vendors.name}
            </Link>
          ) : null}
          {product.city || product.vendors?.city ? (
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              {product.city ?? product.vendors?.city}
            </span>
          ) : null}
          {formatDistance(product.distanceKm) ? (
            <span className="font-medium text-primary">{formatDistance(product.distanceKm)}</span>
          ) : null}
        </div>
        <Button size="sm" className="mt-auto w-full" disabled={!inStock} onClick={onAdd}>
          {inStock ? "Add to cart" : "Unavailable"}
        </Button>
      </div>
    </article>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="surface h-full animate-pulse overflow-hidden">
      <div className="aspect-square bg-muted" />
      <div className="space-y-2 p-3">
        <div className="h-4 w-3/4 rounded bg-muted" />
        <div className="h-4 w-1/3 rounded bg-muted" />
        <div className="h-8 w-full rounded bg-muted" />
      </div>
    </div>
  );
}
