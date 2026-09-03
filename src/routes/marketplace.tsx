import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import { SiteShell } from "@/components/marketplace/SiteShell";
import { ProductGrid } from "./index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { fetchProducts } from "@/lib/queries";
import { LocationPicker } from "@/components/marketplace/LocationPicker";
import { EmptyState } from "@/components/marketplace/EmptyState";
import { useCart, useCategories } from "@/hooks/useMarketplace";
import { useLocationContext } from "@/hooks/useLocationContext";
import { fetchNearbyProducts } from "@/lib/geo";
import { NIGERIAN_STATES, haversineKm } from "@/lib/marketplace";

type Search = { q?: string | undefined; category?: string | undefined; state?: string | undefined; distance?: number | undefined };

export const Route = createFileRoute("/marketplace")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    q: typeof s["q"] === "string" ? s["q"] : undefined,
    category: typeof s["category"] === "string" ? s["category"] : undefined,
    state: typeof s["state"] === "string" ? s["state"] : undefined,
    distance: typeof s["distance"] === "number" ? s["distance"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Marketplace — Shop all approved products" },
      { name: "description", content: "Search and filter thousands of products from independent vendors across Nigeria." },
      { property: "og:title", content: "Marketplace — Shop all approved products" },
      { property: "og:description", content: "Search and filter products from independent vendors." },
    ],
  }),
  component: MarketplacePage,
});

function MarketplacePage() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const { data: categories = [] } = useCategories();
  const { location } = useLocationContext();
  const point = location ? { lat: location.lat, lng: location.lng } : null;
  const { addItem } = useCart();

  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [inStock, setInStock] = useState(false);
  const [sort, setSort] = useState<"newest" | "price_asc" | "price_desc" | "distance">("newest");
  const [distance, setDistance] = useState<string>(search.distance ? String(search.distance) : "any");
  const [showFilters, setShowFilters] = useState(false);

  const nearbyMode = Boolean(point) && (distance !== "any" || sort === "distance");

  const products = useQuery({
    queryKey: ["products", search, minPrice, maxPrice, inStock, sort],
    enabled: !nearbyMode,
    queryFn: () =>
      fetchProducts({
        q: search.q,
        category: search.category,
        state: search.state,
        minPrice: minPrice ? Number(minPrice) : undefined,
        maxPrice: maxPrice ? Number(maxPrice) : undefined,
        inStock,
        sort: sort === "distance" ? "newest" : sort,
        limit: 60,
      }),
  });

  const nearby = useQuery({
    queryKey: ["products-nearby", search, point, distance, sort],
    enabled: nearbyMode,
    queryFn: () =>
      fetchNearbyProducts({
        point: point!,
        radius: distance === "any" ? 50 : Number(distance),
        q: search.q,
        category: search.category,
        sort: sort === "distance" ? "distance" : sort,
        limit: 60,
      }),
  });

  const loading = nearbyMode ? nearby.isLoading : products.isLoading;

  const items: any[] = nearbyMode
    ? (nearby.data ?? [])
        .filter((p) => (minPrice ? Number(p.discount_price || p.price) >= Number(minPrice) : true))
        .filter((p) => (maxPrice ? Number(p.discount_price || p.price) <= Number(maxPrice) : true))
        .filter((p) => (inStock ? p.stock_quantity > 0 : true))
    : (products.data ?? []).map((p) => ({
        ...p,
        distanceKm: point
          ? haversineKm(point, { lat: p.latitude ?? p.vendors?.latitude, lng: p.longitude ?? p.vendors?.longitude })
          : null,
      }));

  const setSearch = (patch: Partial<Search>) => navigate({ search: (prev) => ({ ...prev, ...patch }) as never });

  const filters = (
    <div className="space-y-5">
      <div>
        <Label className="text-xs uppercase tracking-wide text-muted-foreground">Category</Label>
        <Select value={search.category ?? "all"} onValueChange={(v) => setSearch({ category: v === "all" ? undefined : v })}>
          <SelectTrigger className="mt-1.5">
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label className="text-xs uppercase tracking-wide text-muted-foreground">State</Label>
        <Select value={search.state ?? "all"} onValueChange={(v) => setSearch({ state: v === "all" ? undefined : v })}>
          <SelectTrigger className="mt-1.5">
            <SelectValue placeholder="Anywhere" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Anywhere</SelectItem>
            {NIGERIAN_STATES.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label className="text-xs uppercase tracking-wide text-muted-foreground">Distance</Label>
        <Select value={distance} onValueChange={setDistance}>
          <SelectTrigger className="mt-1.5">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="any">Any distance</SelectItem>
            <SelectItem value="1">Within 1 km</SelectItem>
            <SelectItem value="5">Within 5 km</SelectItem>
            <SelectItem value="10">Within 10 km</SelectItem>
            <SelectItem value="25">Within 25 km</SelectItem>
          </SelectContent>
        </Select>
        <div className="mt-2">
          <LocationPicker className="border border-border" />
        </div>
        {!location ? (
          <p className="mt-1 text-xs text-muted-foreground">Set your location to discover vendors and products near you.</p>
        ) : null}
      </div>
      <div>
        <Label className="text-xs uppercase tracking-wide text-muted-foreground">Price range</Label>
        <div className="mt-1.5 flex items-center gap-2">
          <Input value={minPrice} onChange={(e) => setMinPrice(e.target.value)} placeholder="Min" inputMode="numeric" />
          <span className="text-muted-foreground">–</span>
          <Input value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} placeholder="Max" inputMode="numeric" />
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <Checkbox checked={inStock} onCheckedChange={(v) => setInStock(Boolean(v))} /> In stock only
      </label>
    </div>
  );

  return (
    <SiteShell>
      <div className="mx-auto w-full max-w-7xl px-4 py-6">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-display text-xl font-semibold sm:text-2xl">
              {search.q ? `Results for "${search.q}"` : "Marketplace"}
            </h1>
            <p className="text-sm text-muted-foreground">{items.length} products available</p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={sort} onValueChange={(v) => setSort(v as typeof sort)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest</SelectItem>
                <SelectItem value="price_asc">Price: low to high</SelectItem>
                <SelectItem value="price_desc">Price: high to low</SelectItem>
                <SelectItem value="distance">Nearest first</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" className="lg:hidden" onClick={() => setShowFilters((v) => !v)}>
              <SlidersHorizontal className="mr-2 h-4 w-4" /> Filters
            </Button>
          </div>
        </div>

        <div className="gap-6 lg:flex">
          <aside className={`${showFilters ? "block" : "hidden"} surface mb-4 p-4 lg:mb-0 lg:block lg:w-64 lg:shrink-0`}>{filters}</aside>
          <div className="min-w-0 flex-1">
            {(distance !== "any" || sort === "distance") && !point ? (
              <EmptyState
                title="Set your location to discover vendors and products near you."
                description="Pick your city or use your current location to filter and sort by distance."
              />
            ) : (
              <ProductGrid
                loading={loading}
                items={items}
                empty="No products match your filters."
                onAdd={(p) => addItem.mutate(p)}
              />
            )}
          </div>
        </div>
      </div>
    </SiteShell>
  );
}
