import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { PageHeader } from "@/components/marketplace/DashboardShell";
import { EmptyState } from "@/components/marketplace/EmptyState";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { formatMoney, haversineKm, titleize } from "@/lib/marketplace";
import { useDeliveryRealtime } from "@/hooks/useDespatch";

export const Route = createFileRoute("/admin/dispatch")({ component: AdminDispatch });

const FILTERS: { key: string; label: string; statuses: string[] }[] = [
  { key: "ready", label: "Ready for dispatch", statuses: ["awaiting_assignment", "requested", "pending"] },
  { key: "assigned", label: "Assigned", statuses: ["assigned", "accepted"] },
  {
    key: "pickup",
    label: "Awaiting pickup",
    statuses: ["heading_to_pickup", "arrived_at_pickup"],
  },
  {
    key: "transit",
    label: "In transit",
    statuses: ["picked_up", "in_transit", "near_destination", "arrived_at_destination", "en_route"],
  },
  { key: "delivered", label: "Delivered", statuses: ["delivered"] },
  { key: "closed", label: "Failed / cancelled", statuses: ["failed", "cancelled"] },
];

const DELIVERY_SELECT =
  "id,status,fee,distance_km,delivery_instructions,pickup_address,pickup_latitude,pickup_longitude,delivery_address,delivery_latitude,delivery_longitude,despatcher_id,assigned_at,created_at,order_id,vendor_order_id,vendor_id," +
  "vendors(name,address,city,state,phone,latitude,longitude)," +
  "despatchers(full_name,phone,availability,status)," +
  "vendor_orders(status,total,created_at,order_items(id))," +
  "orders(reference,status,contact_phone,delivery_address,delivery_city,delivery_state,created_at)";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = any;

function AdminDispatch() {
  const [filter, setFilter] = useState("ready");
  const [target, setTarget] = useState<Row | null>(null);
  const queryClient = useQueryClient();
  useDeliveryRealtime(["admin-dispatch-queue"]);

  const deliveries = useQuery({
    queryKey: ["admin-dispatch-queue"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("deliveries")
        .select(DELIVERY_SELECT)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Row[];
    },
  });

  const counts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const f of FILTERS) map[f.key] = (deliveries.data ?? []).filter((d) => f.statuses.includes(d.status)).length;
    return map;
  }, [deliveries.data]);

  const rows = useMemo(() => {
    const f = FILTERS.find((x) => x.key === filter);
    return (deliveries.data ?? []).filter((d) => !f || f.statuses.includes(d.status));
  }, [deliveries.data, filter]);

  return (
    <div>
      <PageHeader title="Dispatch queue" description="Assign approved despatchers to vendor orders ready for delivery." />

      <div className="-mx-4 mb-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
        {FILTERS.map((f) => (
          <Button
            key={f.key}
            size="sm"
            variant={filter === f.key ? "default" : "outline"}
            onClick={() => setFilter(f.key)}
            className="shrink-0"
          >
            {f.label} <span className="ml-1 text-xs opacity-70">{counts[f.key] ?? 0}</span>
          </Button>
        ))}
      </div>

      {deliveries.isLoading ? (
        <Skeleton className="h-48 w-full" />
      ) : deliveries.isError ? (
        <EmptyState title="Could not load dispatch queue" description={(deliveries.error as Error).message} />
      ) : rows.length ? (
        <div className="space-y-3">
          {rows.map((d) => (
            <DeliveryCard key={d.id} row={d} onAssign={() => setTarget(d)} />
          ))}
        </div>
      ) : (
        <EmptyState title="Nothing here" description="No deliveries match this filter." />
      )}

      <AssignDialog
        row={target}
        onClose={() => setTarget(null)}
        onAssigned={() => {
          setTarget(null);
          queryClient.invalidateQueries({ queryKey: ["admin-dispatch-queue"] });
          queryClient.invalidateQueries({ queryKey: ["admin-despatchers"] });
        }}
      />
    </div>
  );
}

function DeliveryCard({ row, onAssign }: { row: Row; onAssign: () => void }) {
  const assignable = !["delivered", "cancelled"].includes(row.status);
  const items = row.vendor_orders?.order_items?.length ?? 0;
  const dropoff =
    row.delivery_address ??
    [row.orders?.delivery_address, row.orders?.delivery_city, row.orders?.delivery_state].filter(Boolean).join(", ");
  const pickup = row.pickup_address ?? [row.vendors?.address, row.vendors?.city, row.vendors?.state].filter(Boolean).join(", ");

  return (
    <div className="surface p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">
            {row.orders?.reference ?? "Order"} · {row.vendors?.name ?? "Vendor"}
          </p>
          <p className="text-xs text-muted-foreground">
            {new Date(row.vendor_orders?.created_at ?? row.created_at).toLocaleString()} · {items} item{items === 1 ? "" : "s"} ·{" "}
            {formatMoney(Number(row.vendor_orders?.total ?? 0))}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge variant="outline">Order: {titleize(row.orders?.status ?? "")}</Badge>
          <Badge variant="outline">Vendor: {titleize(row.vendor_orders?.status ?? "")}</Badge>
          <Badge>{titleize(row.status)}</Badge>
        </div>
      </div>

      <div className="mt-3 grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
        <p className="break-words">
          <span className="font-medium text-foreground">Pickup:</span> {pickup || "Not provided"}
        </p>
        <p className="break-words">
          <span className="font-medium text-foreground">Delivery:</span> {dropoff || "Not provided"}
          {row.orders?.contact_phone ? ` · ${row.orders.contact_phone}` : ""}
        </p>
        <p>
          <span className="font-medium text-foreground">Fee:</span> {formatMoney(Number(row.fee ?? 0))}
          {row.distance_km != null ? ` · ${Number(row.distance_km)} km` : ""}
        </p>
        {row.delivery_instructions ? <p className="break-words">Note: {row.delivery_instructions}</p> : null}
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        {row.despatcher_id ? (
          <p className="text-xs">
            <span className="font-medium">Assigned to {row.despatchers?.full_name ?? "despatcher"}</span>
            {row.despatchers?.phone ? ` · ${row.despatchers.phone}` : ""}
            {row.assigned_at ? ` · ${new Date(row.assigned_at).toLocaleString()}` : ""}
          </p>
        ) : (
          <p className="text-xs text-muted-foreground">No despatcher assigned</p>
        )}
        {assignable ? (
          <Button size="sm" variant={row.despatcher_id ? "outline" : "default"} onClick={onAssign}>
            {row.despatcher_id ? "Reassign" : "Assign despatcher"}
          </Button>
        ) : null}
      </div>
    </div>
  );
}

