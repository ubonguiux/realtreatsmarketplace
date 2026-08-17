import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageHeader, StatCard } from "@/components/marketplace/DashboardShell";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { formatMoney, titleize } from "@/lib/marketplace";

export const Route = createFileRoute("/admin/")({ component: AdminOverview });

function AdminOverview() {
  const stats = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [vendors, products, orders, audit] = await Promise.all([
        supabase.from("vendors").select("id,status"),
        supabase.from("products").select("id,status"),
        supabase.from("orders").select("id,total"),
        supabase.from("audit_logs").select("id,action,created_at").order("created_at", { ascending: false }).limit(8),
      ]);
      return {
        vendors: vendors.data ?? [],
        products: products.data ?? [],
        orders: orders.data ?? [],
        audit: audit.data ?? [],
      };
    },
  });

  if (stats.isLoading) return <Skeleton className="h-64 w-full" />;
  const s = stats.data!;

  return (
    <div>
      <PageHeader title="Overview" description="Marketplace health at a glance." />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Vendors" value={s.vendors.length} hint={`${s.vendors.filter((v) => v.status === "pending").length} pending`} />
        <StatCard label="Products" value={s.products.length} hint={`${s.products.filter((p) => p.status === "pending").length} awaiting review`} />
        <StatCard label="Orders" value={s.orders.length} />
        <StatCard label="GMV" value={formatMoney(s.orders.reduce((sum, o) => sum + Number(o.total ?? 0), 0))} />
      </div>

      <h2 className="mb-3 mt-8 font-display text-base font-semibold">Recent activity</h2>
      <div className="space-y-2">
        {s.audit.map((a) => (
          <div key={a.id} className="surface flex items-center justify-between p-3 text-sm">
            <span>{titleize(a.action.replace(/\./g, " "))}</span>
            <span className="text-xs text-muted-foreground">{new Date(a.created_at).toLocaleString()}</span>
          </div>
        ))}
        {!s.audit.length ? <p className="text-sm text-muted-foreground">No activity recorded yet.</p> : null}
      </div>
    </div>
  );
}
