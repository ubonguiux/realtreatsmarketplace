import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageHeader, StatCard } from "@/components/marketplace/DashboardShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { formatMoney, titleize } from "@/lib/marketplace";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/vendor/")({ component: VendorOverview });

function VendorOverview() {
  const { vendor } = useAuth();

  const stats = useQuery({
    queryKey: ["vendor-stats", vendor?.id],
    enabled: Boolean(vendor),
    queryFn: async () => {
      const [products, orders] = await Promise.all([
        supabase.from("products").select("id,status,stock_quantity").eq("vendor_id", vendor!.id),
        supabase
          .from("vendor_orders")
          .select("id,status,total,created_at")
          .eq("vendor_id", vendor!.id)
          .order("created_at", { ascending: false }),
      ]);
      const p = products.data ?? [];
      const o = orders.data ?? [];
      return {
        products: p.length,
        approved: p.filter((x) => x.status === "approved").length,
        pending: p.filter((x) => x.status === "pending_approval").length,
        lowStock: p.filter((x) => (x.stock_quantity ?? 0) <= 3).length,
        orders: o,
        revenue: o.filter((x) => x.status !== "cancelled").reduce((s, x) => s + Number(x.total ?? 0), 0),
      };
    },
  });

  if (stats.isLoading) return <Skeleton className="h-64 w-full" />;
  const s = stats.data;

  return (
    <div>
      <PageHeader
        title="Overview"
        description="A snapshot of your storefront performance."
        action={
          <Button asChild size="sm">
            <Link to="/vendor/products">Add product</Link>
          </Button>
        }
      />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Products" value={s?.products ?? 0} hint={`${s?.approved ?? 0} live`} />
        <StatCard label="Pending review" value={s?.pending ?? 0} />
        <StatCard label="Orders" value={s?.orders.length ?? 0} />
        <StatCard label="Revenue" value={formatMoney(s?.revenue ?? 0)} />
      </div>

      {s?.lowStock ? (
        <div className="surface mt-5 p-4 text-sm">
          <p className="font-semibold">{s.lowStock} product(s) low on stock</p>
          <p className="text-muted-foreground">Restock soon to avoid missing sales.</p>
        </div>
      ) : null}

      <h2 className="mb-3 mt-8 font-display text-base font-semibold">Recent orders</h2>
      {s?.orders.length ? (
        <div className="space-y-2">
          {s.orders.slice(0, 6).map((o) => (
            <div key={o.id} className="surface flex items-center justify-between gap-3 p-4 text-sm">
              <span className="text-muted-foreground">{new Date(o.created_at).toLocaleString()}</span>
              <Badge variant="secondary">{titleize(o.status)}</Badge>
              <span className="font-semibold">{formatMoney(Number(o.total ?? 0))}</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No orders yet.</p>
      )}
    </div>
  );
}