function AssignDialog({
  row,
  onClose,
  onAssigned,
}: {
  row: Row | null;
  onClose: () => void;
  onAssigned: () => void;
}) {
  const [selected, setSelected] = useState<Row | null>(null);

  const despatchers = useQuery({
    queryKey: ["dispatch-eligible-despatchers"],
    enabled: Boolean(row),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("despatchers")
        .select(
          "id,full_name,phone,availability,vehicle_type,vehicle_plate,city,state,service_radius_km,active_deliveries,completed_deliveries,rating,latitude,longitude,current_latitude,current_longitude",
        )
        .eq("status", "approved")
        .neq("availability", "offline")
        .order("active_deliveries", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Row[];
    },
  });

  const pickupLat = row?.pickup_latitude ?? row?.vendors?.latitude ?? null;
  const pickupLng = row?.pickup_longitude ?? row?.vendors?.longitude ?? null;

  const options = useMemo(() => {
    const list = (despatchers.data ?? [])
      .filter((d) => d.id !== row?.despatcher_id)
      .map((d) => ({
        ...d,
        distance:
          pickupLat != null && pickupLng != null
            ? haversineKm(
                { lat: Number(pickupLat), lng: Number(pickupLng) },
                { lat: d.current_latitude ?? d.latitude, lng: d.current_longitude ?? d.longitude },
              )
            : null,
      }));
    return list.sort((a, b) => {
      const busy = (x: Row) => (x.availability === "online" ? 0 : 1);
      if (busy(a) !== busy(b)) return busy(a) - busy(b);
      return (a.distance ?? 99999) - (b.distance ?? 99999);
    });
  }, [despatchers.data, pickupLat, pickupLng, row?.despatcher_id]);

  const assign = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc("assign_delivery", {
        _delivery_id: row!.id,
        _despatcher_id: selected!.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(`Assigned to ${selected?.full_name}`);
      setSelected(null);
      onAssigned();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const open = Boolean(row);

  return (
    <>
      <Dialog
        open={open && !selected}
        onOpenChange={(v) => {
          if (!v) onClose();
        }}
      >
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Assign despatcher</DialogTitle>
            <DialogDescription className="break-words">
              {row?.orders?.reference} · {row?.vendors?.name} · pickup {row?.pickup_address ?? row?.vendors?.city ?? "—"}
            </DialogDescription>
          </DialogHeader>

          {despatchers.isLoading ? (
            <Skeleton className="h-32 w-full" />
          ) : options.length ? (
            <div className="space-y-2">
              {options.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => setSelected(d)}
                  className="w-full rounded-lg border p-3 text-left transition-colors hover:bg-muted"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-sm font-semibold">{d.full_name}</span>
                    <Badge variant={d.availability === "online" ? "default" : "secondary"}>
                      {titleize(d.availability)}
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {[titleize(d.vehicle_type ?? ""), d.vehicle_plate, [d.city, d.state].filter(Boolean).join(", ")]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {d.distance != null ? `${d.distance} km from pickup · ` : ""}
                    {d.active_deliveries} active · {d.completed_deliveries} completed · radius {d.service_radius_km} km
                  </p>
                </button>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No eligible despatchers"
              description="No approved despatchers are currently online or available."
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(selected)} onOpenChange={(v) => !v && setSelected(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Assign despatcher?</DialogTitle>
            <DialogDescription>Confirm this delivery assignment.</DialogDescription>
          </DialogHeader>
          <div className="space-y-1 text-sm">
            <p className="break-words">
              <span className="text-muted-foreground">Order:</span> {row?.orders?.reference}
            </p>
            <p className="break-words">
              <span className="text-muted-foreground">Vendor:</span> {row?.vendors?.name}
            </p>
            <p className="break-words">
              <span className="text-muted-foreground">Pickup:</span>{" "}
              {row?.pickup_address ?? [row?.vendors?.address, row?.vendors?.city].filter(Boolean).join(", ") ?? "—"}
            </p>
            <p className="break-words">
              <span className="text-muted-foreground">Delivery:</span> {row?.delivery_address ?? "—"}
            </p>
            <p className="break-words">
              <span className="text-muted-foreground">Despatcher:</span> {selected?.full_name}
            </p>
          </div>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="outline" onClick={() => setSelected(null)} disabled={assign.isPending}>
              Cancel
            </Button>
            <Button onClick={() => assign.mutate()} disabled={assign.isPending}>
              {assign.isPending ? "Assigning…" : "Assign despatcher"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
