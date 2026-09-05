import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { PageHeader } from "@/components/marketplace/DashboardShell";
import { EmptyState } from "@/components/marketplace/EmptyState";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { formatMoney } from "@/lib/marketplace";
import { PAYMENT_STATUS_LABELS, statusTone } from "@/lib/payments";

export const Route = createFileRoute("/admin/payments")({ component: AdminPayments });

const FILTERS = [
  { key: "declared", label: "Awaiting confirmation", statuses: ["pending", "initiated"] },
  { key: "successful", label: "Confirmed", statuses: ["successful"] },
  { key: "failed", label: "Declined / failed", statuses: ["failed", "abandoned", "reversed"] },
];

function AdminPayments() {
  const [filter, setFilter] = useState("declared");
  const [reason, setReason] = useState<Record<string, string>>({});
  const queryClient = useQueryClient();

  const payments = useQuery({
    queryKey: ["admin-payments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payments")
        .select(
          "id,reference,status,amount,currency,gateway,purpose,payer_name,payer_bank,transfer_note,declared_at,failure_reason,created_at,order_id,orders(reference,total,contact_phone,vendor_orders(id,vendors(name)))",
        )
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (data ?? []) as any[];
    },
  });

  useEffect(() => {
    const channel = supabase
      .channel("admin-payments")
      .on("postgres_changes", { event: "*", schema: "public", table: "payments" }, () =>
        queryClient.invalidateQueries({ queryKey: ["admin-payments"] }),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const review = useMutation({
    mutationFn: async ({ id, approve, note }: { id: string; approve: boolean; note?: string }) => {
      const { error } = await supabase.rpc("admin_review_payment", {
        _payment_id: id,
        _approve: approve,
        ...(note ? { _reason: note } : {}),
      });
      if (error) throw error;
    },
    onSuccess: (_d, v) => {
      toast.success(v.approve ? "Payment confirmed — vendors notified" : "Payment declined");
      queryClient.invalidateQueries({ queryKey: ["admin-payments"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const counts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const f of FILTERS) map[f.key] = (payments.data ?? []).filter((p) => f.statuses.includes(p.status)).length;
    return map;
  }, [payments.data]);

  const rows = (payments.data ?? []).filter(
    (p) => FILTERS.find((f) => f.key === filter)?.statuses.includes(p.status) ?? true,
  );

  return (
    <div>
      <PageHeader title="Payments" description="Confirm or decline customer bank transfers into the RealTreats account." />

      <div className="-mx-4 mb-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
        {FILTERS.map((f) => (
          <Button key={f.key} size="sm" variant={filter === f.key ? "default" : "outline"} onClick={() => setFilter(f.key)} className="shrink-0">
            {f.label} <span className="ml-1 text-xs opacity-70">{counts[f.key] ?? 0}</span>
          </Button>
        ))}
      </div>

      {payments.isLoading ? (
        <Skeleton className="h-48 w-full" />
      ) : rows.length ? (
        <div className="space-y-3">
          {rows.map((p) => {
            const vendors = (p.orders?.vendor_orders ?? [])
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              .map((vo: any) => vo.vendors?.name)
              .filter(Boolean)
              .join(", ");
            const pending = ["pending", "initiated"].includes(p.status);
            return (
              <div key={p.id} className="surface p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">{p.reference}</p>
                    <p className="text-xs text-muted-foreground">
                      {p.orders?.reference ? `Order ${p.orders.reference} · ` : ""}
                      {vendors || "No vendor"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-display text-lg font-semibold">{formatMoney(Number(p.amount), p.currency)}</p>
                    <Badge variant={statusTone(p.status)}>{PAYMENT_STATUS_LABELS[p.status] ?? p.status}</Badge>
                  </div>
                </div>

                <dl className="mt-3 grid gap-1 text-xs text-muted-foreground sm:grid-cols-2">
                  <div>Sender: {p.payer_name ?? "—"}</div>
                  <div>From bank: {p.payer_bank ?? "—"}</div>
                  <div>Declared: {p.declared_at ? new Date(p.declared_at).toLocaleString() : "—"}</div>
                  <div>Method: {p.gateway === "manual" ? "Bank transfer" : p.gateway}</div>
                  {p.transfer_note ? <div className="sm:col-span-2">Note: {p.transfer_note}</div> : null}
                  {p.failure_reason ? <div className="sm:col-span-2">Reason: {p.failure_reason}</div> : null}
                </dl>

                {pending ? (
                  <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                    <Input
                      placeholder="Reason (only needed when declining)"
                      value={reason[p.id] ?? ""}
                      onChange={(e) => setReason({ ...reason, [p.id]: e.target.value })}
                    />
                    <div className="flex gap-2">
                      <Button
                        className="flex-1"
                        disabled={review.isPending}
                        onClick={() => review.mutate({ id: p.id, approve: true })}
                      >
                        Confirm payment
                      </Button>
                      <Button
                        variant="outline"
                        className="flex-1"
                        disabled={review.isPending}
                        onClick={() => review.mutate({ id: p.id, approve: false, note: reason[p.id] ?? "" })}
                      >
                        Decline
                      </Button>
                    </div>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState title="Nothing here" description="No payments match this filter." />
      )}
    </div>
  );
}
