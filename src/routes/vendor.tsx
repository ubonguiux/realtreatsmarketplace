import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { LayoutDashboard, Package, Settings, ShoppingBag } from "lucide-react";
import { SiteShell } from "@/components/marketplace/SiteShell";
import { DashboardShell } from "@/components/marketplace/DashboardShell";
import { EmptyState } from "@/components/marketplace/EmptyState";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/vendor")({
  head: () => ({
    meta: [
      { title: "Vendor dashboard — RealTreats Marketplace" },
      { name: "description", content: "Manage your storefront, products, orders and delivery settings." },
      { property: "og:title", content: "Vendor dashboard — RealTreats Marketplace" },
      { property: "og:description", content: "Manage your storefront, products and orders." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: VendorLayout,
});

const NAV = [
  { to: "/vendor", label: "Overview", icon: <LayoutDashboard className="h-4 w-4" /> },
  { to: "/vendor/products", label: "Products", icon: <Package className="h-4 w-4" /> },
  { to: "/vendor/orders", label: "Orders", icon: <ShoppingBag className="h-4 w-4" /> },
  { to: "/vendor/settings", label: "Store settings", icon: <Settings className="h-4 w-4" /> },
];

function VendorLayout() {
  const { user, vendor, loading } = useAuth();

  if (loading) {
    return (
      <SiteShell>
        <div className="mx-auto w-full max-w-7xl px-4 py-8">
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
            title="Sign in to access your dashboard"
            action={
              <Button asChild>
                <Link to="/auth" search={{ redirect: "/vendor" }}>
                  Sign in
                </Link>
              </Button>
            }
          />
        </div>
      </SiteShell>
    );
  }

  if (!vendor) {
    return (
      <SiteShell>
        <div className="mx-auto w-full max-w-3xl px-4 py-16">
          <EmptyState
            title="No storefront yet"
            description="Submit a vendor application to start selling on the marketplace."
            action={
              <Button asChild>
                <Link to="/sell">Apply to sell</Link>
              </Button>
            }
          />
        </div>
      </SiteShell>
    );
  }

  if (vendor.status !== "approved") {
    return (
      <SiteShell>
        <div className="mx-auto w-full max-w-3xl px-4 py-16">
          <EmptyState
            title={vendor.status === "rejected" ? "Application not approved" : "Application under review"}
            description={
              vendor.status === "rejected"
                ? vendor.rejection_reason ?? "Your vendor application was declined. Contact support for details."
                : "We're reviewing your application. You'll be notified as soon as it's approved."
            }
            action={
              <Button asChild variant="outline">
                <Link to="/marketplace">Browse marketplace</Link>
              </Button>
            }
          />
        </div>
      </SiteShell>
    );
  }

  return (
    <SiteShell>
      <DashboardShell title={vendor.name} subtitle="Vendor dashboard" nav={NAV}>
        <Outlet />
      </DashboardShell>
    </SiteShell>
  );
}
