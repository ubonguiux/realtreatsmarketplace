import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/marketplace/DashboardShell";
import { EmptyState } from "@/components/marketplace/EmptyState";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { Constants } from "@/integrations/supabase/types";
import { titleize } from "@/lib/marketplace";

export const Route = createFileRoute("/admin/despatchers")({ component: AdminDespatchers });

const STATUSES = Constants.public.Enums.despatcher_status;

function AdminDespatchers() {
  const [filter, setFilter] = useState<string>("all");

  const despatchers = useQuery({
    queryKey: ["admin-despatchers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("despatchers")
        .select(
          "id,full_name,phone,email,status,availability,vehicle_type,city,state,country,address,created_at,active_deliveries,completed_deliveries",
        )
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const rows = useMemo(
    () => (despatchers.data ?? []).filter((d) => filter === "all" || d.status === filter),
    [despatchers.data, filter],
  );

  const counts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const d of despatchers.data ?? []) map[d.status] = (map[d.status] ?? 0) + 1;
    return map;
  }, [despatchers.data]);

  return (
    <div>
      <PageHeader
        title="Despatchers"
        description="All despatcher registrations from the marketplace database."
      />

      <div className="-mx-4 mb-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
        <Button size="sm" variant={filter === "all" ? "default" : "outline"} onClick={() => setFilter("all")}>
          All <span className="ml-1 text-xs opacity-70">{despatchers.data?.length ?? 0}</span>
        </Button>
        {STATUSES.map((s) => (
          <Button key={s} size="sm" variant={filter === s ? "default" : "outline"} onClick={() => setFilter(s)}>
            {titleize(s)} <span className="ml-1 text-xs opacity-70">{counts[s] ?? 0}</span>
          </Button>
        ))}
      </div>

      {despatchers.isLoading ? (
        <Skeleton className="h-48 w-full" />
      ) : despatchers.isError ? (
        <EmptyState title="Could not load despatchers" description={(despatchers.error as Error).message} />
      ) : rows.length ? (
        <div className="space-y-3">
          {rows.map((d) => (
            <div key={d.id} className="surface p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{d.full_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {[d.phone, d.email].filter(Boolean).join(" · ") || "No contact details"}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {[d.address, d.city, d.state, d.country].filter(Boolean).join(", ") || "No location on file"}
                  </p>
                </div>
                <div className="flex flex-col items-start gap-1 sm:items-end">
                  <Badge variant={d.status === "approved" ? "default" : "secondary"}>{titleize(d.status)}</Badge>
                  <span className="text-xs text-muted-foreground">
                    Applied {new Date(d.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                {titleize(d.vehicle_type ?? "")} · {titleize(d.availability)} · {d.active_deliveries} active ·{" "}
                {d.completed_deliveries} completed
              </p>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState title="No despatchers found" description="No records match this status filter." />
      )}
    </div>
  );
}
