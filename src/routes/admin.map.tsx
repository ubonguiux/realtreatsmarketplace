import { createFileRoute } from "@tanstack/react-router";
import { Suspense, lazy, useEffect, useMemo } from "react";
import { ClientOnly } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/marketplace/DashboardShell";
import { EmptyState } from "@/components/marketplace/EmptyState";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { titleize } from "@/lib/marketplace";
import type { LiveMapPoint } from "@/components/marketplace/LiveMap";

const LiveMap = lazy(() => import("@/components/marketplace/LiveMap"));

export const Route = createFileRoute("/admin/map")({ component: AdminMap });

const ACTIVE_DELIVERY_STATUSES = [
  "assigned",
  "accepted",
  "heading_to_pickup",
  "arrived_at_pickup",
  "picked_up",
  "in_transit",
  "near_destination",
  "arrived_at_destination",
];

function AdminMap() {
  const queryClient = useQueryClient();

  const despatchers = useQuery({
    queryKey: ["admin-live-despatchers"],
    refetchInterval: 20000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("despatchers")
        .select("id,full_name,phone,availability,status,current_latitude,current_longitude,location_updated_at,active_deliveries")
        .eq("status", "approved")
        .order("full_name");
      if (error) throw error;
      return data ?? [];
    },
  });

  const deliveries = useQuery({
    queryKey: ["admin-live-deliveries"],
    refetchInterval: 20000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("deliveries")
        .select(
          "id,status,despatcher_id,despatcher_latitude,despatcher_longitude,despatcher_location_at,delivery_address,delivery_latitude,delivery_longitude,despatchers(full_name)",
        )
        .in("status", ACTIVE_DELIVERY_STATUSES as never[]);
      if (error) throw error;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (data ?? []) as any[];
    },
  });

  useEffect(() => {
    const channel = supabase
      .channel("admin-live-map")
      .on("postgres_changes", { event: "*", schema: "public", table: "despatchers" }, () =>
        queryClient.invalidateQueries({ queryKey: ["admin-live-despatchers"] }),
      )
      .on("postgres_changes", { event: "*", schema: "public", table: "deliveries" }, () =>
        queryClient.invalidateQueries({ queryKey: ["admin-live-deliveries"] }),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const points = useMemo<LiveMapPoint[]>(() => {
    const list: LiveMapPoint[] = [];
    for (const d of despatchers.data ?? []) {
      if (d.current_latitude == null || d.current_longitude == null) continue;
      list.push({
        id: `d-${d.id}`,
        lat: Number(d.current_latitude),
        lng: Number(d.current_longitude),
        label: d.full_name,
        detail: `${titleize(d.availability)}${d.location_updated_at ? ` · updated ${new Date(d.location_updated_at).toLocaleTimeString()}` : ""}`,
        tone: ["on_delivery", "assigned"].includes(d.availability) ? "active" : "idle",
      });
    }
    for (const dl of deliveries.data ?? []) {
      if (dl.delivery_latitude == null || dl.delivery_longitude == null) continue;
      list.push({
        id: `drop-${dl.id}`,
        lat: Number(dl.delivery_latitude),
        lng: Number(dl.delivery_longitude),
        label: "Drop-off",
        detail: dl.delivery_address ?? titleize(dl.status),
        tone: "drop",
      });
    }
    return list;
  }, [despatchers.data, deliveries.data]);

  const loading = despatchers.isLoading || deliveries.isLoading;

  return (
    <div>
      <PageHeader title="Live map" description="Watch approved despatchers move in real time alongside active drop-off points." />

      {loading ? (
        <Skeleton className="h-96 w-full" />
      ) : (
        <>
          <ClientOnly fallback={<Skeleton className="h-96 w-full" />}>
            <Suspense fallback={<Skeleton className="h-96 w-full" />}>
              <LiveMap points={points} height={420} />
            </Suspense>
          </ClientOnly>

          <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><i className="h-2.5 w-2.5 rounded-full bg-primary" /> On delivery</span>
            <span className="flex items-center gap-1"><i className="h-2.5 w-2.5 rounded-full bg-amber-500" /> Available</span>
            <span className="flex items-center gap-1"><i className="h-2.5 w-2.5 rounded-full bg-blue-600" /> Drop-off</span>
          </div>

          <div className="mt-6 space-y-2">
            {(despatchers.data ?? []).length ? (
              (despatchers.data ?? []).map((d) => (
                <div key={d.id} className="surface flex flex-wrap items-center justify-between gap-2 p-3 text-sm">
                  <div>
                    <p className="font-medium">{d.full_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {d.current_latitude != null && d.current_longitude != null
                        ? `Last seen ${d.location_updated_at ? new Date(d.location_updated_at).toLocaleString() : "recently"}`
                        : "No location shared yet"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{titleize(d.availability)}</Badge>
                    <Badge variant="outline">{d.active_deliveries} active</Badge>
                  </div>
                </div>
              ))
            ) : (
              <EmptyState title="No approved despatchers yet" description="Approved despatchers appear here once they go online." />
            )}
          </div>
        </>
      )}
    </div>
  );
}
