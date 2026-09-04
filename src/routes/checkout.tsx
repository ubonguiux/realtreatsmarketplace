import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { SiteShell } from "@/components/marketplace/SiteShell";
import { EmptyState } from "@/components/marketplace/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { NIGERIAN_STATES, formatMoney } from "@/lib/marketplace";
import { useAuth } from "@/hooks/useAuth";
import { useCart, useUserLocation } from "@/hooks/useMarketplace";
import { useLocationContext } from "@/hooks/useLocationContext";
import { useServiceability } from "@/hooks/useServiceability";
import { ServiceabilityBadge } from "@/components/marketplace/ServiceabilityBadge";
import { LocationPicker } from "@/components/marketplace/LocationPicker";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "Checkout — RealTreats Marketplace" },
      { name: "description", content: "Confirm your delivery details and place your multi-vendor order." },
      { property: "og:title", content: "Checkout — RealTreats Marketplace" },
      { property: "og:description", content: "Confirm delivery details and place your order." },
    ],
  }),
  component: CheckoutPage,
});

function CheckoutPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { items, subtotal, isLoading } = useCart();
  const { data: location } = useUserLocation();
  const { location: deliveryLocation } = useLocationContext();
  const vendorIds = items.map((i) => i.vendor_id as string);
  const { data: serviceability, isFetching: checkingDelivery } = useServiceability(vendorIds, deliveryLocation);
  const vendorGroups = Array.from(new Set(vendorIds)).map((id) => ({
    id,
    name: items.find((i) => i.vendor_id === id)?.vendors?.name ?? "Vendor",
  }));
  const [form, setForm] = useState({ address: "", city: "", state: "", phone: "", notes: "" });

  useEffect(() => {
    if (!user) return;
    supabase
      .from("customer_addresses")
      .select("*")
      .eq("user_id", user.id)
      .order("is_default", { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (data)
          setForm((f) => ({
            ...f,
            address: data.address ?? "",
            city: data.city ?? "",
            state: data.state ?? "",
            phone: data.phone ?? "",
          }));
      });
  }, [user]);

  const placeOrder = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc("checkout", {
        _address: {
          address: form.address,
          city: form.city,
          state: form.state,
          phone: form.phone,
          notes: form.notes,
          latitude: location?.lat != null ? String(location.lat) : "",
          longitude: location?.lng != null ? String(location.lng) : "",
        },
      });
      if (error) throw error;
      return data as string;
    },
    onSuccess: (orderId) => {
      toast.success("Order placed");
      navigate({ to: "/orders/$id", params: { id: orderId } });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.address || !form.city || !form.state || !form.phone) {
      toast.error("Please fill in your delivery address and phone number");
      return;
    }
    placeOrder.mutate();
  };

  if (!user) {
    return (
      <SiteShell>
        <div className="mx-auto w-full max-w-3xl px-4 py-16">
          <EmptyState
            title="Sign in to check out"
            action={
              <Button asChild>
                <Link to="/auth" search={{ redirect: "/checkout" }}>
                  Sign in
                </Link>
              </Button>
            }
          />
        </div>
      </SiteShell>
    );
  }

  if (!isLoading && !items.length) {
    return (
      <SiteShell>
        <div className="mx-auto w-full max-w-3xl px-4 py-16">
          <EmptyState
            title="Your cart is empty"
            action={
              <Button asChild>
                <Link to="/marketplace">Start shopping</Link>
              </Button>
            }
          />
        </div>
      </SiteShell>
    );
  }

  return (
    <SiteShell>
      <div className="mx-auto w-full max-w-5xl px-4 py-8">
        <h1 className="font-display text-xl font-semibold sm:text-2xl">Checkout</h1>
        <p className="mb-6 text-sm text-muted-foreground">Your order is split per vendor automatically.</p>

        <form onSubmit={submit} className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <div className="surface space-y-4 p-5">
            <div>
              <Label htmlFor="address">Delivery address</Label>
              <Input id="address" className="mt-1.5" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} required />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="city">City</Label>
                <Input id="city" className="mt-1.5" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} required />
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
              <Label htmlFor="phone">Contact phone</Label>
              <Input id="phone" className="mt-1.5" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
            </div>
            <div>
              <Label htmlFor="notes">Delivery notes (optional)</Label>
              <Textarea id="notes" className="mt-1.5" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
          </div>

          <aside className="surface h-fit p-5">
            <p className="font-display text-sm font-semibold">Summary</p>
            <ul className="mt-3 space-y-2 text-sm">
              {items.map((i) => (
                <li key={i.id} className="flex justify-between gap-3">
                  <span className="truncate text-muted-foreground">
                    {i.quantity} × {i.products?.name ?? "Product"}
                  </span>
                  <span>{formatMoney(Number(i.unit_price) * i.quantity)}</span>
                </li>
              ))}
            </ul>
            <div className="mt-4 flex justify-between border-t border-border pt-3 text-sm font-semibold">
              <span>Subtotal</span>
              <span>{formatMoney(subtotal)}</span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">Delivery fees are added per vendor when the order is created.</p>

            <div className="mt-4 border-t border-border pt-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold">Delivery availability</p>
                <LocationPicker compact />
              </div>
              <ul className="mt-2 space-y-2">
                {vendorGroups.map((v) => (
                  <li key={v.id} className="space-y-1">
                    <p className="truncate text-xs text-muted-foreground">{v.name}</p>
                    <ServiceabilityBadge
                      status={serviceability?.[v.id]}
                      hasLocation={Boolean(deliveryLocation)}
                      loading={checkingDelivery}
                    />
                  </li>
                ))}
              </ul>
            </div>
            <Button type="submit" size="lg" className="mt-4 w-full" disabled={placeOrder.isPending}>
              {placeOrder.isPending ? "Placing order…" : "Place order"}
            </Button>
          </aside>
        </form>
      </div>
    </SiteShell>
  );
}
