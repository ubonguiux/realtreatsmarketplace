import { useMemo, useState } from "react";
import { Crosshair, MapPin, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { CITY_PRESETS, isValidCoords, nearestCity, staticMapEmbed } from "@/lib/geo";
import { GOOGLE_MAPS_BROWSER_KEY, mapsConfigured } from "@/lib/marketplace";

export type LocationFieldValue = {
  latitude: number | null;
  longitude: number | null;
  city?: string | null;
  state?: string | null;
};

/**
 * Reusable coordinate picker: current location or city selection.
 * Users never type raw latitude/longitude.
 */
export function LocationField({
  value,
  onChange,
  label = "Location",
  description,
}: {
  value: LocationFieldValue;
  onChange: (next: LocationFieldValue) => void;
  label?: string;
  description?: string;
}) {
  const [term, setTerm] = useState("");
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = Boolean(isValidCoords(value.latitude, value.longitude));

  const matches = useMemo(
    () =>
      term
        ? CITY_PRESETS.filter((c) => `${c.city} ${c.state}`.toLowerCase().includes(term.toLowerCase())).slice(0, 6)
        : [],
    [term],
  );

  // When a city is already typed but no pin is set, offer it as a one-tap suggestion.
  const cityHint = useMemo(() => {
    if (set || !value.city) return null;
    const target = value.city.trim().toLowerCase();
    return CITY_PRESETS.find((c) => c.city.toLowerCase() === target) ?? null;
  }, [set, value.city]);

  const mapSrc = useMemo(() => {
    if (!set) return null;
    const lat = value.latitude as number;
    const lng = value.longitude as number;
    if (mapsConfigured) {
      return `https://www.google.com/maps/embed/v1/view?key=${GOOGLE_MAPS_BROWSER_KEY}&center=${lat},${lng}&zoom=14`;
    }
    return staticMapEmbed([{ lat, lng }]);
  }, [set, value.latitude, value.longitude]);

  const useCurrent = () => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setError("This browser can't share location. Pick your city instead.");
      return;
    }
    setLocating(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        if (!isValidCoords(lat, lng)) {
          setError("We received an invalid position. Pick your city instead.");
          return;
        }
        const near = nearestCity({ lat, lng });
        onChange({
          latitude: lat,
          longitude: lng,
          city: value.city || near.city,
          state: value.state || near.state,
        });
      },
      (err) => {
        setLocating(false);
        setError(
          err.code === err.PERMISSION_DENIED
            ? "Location permission denied. You can pick your city instead."
            : "We couldn't read your location. Pick your city instead.",
        );
      },
      { timeout: 10000, enableHighAccuracy: true, maximumAge: 60000 },
    );
  };

  return (
    <div className="rounded-lg border border-border p-4">
      <div className="flex items-center justify-between gap-2">
        <Label>{label}</Label>
        <Badge variant={set ? "secondary" : "outline"} className="gap-1">
          <MapPin className="h-3 w-3" />
          {set ? "Location set" : "Location not set"}
        </Badge>
      </div>
      {description ? <p className="mt-1 text-xs text-muted-foreground">{description}</p> : null}

      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <Button type="button" variant="outline" className="gap-2" onClick={useCurrent} disabled={locating}>
          <Crosshair className="h-4 w-4" />
          {locating ? "Getting location…" : "Use my current location"}
        </Button>
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-8"
            placeholder="Or search a city, e.g. Uyo"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
          />
        </div>
      </div>

      {matches.length ? (
        <div className="mt-2 space-y-1">
          {matches.map((c) => (
            <button
              key={`${c.city}-${c.state}`}
              type="button"
              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm hover:bg-muted"
              onClick={() => {
                onChange({ latitude: c.lat, longitude: c.lng, city: c.city, state: c.state });
                setTerm("");
                setError(null);
              }}
            >
              <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
              {c.city}, {c.state}
            </button>
          ))}
        </div>
      ) : null}

      {error ? <p className="mt-2 text-xs text-destructive">{error}</p> : null}

      {set && mapSrc ? (
        <div className="mt-3 overflow-hidden rounded-md border border-border">
          <iframe
            title="Selected location preview"
            src={mapSrc}
            className="h-44 w-full"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      ) : null}

      {set ? (
        <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
          <span>
            {(value.latitude as number).toFixed(5)}, {(value.longitude as number).toFixed(5)}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onChange({ latitude: null, longitude: null, city: value.city ?? null, state: value.state ?? null })}
          >
            Clear
          </Button>
        </div>
      ) : null}
    </div>
  );
}
