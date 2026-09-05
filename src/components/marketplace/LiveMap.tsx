import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";

export type LiveMapPoint = {
  id: string;
  lat: number;
  lng: number;
  label: string;
  detail?: string | null;
  tone?: "active" | "idle" | "drop";
};

const COLORS: Record<string, string> = {
  active: "#15803d",
  idle: "#a16207",
  drop: "#1d4ed8",
};

/** Browser-only live map. Render behind <ClientOnly> via React.lazy. */
export default function LiveMap({ points, height = 380 }: { points: LiveMapPoint[]; height?: number }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const layerRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const LRef = useRef<any>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !containerRef.current || mapRef.current) return;
      LRef.current = L;
      const map = L.map(containerRef.current, { scrollWheelZoom: false }).setView([9.082, 8.6753], 6);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
        maxZoom: 19,
      }).addTo(map);
      layerRef.current = L.layerGroup().addTo(map);
      mapRef.current = map;
      draw();
    })();
    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function draw() {
    const L = LRef.current;
    const map = mapRef.current;
    const layer = layerRef.current;
    if (!L || !map || !layer) return;
    layer.clearLayers();
    const valid = points.filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng));
    valid.forEach((p) => {
      L.circleMarker([p.lat, p.lng], {
        radius: 9,
        weight: 3,
        color: COLORS[p.tone ?? "active"] ?? COLORS["active"],
        fillColor: COLORS[p.tone ?? "active"] ?? COLORS["active"],
        fillOpacity: 0.55,
      })
        .bindTooltip(`<strong>${p.label}</strong>${p.detail ? `<br/>${p.detail}` : ""}`, { direction: "top" })
        .addTo(layer);
    });
    if (valid.length === 1) {
      map.setView([valid[0]!.lat, valid[0]!.lng], 13);
    } else if (valid.length > 1) {
      map.fitBounds(
        L.latLngBounds(valid.map((p) => [p.lat, p.lng] as [number, number])).pad(0.25),
        { maxZoom: 14 },
      );
    }
  }

  useEffect(draw, [points]);

  return <div ref={containerRef} style={{ height }} className="w-full overflow-hidden rounded-lg border border-border" />;
}
