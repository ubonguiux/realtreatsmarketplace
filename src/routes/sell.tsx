import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { BadgeCheck, LineChart, Truck } from "lucide-react";
import { SiteShell } from "@/components/marketplace/SiteShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { NIGERIAN_STATES } from "@/lib/marketplace";
import { useAuth } from "@/hooks/useAuth";
import { useSettings, useUserLocation } from "@/hooks/useMarketplace";

export const Route = createFileRoute("/sell")({
  head: () => ({
    meta: [
      { title: "Sell on RealTreats Marketplace — Vendor onboarding" },
      { name: "description", content: "Apply to open your storefront, list products and reach customers near you." },
      { property: "og:title", content: "Sell on RealTreats Marketplace" },
      { property: "og:description", content: "Apply to open your storefront and start selling today." },
    ],
  }),
  component: SellPage,
});

const BUSINESS_CATEGORIES = ["Groceries", "Fashion", "Electronics", "Beauty", "Home & Living", "Food & Drinks", "Health", "Other"];

function SellPage() {
  const { user, vendor, refresh } = useAuth();
  const { data: settings } = useSettings();
  const { data: location } = useUserLocation();
  const navigate = useNavigate();
  const name = settings?.name ?? "RealTreats Marketplace";

  const [form, setForm] = useState({
    name: "",
    owner_name: "",
    email: user?.email ?? "",
    phone: "",
    description: "",
    business_category: "",
    registration_number: "",
    address: "",
    city: "",
    state: "",
  });

  const apply = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc("register_vendor", {
        _payload: {
          ...form,
          latitude: location?.lat != null ? String(location.lat) : "",
          longitude: location?.lng != null ? String(location.lng) : "",
        },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Application submitted for review");
      refresh();
      navigate({ to: "/vendor" });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    apply.mutate();
  };

  return (
    <SiteShell>
      <section className="border-b border-border bg-secondary/40">
        <div className="mx-auto w-full max-w-4xl px-4 py-12 text-center">
          <h1 className="font-display text-2xl font-semibold sm:text-3xl">Sell on {name}</h1>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
            Open your own storefront, manage products and orders, and get discovered by customers nearby.
          </p>
          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {[
              { icon: BadgeCheck, title: "Verified storefront", text: "Approved vendors get a public store page." },
              { icon: LineChart, title: "Order dashboard", text: "Track products, stock and fulfilment." },
              { icon: Truck, title: "Dispatch support", text: "Delivery records created for every order." },
            ].map((f) => (
              <div key={f.title} className="surface p-4 text-left">
                <f.icon className="h-5 w-5 text-primary" />
                <p className="mt-2 text-sm font-semibold">{f.title}</p>
                <p className="text-xs text-muted-foreground">{f.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="mx-auto w-full max-w-2xl px-4 py-10">
        {!user ? (
          <div className="surface p-6 text-center">
            <p className="font-display text-lg font-semibold">Create an account to apply</p>
            <p className="mt-2 text-sm text-muted-foreground">You need an account before submitting a vendor application.</p>
            <Button asChild className="mt-4">
              <Link to="/auth" search={{ redirect: "/sell" }}>
                Sign in or register
              </Link>
            </Button>
          </div>
        ) : vendor ? (
          <div className="surface p-6 text-center">
            <p className="font-display text-lg font-semibold">You already have a storefront</p>
            <p className="mt-2 text-sm text-muted-foreground">
              {vendor.name} is currently <span className="font-medium text-foreground">{vendor.status.replace("_", " ")}</span>.
            </p>
            <Button asChild className="mt-4">
              <Link to="/vendor">Go to vendor dashboard</Link>
            </Button>
          </div>
        ) : (
          <form onSubmit={submit} className="surface space-y-4 p-6">
            <h2 className="font-display text-lg font-semibold">Vendor application</h2>
            <div>
              <Label htmlFor="business">Business name</Label>
              <Input id="business" required className="mt-1.5" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="owner">Owner name</Label>
                <Input id="owner" required className="mt-1.5" value={form.owner_name} onChange={(e) => setForm({ ...form, owner_name: e.target.value })} />
              </div>
              <div>
                <Label htmlFor="vemail">Business email</Label>
                <Input id="vemail" type="email" required className="mt-1.5" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="vphone">Phone</Label>
                <Input id="vphone" required className="mt-1.5" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div>
                <Label>Business category</Label>
                <Select value={form.business_category} onValueChange={(v) => setForm({ ...form, business_category: v })}>
                  <SelectTrigger className="mt-1.5">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {BUSINESS_CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="vdesc">About your business</Label>
              <Textarea id="vdesc" className="mt-1.5" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="vaddress">Business address</Label>
              <Input id="vaddress" required className="mt-1.5" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="vcity">City</Label>
                <Input id="vcity" required className="mt-1.5" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
              </div>
              <div>
                <Label>State</Label>
                <Select value={form.state} onValueChange={(v) => setForm({ ...form, state: v })}>
                  <SelectTrigger className="mt-1.5">
                    <SelectValue placeholder="Select state" />
                  </SelectTrigger>
                  <SelectContent>
                    {NIGERIAN_STATES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="regno">Registration number (optional)</Label>
              <Input id="regno" className="mt-1.5" value={form.registration_number} onChange={(e) => setForm({ ...form, registration_number: e.target.value })} />
            </div>
            <Button type="submit" size="lg" className="w-full" disabled={apply.isPending}>
              {apply.isPending ? "Submitting…" : "Submit application"}
            </Button>
            <p className="text-xs text-muted-foreground">
              Applications are reviewed by the marketplace team. You'll be notified once a decision is made.
            </p>
          </form>
        )}
      </div>
    </SiteShell>
  );
}
