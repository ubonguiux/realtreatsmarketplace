import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Crosshair } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { NIGERIAN_STATES } from "@/lib/marketplace";
import { useAuth } from "@/hooks/useAuth";
import { useLocationContext } from "@/hooks/useLocationContext";

export const Route = createFileRoute("/despatch/apply")({ component: DespatchApply });

const VEHICLES = ["motorcycle", "bicycle", "car", "van", "truck", "on foot"];

function DespatchApply() {
  const { user, refresh } = useAuth();
  const navigate = useNavigate();
  const { location, useMyLocation, locating, error } = useLocationContext();
  const [form, setForm] = useState({
    full_name: (user?.user_metadata?.["full_name"] as string) ?? "",
    phone: "",
    vehicle_type: "motorcycle",
    vehicle_plate: "",
    business_name: "",
    address: "",
    city: "",
    state: "",
    service_radius_km: "15",
  });

  const apply = useMutation({
    mutationFn: async () => {
      const { error: rpcError } = await supabase.rpc("register_despatcher", {
        _payload: {
          ...form,
          email: user?.email ?? "",
          latitude: location?.lat != null ? String(location.lat) : "",
          longitude: location?.lng != null ? String(location.lng) : "",
        },
      });
      if (rpcError) throw rpcError;
    },
    onSuccess: () => {
      toast.success("Application submitted for review");
      refresh();
      navigate({ to: "/despatch" });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.full_name || !form.phone || !form.city || !form.state) {
      toast.error("Please complete your name, phone and operating location");
      return;
    }
    if (!location) {
      toast.error("Set your operating location so we can match you with nearby deliveries");
      return;
    }
    apply.mutate();
  };

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8">
      <h1 className="font-display text-xl font-semibold sm:text-2xl">Deliver with RealTreats</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Tell us who you are, what you ride and where you operate. The marketplace team reviews every application.
      </p>

      <form onSubmit={submit} className="surface space-y-4 p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="name">Full name</Label>
            <Input id="name" className="mt-1.5" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} required />
          </div>
          <div>
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" className="mt-1.5" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>Vehicle</Label>
            <Select value={form.vehicle_type} onValueChange={(v) => setForm({ ...form, vehicle_type: v })}>
              <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
              <SelectContent>
                {VEHICLES.map((v) => (
                  <SelectItem key={v} value={v}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="plate">Plate number (optional)</Label>
            <Input id="plate" className="mt-1.5" value={form.vehicle_plate} onChange={(e) => setForm({ ...form, vehicle_plate: e.target.value })} />
          </div>
        </div>

        <div>
          <Label htmlFor="business">Business name (optional)</Label>
          <Input id="business" className="mt-1.5" value={form.business_name} onChange={(e) => setForm({ ...form, business_name: e.target.value })} />
        </div>

        <div>
          <Label htmlFor="address">Operating address</Label>
          <Input id="address" className="mt-1.5" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="city">City</Label>
            <Input id="city" className="mt-1.5" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} required />
          </div>
          <div>
            <Label>State</Label>
            <Select value={form.state} onValueChange={(v) => setForm({ ...form, state: v })}>
              <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select state" /></SelectTrigger>
              <SelectContent>
                {NIGERIAN_STATES.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label htmlFor="radius">Service radius (km)</Label>
          <Input
            id="radius"
            type="number"
            min={1}
            className="mt-1.5"
            value={form.service_radius_km}
            onChange={(e) => setForm({ ...form, service_radius_km: e.target.value })}
          />
        </div>

        <div className="rounded-lg border border-dashed border-border p-4">
          <p className="text-sm font-medium">Operating coordinates</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {location ? `${location.label} (${location.lat.toFixed(4)}, ${location.lng.toFixed(4)})` : "Not set yet"}
          </p>
          {error ? <p className="mt-1 text-xs text-destructive">{error}</p> : null}
          <Button type="button" variant="outline" size="sm" className="mt-3 gap-2" onClick={() => useMyLocation()} disabled={locating}>
            <Crosshair className="h-4 w-4" /> {locating ? "Locating…" : "Use my current location"}
          </Button>
        </div>

        <Button type="submit" size="lg" className="w-full" disabled={apply.isPending}>
          {apply.isPending ? "Submitting…" : "Submit application"}
        </Button>
      </form>
    </div>
  );
}
