import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { LayoutDashboard, Package, Settings, Store } from "lucide-react";
import { SiteShell } from "@/components/marketplace/SiteShell";
import { DashboardShell } from "@/components/marketplace/DashboardShell";
import { EmptyState } from "@/components/marketplace/EmptyState";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin console — RealTreats Marketplace" },
      { name: "description", content: "Approve vendors and products, and manage marketplace settings." },
      { property: "og:title", content: "Admin console — RealTreats Marketplace" },
      { property: "og:description", content: "Approve vendors and products and manage the marketplace." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminLayout,
});

const NAV = [
  { to: "/admin", label: "Overview", icon: <LayoutDashboard className="h-4 w-4" /> },
  { to: "/admin/vendors", label: "Vendors", icon: <Store className="h-4 w-4" /> },
  { to: "/admin/products", label: "Products", icon: <Package className="h-4 w-4" /> },
  { to: "/admin/settings", label: "Settings", icon: <Settings className="h-4 w-4" /> },
];

function AdminLayout() {
  const { user, isAdmin, loading } = useAuth();

  if (loading) return <SiteShell><div className="mx-auto max-w-7xl px-4 py-8"><Skeleton className="h-64 w-full" /></div></SiteShell>;

  if (!user || !isAdmin) {
    return (
      <SiteShell>
        <div className="mx-auto w-full max-w-3xl px-4 py-16">
          <EmptyState
            title="Admins only"
            description="You need marketplace administrator access to view this area."
            action={
              user ? (
                <Button asChild>
                  <Link to="/">Back home</Link>
                </Button>
              ) : (
                <Button asChild>
                  <Link to="/auth" search={{ redirect: "/admin" }}>
                    Sign in
                  </Link>
                </Button>
              )
            }
          />
        </div>
      </SiteShell>
    );
  }

  return (
    <SiteShell>
      <DashboardShell title="Admin" subtitle="Marketplace control" nav={NAV}>
        <Outlet />
      </DashboardShell>
    </SiteShell>
  );
}
