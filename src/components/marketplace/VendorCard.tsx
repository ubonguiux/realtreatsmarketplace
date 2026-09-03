import { Link } from "@tanstack/react-router";
import { MapPin, BadgeCheck } from "lucide-react";
import { StoredImage } from "./StoredImage";
import { formatDistance } from "@/lib/geo";

export type VendorCardData = {
  id: string;
  name: string;
  slug: string;
  city: string | null;
  state: string | null;
  business_category: string | null;
  logo_url: string | null;
  storefront_image_url: string | null;
  is_featured?: boolean;
  distanceKm?: number | null;
};

export function VendorCard({ vendor }: { vendor: VendorCardData }) {
  return (
    <Link
      to="/store/$slug"
      params={{ slug: vendor.slug }}
      className="surface group flex h-full flex-col overflow-hidden transition-shadow hover:shadow-md"
    >
      <div className="h-24 overflow-hidden bg-muted">
        <StoredImage path={vendor.storefront_image_url} alt={vendor.name} className="h-full w-full" />
      </div>
      <div className="flex flex-1 items-start gap-3 p-3">
        <StoredImage path={vendor.logo_url} alt={vendor.name} className="h-12 w-12 shrink-0 rounded-lg border border-border" />
        <div className="min-w-0">
          <p className="flex items-center gap-1 truncate text-sm font-semibold">
            {vendor.name}
            {vendor.is_featured ? <BadgeCheck className="h-4 w-4 text-primary" /> : null}
          </p>
          <p className="truncate text-xs text-muted-foreground">{vendor.business_category ?? "Marketplace vendor"}</p>
          <p className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="h-3.5 w-3.5" />
            {[vendor.city, vendor.state].filter(Boolean).join(", ") || "Location not set"}
            {vendor.distanceKm != null ? ` · ${vendor.distanceKm} km` : ""}
          </p>
        </div>
      </div>
    </Link>
  );
}
