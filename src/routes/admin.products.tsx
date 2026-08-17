import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/marketplace/DashboardShell";
import { EmptyState } from "@/components/marketplace/EmptyState";
import { StoredImage } from "@/components/marketplace/StoredImage";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { formatMoney, titleize } from "@/lib/marketplace";

export const Route = createFileRoute("/admin/products")({ component: AdminProducts });

function AdminProducts() {
  const queryClient = useQueryClient();
  const [reason, setReason] = useState<Record<string, string>>({});

  const products = useQuery({
    queryKey: ["admin-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*, vendors(name)")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data ?? [];
    },
  });

  const review = useMutation({
    mutationFn: async ({ id, status, why }: { id: string; status: string; why?: string | undefined }) => {
      const { error } = await supabase.rpc("review_product", { _product_id: id, _status: status as never, _reason: why ?? "" });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Product updated");
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div>
      <PageHeader title="Products" description="Approve or reject products submitted by vendors." />
      {products.isLoading ? (
        <Skeleton className="h-48 w-full" />
      ) : products.data?.length ? (
        <div className="space-y-3">
          {products.data.map((p: any) => (
            <div key={p.id} className="surface flex flex-wrap items-center gap-4 p-4">
              <div className="h-14 w-14 overflow-hidden rounded-md bg-muted">
                <StoredImage path={p.image_url} alt="" className="h-full w-full object-cover" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{p.name}</p>
                <p className="text-xs text-muted-foreground">
                  {p.vendors?.name} · {formatMoney(Number(p.price), p.currency ?? "NGN")}
                </p>
              </div>
              <Badge variant={p.status === "approved" ? "default" : "secondary"}>{titleize(p.status)}</Badge>
              <Input
                placeholder="Reason"
                className="max-w-[180px]"
                value={reason[p.id] ?? ""}
                onChange={(e) => setReason({ ...reason, [p.id]: e.target.value })}
              />
              <Button size="sm" onClick={() => review.mutate({ id: p.id, status: "approved" })} disabled={p.status === "approved"}>
                Approve
              </Button>
              <Button size="sm" variant="outline" onClick={() => review.mutate({ id: p.id, status: "rejected", why: reason[p.id] })}>
                Reject
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState title="No products submitted yet" />
      )}
    </div>
  );
}
