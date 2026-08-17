import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { SiteShell } from "@/components/marketplace/SiteShell";
import { EmptyState } from "@/components/marketplace/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { formatMoney, titleize } from "@/lib/marketplace";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/account")({
  head: () => ({
    meta: [
      { title: "My account — RealTreats Marketplace" },
      { name: "description", content: "Manage your profile, delivery details and track your marketplace orders." },
      { property: "og:title", content: "My account — RealTreats Marketplace" },
      { property: "og:description", content: "Manage your profile and track your orders." },
    ],
  }),
  component: AccountPage,
});

function AccountPage() {
  const { user, vendor, isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [profile, setProfile] = useState({ full_name: "", phone: "" });

  const profileQuery = useQuery({
    queryKey: ["profile", user?.id],
    enabled: Boolean(user),
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*").eq("id", user!.id).maybeSingle();
      return data;
    },
  });

  useEffect(() => {
    if (profileQuery.data)
      setProfile({ full_name: profileQuery.data.full_name ?? "", phone: profileQuery.data.phone ?? "" });
  }, [profileQuery.data]);

  const orders = useQuery({
    queryKey: ["my-orders", user?.id],
    enabled: Boolean(user),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("id,status,total,created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const save = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("profiles").update(profile).eq("id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Profile updated");
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!user) {
    return (
      <SiteShell>
        <div className="mx-auto w-full max-w-3xl px-4 py-16">
          <EmptyState
            title="Sign in to view your account"
            action={
              <Button asChild>
                <Link to="/auth" search={{ redirect: "/account" }}>
                  Sign in
                </Link>
              </Button>
            }
          />
        </div>
      </SiteShell>
    );
  }

  return (
    <SiteShell>
      <div className="mx-auto w-full max-w-4xl px-4 py-8">
        <h1 className="font-display text-xl font-semibold sm:text-2xl">My account</h1>
        <p className="mb-6 text-sm text-muted-foreground">{user.email}</p>

        <Tabs defaultValue="orders">
          <TabsList>
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="profile">Profile</TabsTrigger>
          </TabsList>

          <TabsContent value="orders" className="mt-5">
            {orders.isLoading ? (
              <Skeleton className="h-40 w-full" />
            ) : orders.data?.length ? (
              <div className="space-y-3">
                {orders.data.map((o) => (
                  <Link
                    key={o.id}
                    to="/orders/$id"
                    params={{ id: o.id }}
                    className="surface flex items-center justify-between gap-3 p-4 transition-colors hover:bg-muted"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">Order {o.id.slice(0, 8)}</p>
                      <p className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleString()}</p>
                    </div>
                    <Badge variant="secondary">{titleize(o.status)}</Badge>
                    <span className="text-sm font-semibold">{formatMoney(Number(o.total ?? 0))}</span>
                  </Link>
                ))}
              </div>
            ) : (
              <EmptyState
                title="No orders yet"
                description="Orders you place will appear here with live delivery status."
                action={
                  <Button asChild>
                    <Link to="/marketplace">Start shopping</Link>
                  </Button>
                }
              />
            )}
          </TabsContent>

          <TabsContent value="profile" className="mt-5">
            <div className="surface max-w-lg space-y-4 p-5">
              <div>
                <Label htmlFor="full_name">Full name</Label>
                <Input
                  id="full_name"
                  className="mt-1.5"
                  value={profile.full_name}
                  onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" className="mt-1.5" value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} />
              </div>
              <Button onClick={() => save.mutate()} disabled={save.isPending}>
                {save.isPending ? "Saving…" : "Save changes"}
              </Button>

              <div className="flex flex-wrap gap-2 border-t border-border pt-4">
                {vendor ? (
                  <Button asChild variant="outline" size="sm">
                    <Link to="/vendor">Vendor dashboard</Link>
                  </Button>
                ) : (
                  <Button asChild variant="outline" size="sm">
                    <Link to="/sell">Become a vendor</Link>
                  </Button>
                )}
                {isAdmin ? (
                  <Button asChild variant="outline" size="sm">
                    <Link to="/admin">Admin console</Link>
                  </Button>
                ) : null}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </SiteShell>
  );
}
