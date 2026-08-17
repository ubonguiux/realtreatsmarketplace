import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/marketplace/DashboardShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/vendor/settings")({ component: VendorSettings });

function VendorSettings() {
  const { vendor, refresh } = useAuth();
  const queryClient = useQueryClient();
  const [store, setStore] = useState({ name: "", description: "", phone: "", address: "", city: "", state: "", logo_url: "", storefront_image_url: "" });
  const [settings, setSettings] = useState({ delivery_fee: "0", min_order_amount: "0", accepts_delivery: true, auto_accept_orders: false });

  const data = useQuery({
    queryKey: ["vendor-settings", vendor?.id],
    enabled: Boolean(vendor),
    queryFn: async () => {
      const [v, s] = await Promise.all([
        supabase.from("vendors").select("*").eq("id", vendor!.id).maybeSingle(),
        supabase.from("vendor_settings").select("*").eq("vendor_id", vendor!.id).maybeSingle(),
      ]);
      return { vendor: v.data, settings: s.data };
    },
  });

  useEffect(() => {
    const v = data.data?.vendor;
    const s = data.data?.settings;
    if (v)
      setStore({
        name: v.name ?? "",
        description: v.description ?? "",
        phone: v.phone ?? "",
        address: v.address ?? "",
        city: v.city ?? "",
        state: v.state ?? "",
        logo_url: v.logo_url ?? "",
        storefront_image_url: v.storefront_image_url ?? "",
      });
    if (s)
      setSettings({
        delivery_fee: String(s.delivery_fee ?? 0),
        min_order_amount: String(s.min_order_amount ?? 0),
        accepts_delivery: s.accepts_delivery ?? true,
        auto_accept_orders: s.auto_accept_orders ?? false,
      });
  }, [data.data]);

  const save = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("vendors").update(store).eq("id", vendor!.id);
      if (error) throw error;
      const { error: e2 } = await supabase.from("vendor_settings").upsert(
        {
          vendor_id: vendor!.id,
          delivery_fee: Number(settings.delivery_fee || 0),
          min_order_amount: Number(settings.min_order_amount || 0),
          accepts_delivery: settings.accepts_delivery,
          auto_accept_orders: settings.auto_accept_orders,
        },
        { onConflict: "vendor_id" },
      );
      if (e2) throw e2;
    },
    onSuccess: () => {
      toast.success("Store settings saved");
      refresh();
      queryClient.invalidateQueries({ queryKey: ["vendor-settings"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (data.isLoading) return <Skeleton className="h-64 w-full" />;

  return (
    <div>
      <PageHeader title="Store settings" description="Your public storefront details and delivery options." />
      <div className="surface max-w-2xl space-y-4 p-5">
        <div>
          <Label htmlFor="sname">Store name</Label>
          <Input id="sname" className="mt-1.5" value={store.name} onChange={(e) => setStore({ ...store, name: e.target.value })} />
        </div>
        <div>
          <Label htmlFor="sdesc">Description</Label>
          <Textarea id="sdesc" className="mt-1.5" value={store.description} onChange={(e) => setStore({ ...store, description: e.target.value })} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="sphone">Phone</Label>
            <Input id="sphone" className="mt-1.5" value={store.phone} onChange={(e) => setStore({ ...store, phone: e.target.value })} />
          </div>
          <div>
            <Label htmlFor="scity">City</Label>
            <Input id="scity" className="mt-1.5" value={store.city} onChange={(e) => setStore({ ...store, city: e.target.value })} />
          </div>
        </div>
        <div>
          <Label htmlFor="saddr">Address</Label>
          <Input id="saddr" className="mt-1.5" value={store.address} onChange={(e) => setStore({ ...store, address: e.target.value })} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="slogo">Logo URL</Label>
            <Input id="slogo" className="mt-1.5" value={store.logo_url} onChange={(e) => setStore({ ...store, logo_url: e.target.value })} />
          </div>
          <div>
            <Label htmlFor="sbanner">Banner URL</Label>
            <Input id="sbanner" className="mt-1.5" value={store.storefront_image_url} onChange={(e) => setStore({ ...store, storefront_image_url: e.target.value })} />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="sfee">Delivery fee</Label>
            <Input id="sfee" inputMode="numeric" className="mt-1.5" value={settings.delivery_fee} onChange={(e) => setSettings({ ...settings, delivery_fee: e.target.value })} />
          </div>
          <div>
            <Label htmlFor="smin">Minimum order value</Label>
            <Input id="smin" inputMode="numeric" className="mt-1.5" value={settings.min_order_amount} onChange={(e) => setSettings({ ...settings, min_order_amount: e.target.value })} />
          </div>
        </div>
        <label className="flex items-center justify-between text-sm">
          Accepts delivery
          <Switch checked={settings.accepts_delivery} onCheckedChange={(v) => setSettings({ ...settings, accepts_delivery: v })} />
        </label>
        <label className="flex items-center justify-between text-sm">
          Auto-accept orders
          <Switch checked={settings.auto_accept_orders} onCheckedChange={(v) => setSettings({ ...settings, auto_accept_orders: v })} />
        </label>
        <Button onClick={() => save.mutate()} disabled={save.isPending}>
          {save.isPending ? "Saving…" : "Save settings"}
        </Button>
      </div>
    </div>
  );
}
