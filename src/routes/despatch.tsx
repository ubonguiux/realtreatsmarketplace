import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { Bike, History, LayoutDashboard } from "lucide-react";
import { SiteShell } from "@/components/marketplace/SiteShell";
import { DashboardShell } from "@/components/marketplace/DashboardShell";
import { EmptyState } from "@/components/marketplace/EmptyState";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/despatch")({
  head: () => ({
    meta: [
      { title: "Despatch dashboard — RealTreats Marketplace" },
      { name: "description", content: "Accept delivery jobs, confirm pickups and complete deliveries." },
      { property: "og:title", content: "Despatch dashboard — RealTreats Marketplace" },
      { property: "og:description", content: "Accept delivery jobs and complete deliveries." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: DespatchLayout,
});

const NAV = [
  { to: "/despatch", label: "Jobs", icon: <LayoutDashboard className="h-4 w-4" /> },
  { to: "/despatch/history", label: "History", icon: <History className="h-4 w-4" /> },
  { to: "/despatch/profile", label: "Profile", icon: <Bike className="h-4 w-4" /> },
];

function DespatchLayout() {
  const { user, despatcher, loading } = useAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const onApply = pathname.startsWith("/despatch/apply");

  if (loading) {
    return (
      <SiteShell>
        <div className="mx-auto max-w-7xl px-4 py-8">
          <Skeleton className="h-64 w-full" />
        </div>
      </SiteShell>
    );
  }

  if (!user) {
    return (
      <SiteShell>
        <div className="mx-auto w-full max-w-3xl px-4 py-16">
          <EmptyState
            title="Sign in to continue"
            description="You need an account to deliver on RealTreats Marketplace."
            action={
              <Button asChild>
                <Link to="/auth" search={{ redirect: "/despatch" }}>Sign in</Link>
              </Button>
            }
          />
        </div>
      </SiteShell>
    );
  }

  if (onApply) {
    return (
      <SiteShell>
        <Outlet />
      </SiteShell>
    );
  }

  if (!despatcher) {
    return (
      <SiteShell>
        <div className="mx-auto w-full max-w-3xl px-4 py-16">
          <EmptyState
            title="Become a despatcher"
            description="Apply to deliver orders for vendors on the marketplace. Approval is handled by the marketplace team."
            action={
              <Button asChild>
                <Link to="/despatch/apply">Start application</Link>
              </Button>
            }
          />
        </div>
      </SiteShell>
    );
  }

  if (despatcher.status !== "approved") {
    return (
      <SiteShell>
        <div className="mx-auto w-full max-w-3xl px-4 py-16">
          <EmptyState
            title={despatcher.status === "pending" ? "Application under review" : `Account ${despatcher.status}`}
            description={
              despatcher.rejection_reason ??
              "We'll notify you as soon as the marketplace team reviews your despatcher application."
            }
            action={
              <Button asChild variant="outline">
                <Link to="/">Back to marketplace</Link>
              </Button>
            }
          />
        </div>
      </SiteShell>
    );
  }

  return (
    <SiteShell>
      <DashboardShell title="Despatch" subtitle={despatcher.full_name} nav={NAV}>
        <Outlet />
      </DashboardShell>
    </SiteShell>
  );
}
