import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteShell } from "@/components/marketplace/SiteShell";
import { useCategories } from "@/hooks/useMarketplace";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/categories")({
  head: () => ({
    meta: [
      { title: "Categories — RealTreats Marketplace" },
      { name: "description", content: "Shop by category: groceries, fashion, electronics, beauty, home and more." },
      { property: "og:title", content: "Categories — RealTreats Marketplace" },
      { property: "og:description", content: "Shop by category across all marketplace vendors." },
    ],
  }),
  component: CategoriesPage,
});

function CategoriesPage() {
  const { data: categories, isLoading } = useCategories();
  return (
    <SiteShell>
      <div className="mx-auto w-full max-w-7xl px-4 py-8">
        <h1 className="font-display text-xl font-semibold sm:text-2xl">Categories</h1>
        <p className="mb-6 text-sm text-muted-foreground">Explore products organised by category.</p>
        {isLoading ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-28" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {(categories ?? []).map((c) => (
              <Link
                key={c.id}
                to="/marketplace"
                search={{ category: c.id } as never}
                className="surface flex flex-col gap-2 p-5 transition-colors hover:bg-muted"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary">
                  {c.name.charAt(0)}
                </span>
                <span className="text-sm font-semibold">{c.name}</span>
                <span className="text-xs text-muted-foreground">{c.description ?? "Browse products"}</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </SiteShell>
  );
}
