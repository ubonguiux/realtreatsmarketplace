import { CheckCircle2, MapPinOff, AlertTriangle, MapPin } from "lucide-react";
import { formatDistance } from "@/lib/geo";
import type { Serviceability } from "@/hooks/useServiceability";

type Props = {
  status: Serviceability | undefined;
  hasLocation: boolean;
  loading?: boolean;
};

/** Per-vendor delivery serviceability state shown to the customer. */
export function ServiceabilityBadge({ status, hasLocation, loading }: Props) {
  if (!hasLocation) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">
        <MapPin className="h-3.5 w-3.5" />
        Set your delivery location
      </span>
    );
  }
  if (loading && !status) {
    return <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">Checking delivery…</span>;
  }
  if (!status || !status.has_location) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">
        <MapPinOff className="h-3.5 w-3.5" />
        Vendor location unavailable
      </span>
    );
  }
  const distance = formatDistance(status.distance_km);
  if (status.serviceable) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
        <CheckCircle2 className="h-3.5 w-3.5" />
        Delivery available{distance ? ` · ${distance}` : ""}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-destructive/10 px-2.5 py-1 text-xs font-medium text-destructive">
      <AlertTriangle className="h-3.5 w-3.5" />
      {status.accepts_delivery ? "Outside delivery area" : "Vendor is not delivering"}
      {distance ? ` · ${distance}` : ""}
    </span>
  );
}
