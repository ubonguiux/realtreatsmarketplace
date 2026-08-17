import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/marketplace/DashboardShell";
import { EmptyState } from "@/components/marketplace/EmptyState";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { titleize } from "@/lib/marketplace";

export const Route = createFileRoute("/admin/vendors")({ component: AdminVendors });

function AdminVendors() {
  const queryClient = useQueryClient();
  const [reason, setReason] = useState<Record<string, string>>({});

  const vendors = useQuery({
    queryKey: ["admin-vendors"],
    queryFn: async () => {
      const { data, error } = await supabase.from("vendors").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const review = useMutation({
    mutationFn: async ({ id, status, why }: { id: string; status: string; why?: string }) => {
      const { error } = await supabase.rpc("review_vendor", { _vendor_id: id, _status: status as never, _reason: why });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Vendor updated");
      queryClient.invalidateQueries({ queryKey: ["admin-vendors"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div>
      <PageHeader title="Vendors" description="Review applications and manage storefront status." />
      {vendors.isLoading ? (
        <Skeleton className="h-48 w-full" />
      ) : vendors.data?.length ? (
        <div className="space-y-3">
          {vendors.data.map((v) => (
            <div key={v.id} className="surface p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{v.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {v.owner_name} · {v.email} · {[v.city, v.state].filter(Boolean).join(", ")}
                  </p>
                </div>
                <Badge variant={v.status === "approved" ? "default" : "secondary"}>{titleize(v.status)}</Badge>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Input
                  placeholder="Reason (for rejection/suspension)"
                  className="max-w-xs"
                  value={reason[v.id] ?? ""}
                  onChange={(e) => setReason({ ...reason, [v.id]: e.target.value })}
                />
                <Button size="sm" onClick={() => review.mutate({ id: v.id, status: "approved" })} disabled={v.status === "approved"}>
                  Approve
                </Button>
                <Button size="sm" variant="outline" onClick={() => review.mutate({ id: v.id, status: "rejected", why: reason[v.id] })}>
                  Reject
                </Button>
                <Button size="sm" variant="ghost" onClick={() => review.mutate({ id: v.id, status: "suspended", why: reason[v.id] })}>
                  Suspend
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState title="No vendor applications yet" />
      )}
    </div>
  );
}
