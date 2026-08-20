import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";
import { SiteShell } from "@/components/marketplace/SiteShell";
import { EmptyState } from "@/components/marketplace/EmptyState";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { formatMoney } from "@/lib/marketplace";
import { GATEWAYS, PAYMENT_STATUS_LABELS, statusTone } from "@/lib/payments";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/payment/$reference")({
  head: () => ({
    meta: [
      { title: "Complete payment — RealTreats Marketplace" },
      { name: "description", content: "Complete payment for your RealTreats Marketplace order." },
      { property: "og:title", content: "Complete payment — RealTreats Marketplace" },
      { property: "og:description", content: "Complete payment for your order." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: PaymentPage,
});

function PaymentPage() {
  const { reference } = Route.useParams();
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  const payment = useQuery({
    queryKey: ["payment", reference],
    enabled: Boolean(user),
    refetchInterval: (query) =>
      ["successful", "failed", "abandoned", "reversed"].includes(
        (query.state.data as { status?: string } | undefined)?.status ?? "",
      )
        ? false
        : 5000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payments")
        .select("*, orders(id,reference,total,currency,status)")
        .eq("reference", reference)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  if (loading || payment.isLoading) {
    return (
      <SiteShell>
        <div className="mx-auto w-full max-w-2xl px-4 py-10">
          <Skeleton className="h-64 w-full" />
        </div>
      </SiteShell>
    );
  }

  if (!user) {
    return (
      <SiteShell>
        <div className="mx-auto w-full max-w-2xl px-4 py-16">
          <EmptyState
            title="Sign in to continue"
            action={
              <Button asChild>
                <Link to="/auth">Sign in</Link>
              </Button>
            }
          />
        </div>
      </SiteShell>
    );
  }

  const p = payment.data;
  if (!p) {
    return (
      <SiteShell>
        <div className="mx-auto w-full max-w-2xl px-4 py-16">
          <EmptyState title="Payment not found" description="This payment reference is not available on your account." />
        </div>
      </SiteShell>
    );
  }

  const gateway = GATEWAYS.find((g) => g.id === p.gateway);
  const done = p.status === "successful";

  return (
    <SiteShell>
      <div className="mx-auto w-full max-w-2xl px-4 py-8">
        <h1 className="font-display text-xl font-semibold sm:text-2xl">Complete your payment</h1>
        <p className="mb-6 text-sm text-muted-foreground">Reference {p.reference}</p>

        <div className="surface space-y-4 p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Amount</span>
            <span className="font-display text-2xl font-semibold">{formatMoney(Number(p.amount), p.currency)}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Method</span>
            <span>{gateway?.label ?? p.gateway}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Status</span>
            <Badge variant={statusTone(p.status)}>{PAYMENT_STATUS_LABELS[p.status] ?? p.status}</Badge>
          </div>

          {done ? (
            <div className="flex items-start gap-3 rounded-md border border-border bg-muted/40 p-4 text-sm">
              <CheckCircle2 className="mt-0.5 h-4 w-4 text-primary" />
              <div>
                <p className="font-medium">Payment confirmed</p>
                <p className="text-muted-foreground">Your vendors have been notified and are preparing your order.</p>
              </div>
            </div>
          ) : p.checkout_url ? (
            <Button asChild size="lg" className="w-full">
              <a href={p.checkout_url} rel="noreferrer">
                Pay {formatMoney(Number(p.amount), p.currency)}
              </a>
            </Button>
          ) : (
            <div className="flex items-start gap-3 rounded-md border border-border bg-muted/40 p-4 text-sm">
              <AlertTriangle className="mt-0.5 h-4 w-4 text-muted-foreground" />
              <div>
                <p className="font-medium">Awaiting gateway activation</p>
                <p className="text-muted-foreground">
                  This payment is recorded and waiting for confirmation. Live card and transfer collection becomes
                  available once RealTreats activates the gateway credentials. Payments are only ever marked successful
                  by our backend after the gateway confirms them.
                </p>
              </div>
            </div>
          )}

          {!done ? (
            <p className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" /> Checking payment status automatically…
            </p>
          ) : null}

          <div className="flex gap-2 pt-2">
            {p.order_id ? (
              <Button
                variant={done ? "default" : "outline"}
                className="flex-1"
                onClick={() => navigate({ to: "/orders/$id", params: { id: p.order_id! } })}
              >
                View order
              </Button>
            ) : null}
            <Button asChild variant="outline" className="flex-1">
              <Link to="/marketplace">Continue shopping</Link>
            </Button>
          </div>
        </div>
      </div>
    </SiteShell>
  );
}