import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { SiteShell } from "@/components/marketplace/SiteShell";
import { EmptyState } from "@/components/marketplace/EmptyState";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { formatMoney, titleize } from "@/lib/marketplace";

export const Route = createFileRoute("/orders/$id")({
  head: () => ({
    meta: [
      { title: "Order details — RealTreats Marketplace" },
      { name: "description", content: "Track each vendor shipment and delivery status for your order." },
      { property: "og:title", content: "Order details — RealTreats Marketplace" },
      { property: "og:description", content: "Track each vendor shipment for your order." },
    ],
  }),
  component: OrderPage,
});

function OrderPage() {
  const { id } = Route.useParams();

  const order = useQuery({
    queryKey: ["order", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select(
          "*, vendor_orders(id,status,subtotal,delivery_fee,total,vendors(name,slug)), order_items(id,product_name,quantity,unit_price,line_total,vendor_id), deliveries(id,status,provider,tracking_code,vendor_id)",
        )
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  if (order.isLoading) {
    return (
      <SiteShell>
        <div className="mx-auto w-full max-w-4xl px-4 py-8">
          <Skeleton className="h-64 w-full" />
        </div>
      </SiteShell>
    );
  }

  const o = order.data;
  if (!o) {
    return (
      <SiteShell>
        <div className="mx-auto w-full max-w-3xl px-4 py-16">
          <EmptyState
            title="Order not found"
            action={
              <Button asChild>
                <Link to="/account">Back to account</Link>
              </Button>
            }
          />
        </div>
      </SiteShell>
    );
  }

  const vendorOrders = (o.vendor_orders ?? []) as any[];
  const items = (o.order_items ?? []) as any[];
  const deliveries = (o.deliveries ?? []) as any[];

  return (
    <SiteShell>
      <div className="mx-auto w-full max-w-4xl px-4 py-8">
        <Link to="/account" className="text-xs text-muted-foreground hover:text-foreground">
          ← Back to orders
        </Link>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-xl font-semibold sm:text-2xl">Order {o.order_number ?? o.id.slice(0, 8)}</h1>
            <p className="text-sm text-muted-foreground">Placed {new Date(o.created_at).toLocaleString()}</p>
          </div>
          <Badge>{titleize(o.status)}</Badge>
        </div>

        <div className="surface mt-6 p-5 text-sm">
          <p className="font-semibold">Delivery to</p>
          <p className="mt-1 text-muted-foreground">
            {[o.delivery_address, o.delivery_city, o.delivery_state].filter(Boolean).join(", ")}
          </p>
          {o.contact_phone ? <p className="text-muted-foreground">{o.contact_phone}</p> : null}
        </div>

        <div className="mt-6 space-y-4">
          {vendorOrders.map((vo) => {
            const voItems = items.filter((i) => i.vendor_id === vo.vendors_id || i.vendor_id === vo.vendor_id);
            const delivery = deliveries.find((d) => d.vendor_id === vo.vendor_id);
            return (
              <div key={vo.id} className="surface p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold">{vo.vendors?.name ?? "Vendor"}</p>
                  <Badge variant="secondary">{titleize(vo.status)}</Badge>
                </div>
                <ul className="mt-3 space-y-1 text-sm">
                  {voItems.map((i) => (
                    <li key={i.id} className="flex justify-between gap-3">
                      <span className="truncate text-muted-foreground">
                        {i.quantity} × {i.product_name}
                      </span>
                      <span>{formatMoney(Number(i.line_total))}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-3 flex justify-between border-t border-border pt-2 text-sm">
                  <span className="text-muted-foreground">Delivery fee</span>
                  <span>{formatMoney(Number(vo.delivery_fee ?? 0))}</span>
                </div>
                <div className="flex justify-between text-sm font-semibold">
                  <span>Vendor total</span>
                  <span>{formatMoney(Number(vo.total ?? 0))}</span>
                </div>
                {delivery ? (
                  <p className="mt-3 text-xs text-muted-foreground">
                    Dispatch: {titleize(delivery.status)} · {titleize(delivery.provider ?? "manual")}
                    {delivery.tracking_code ? ` · ${delivery.tracking_code}` : ""}
                  </p>
                ) : null}
              </div>
            );
          })}
        </div>

        <div className="surface mt-6 space-y-1 p-5 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Subtotal</span>
            <span>{formatMoney(Number(o.subtotal ?? 0))}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Delivery</span>
            <span>{formatMoney(Number(o.delivery_total ?? 0))}</span>
          </div>
          <div className="flex justify-between font-semibold">
            <span>Total</span>
            <span>{formatMoney(Number(o.total ?? 0))}</span>
          </div>
        </div>
      </div>
    </SiteShell>
  );
}
