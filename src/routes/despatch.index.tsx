import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Crosshair, MapPin, Navigation, PackageCheck } from "lucide-react";
import { PageHeader, StatCard } from "@/components/marketplace/DashboardShell";
import { EmptyState } from "@/components/marketplace/EmptyState";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatMoney, titleize } from "@/lib/marketplace";
import { mapsDirectionsUrl } from "@/lib/geo";
import { useAuth } from "@/hooks/useAuth";
import {
  DELIVERY_ACTIVE_STATUSES,
  NEXT_STATUS,
  pushDespatcherLocation,
  useDespatchActions,
  useDespatcherDeliveries,
} from "@/hooks/useDespatch";

export const Route = createFileRoute("/despatch/")({ component: DespatchJobs });

type Delivery = Record<string, any>;

function DeliveryCard({ d, children }: { d: Delivery; children?: React.ReactNode }) {
  return (
    <div className="surface space-y-3 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold">{d.vendors?.name ?? "Vendor"}</p>
          <p className="text-xs text-muted-foreground">
            {d.distance_km ? `${d.distance_km} km trip · ` : ""}
            {formatMoney(Number(d.fee ?? 0))} fee
          </p>
        </div>
        <Badge variant="secondary">{titleize(d.status)}</Badge>
      </div>
      <div className="grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
        <p className="flex items-start gap-1.5">
          <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" /> Pickup: {d.pickup_address ?? d.vendors?.address ?? "Vendor store"}
        </p>
        <p className="flex items-start gap-1.5">
          <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" /> Drop-off: {d.delivery_address ?? "Customer address"}
        </p>
      </div>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function DespatchJobs() {
  const { despatcher } = useAuth();
  const { mine, available } = useDespatcherDeliveries();
  const { claim, accept, reject, advance, setAvailability } = useDespatchActions();
  const [sharing, setSharing] = useState(false);

  const rows = (mine.data ?? []) as Delivery[];
  const assigned = rows.filter((d) => d.status === "assigned");
  const active = rows.filter((d) => (DELIVERY_ACTIVE_STATUSES as readonly string[]).includes(d.status));
  const history = rows.filter((d) => ["delivered", "failed", "cancelled"].includes(d.status));
  const availableRows = (available.data ?? []) as Delivery[];

  useEffect(() => {
    if (!sharing || !active.length) return;
    if (typeof navigator === "undefined" || !navigator.geolocation) return;
    const watch = navigator.geolocation.watchPosition(
      (pos) => void pushDespatcherLocation(pos.coords.latitude, pos.coords.longitude).catch(() => {}),
      () => setSharing(false),
      { enableHighAccuracy: true, maximumAge: 15000 },
    );
    return () => navigator.geolocation.clearWatch(watch);
  }, [sharing, active.length]);

  const online = despatcher?.availability !== "offline";

  return (
    <div>
      <PageHeader
        title="Deliveries"
        description="Accept jobs, confirm pickup and keep customers updated."
        action={
          <Button
            variant={online ? "default" : "outline"}
            onClick={() => setAvailability.mutate(online ? "offline" : "online")}
            disabled={setAvailability.isPending}
          >
            {online ? "You're online" : "Go online"}
          </Button>
        }
      />

      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Available" value={availableRows.length} />
        <StatCard label="Assigned" value={assigned.length} />
        <StatCard label="Active" value={active.length} />
        <StatCard label="Completed" value={despatcher?.availability ? history.filter((h) => h.status === "delivered").length : 0} />
      </div>

      {active.length ? (
        <div className="surface mb-5 flex flex-wrap items-center justify-between gap-3 p-4">
          <div>
            <p className="text-sm font-medium">Live location sharing</p>
            <p className="text-xs text-muted-foreground">
              Share your position so the customer, vendor and admin can follow the delivery.
            </p>
          </div>
          <Button size="sm" variant={sharing ? "default" : "outline"} className="gap-2" onClick={() => setSharing((s) => !s)}>
            <Crosshair className="h-4 w-4" /> {sharing ? "Sharing on" : "Start sharing"}
          </Button>
        </div>
      ) : null}

      {mine.isLoading ? (
        <Skeleton className="h-48 w-full" />
      ) : (
        <Tabs defaultValue="available">
          <TabsList>
            <TabsTrigger value="available">Available ({availableRows.length})</TabsTrigger>
            <TabsTrigger value="assigned">Assigned ({assigned.length})</TabsTrigger>
            <TabsTrigger value="active">Active ({active.length})</TabsTrigger>
            <TabsTrigger value="history">History ({history.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="available" className="mt-4 space-y-3">
            {availableRows.length ? (
              availableRows.map((d) => (
                <DeliveryCard key={d.id} d={d}>
                  <Button size="sm" onClick={() => claim.mutate(d.id)} disabled={claim.isPending}>
                    Claim delivery
                  </Button>
                </DeliveryCard>
              ))
            ) : (
              <EmptyState title="No deliveries waiting" description="New jobs appear here the moment a vendor requests despatch." />
            )}
          </TabsContent>

          <TabsContent value="assigned" className="mt-4 space-y-3">
            {assigned.length ? (
              assigned.map((d) => (
                <DeliveryCard key={d.id} d={d}>
                  <Button size="sm" onClick={() => accept.mutate(d.id)} disabled={accept.isPending}>
                    Accept
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => reject.mutate(d.id)} disabled={reject.isPending}>
                    Decline
                  </Button>
                </DeliveryCard>
              ))
            ) : (
              <EmptyState title="Nothing assigned right now" />
            )}
          </TabsContent>

          <TabsContent value="active" className="mt-4 space-y-3">
            {active.length ? (
              active.map((d) => (
                <DeliveryCard key={d.id} d={d}>
                  {(NEXT_STATUS[d.status] ?? []).map((n) => (
                    <Button key={n.value} size="sm" onClick={() => advance.mutate({ id: d.id, status: n.value })} disabled={advance.isPending}>
                      <PackageCheck className="mr-1.5 h-4 w-4" /> {n.label}
                    </Button>
                  ))}
                  <Button size="sm" variant="outline" asChild>
                    <a
                      href={mapsDirectionsUrl(
                        ["picked_up", "in_transit", "near_destination", "arrived_at_destination"].includes(d.status)
                          ? { lat: d.delivery_latitude, lng: d.delivery_longitude, address: d.delivery_address }
                          : { lat: d.pickup_latitude, lng: d.pickup_longitude, address: d.pickup_address },
                      )}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <Navigation className="mr-1.5 h-4 w-4" /> Navigate
                    </a>
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => advance.mutate({ id: d.id, status: "failed", note: "Reported by despatcher" })}
                    disabled={advance.isPending}
                  >
                    Report failure
                  </Button>
                </DeliveryCard>
              ))
            ) : (
              <EmptyState title="No active delivery" description="Accept an assignment to start delivering." />
            )}
          </TabsContent>

          <TabsContent value="history" className="mt-4 space-y-3">
            {history.length ? history.map((d) => <DeliveryCard key={d.id} d={d} />) : <EmptyState title="No completed deliveries yet" />}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
