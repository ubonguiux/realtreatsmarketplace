import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { PageHeader } from "@/components/marketplace/DashboardShell";
import { EmptyState } from "@/components/marketplace/EmptyState";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { VENDOR_ORDER_STATUSES, formatMoney, titleize } from "@/lib/marketplace";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/vendor/orders")({ component: VendorOrders });

function VendorOrders() {
  const { vendor } = useAuth();
  const queryClient = useQueryClient();

  const orders = useQuery({
    queryKey: ["vendor-orders", vendor?.id],
    enabled: Boolean(vendor),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vendor_orders")
        .select("*, order_items(id,product_name,quantity,line_total), orders(delivery_address,delivery_city,delivery_state,contact_phone)")
        .eq("vendor_id", vendor!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const setStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("vendor_orders").update({ status: status as never }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Order updated");
      queryClient.invalidateQueries({ queryKey: ["vendor-orders"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div>
      <PageHeader title="Orders" description="Fulfil orders and keep customers updated." />
      {orders.isLoading ? (
        <Skeleton className="h-48 w-full" />
      ) : orders.data?.length ? (
        <div className="space-y-3">
          {orders.data.map((o: any) => (
            <div key={o.id} className="surface p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold">{formatMoney(Number(o.total ?? 0))}</p>
                  <p className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleString()}</p>
                </div>
                <Badge variant="secondary">{titleize(o.status)}</Badge>
                <Select value={o.status} onValueChange={(v) => setStatus.mutate({ id: o.id, status: v })}>
                  <SelectTrigger className="w-44">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {VENDOR_ORDER_STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {titleize(s)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
                {(o.order_items ?? []).map((i: any) => (
                  <li key={i.id}>
                    {i.quantity} × {i.product_name} — {formatMoney(Number(i.line_total))}
                  </li>
                ))}
              </ul>
              {o.orders ? (
                <p className="mt-2 text-xs text-muted-foreground">
                  Deliver to {[o.orders.delivery_address, o.orders.delivery_city, o.orders.delivery_state].filter(Boolean).join(", ")}
                  {o.orders.contact_phone ? ` · ${o.orders.contact_phone}` : ""}
                </p>
              ) : null}
            </div>
          ))}
        </div>
      ) : (
        <EmptyState title="No orders yet" description="Orders from customers will appear here." />
      )}
    </div>
  );
}
