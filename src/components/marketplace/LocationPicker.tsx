import { useState } from "react";
import { Crosshair, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { CITY_PRESETS, RADIUS_OPTIONS } from "@/lib/geo";
import { useLocationContext } from "@/hooks/useLocationContext";
import { cn } from "@/lib/utils";

export function LocationPicker({ className, compact }: { className?: string; compact?: boolean }) {
  const { location, radius, setRadius, setLocation, useMyLocation, locating, error, clearLocation } = useLocationContext();
  const [open, setOpen] = useState(false);
  const [term, setTerm] = useState("");

  const matches = CITY_PRESETS.filter(
    (c) => !term || `${c.city} ${c.state}`.toLowerCase().includes(term.toLowerCase()),
  ).slice(0, 8);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className={cn("gap-1.5 px-2 text-left", className)}>
          <MapPin className="h-4 w-4 shrink-0 text-primary" />
          <span className="max-w-[10rem] truncate text-xs sm:text-sm">
            {location ? location.label : "Set delivery location"}
          </span>
          {!compact && location ? <span className="hidden text-xs text-muted-foreground sm:inline">· {radius} km</span> : null}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Where should we deliver?</DialogTitle>
          <DialogDescription>
            We use your location to show vendors and products that can actually reach you, and to estimate delivery.
          </DialogDescription>
        </DialogHeader>

        <Button onClick={() => useMyLocation()} disabled={locating} className="w-full gap-2">
          <Crosshair className="h-4 w-4" />
          {locating ? "Getting your location…" : "Use my current location"}
        </Button>
        {error ? <p className="text-xs text-destructive">{error}</p> : null}

        <div>
          <Label htmlFor="loc-search">Or search a city</Label>
          <Input
            id="loc-search"
            className="mt-1.5"
            placeholder="e.g. Uyo"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
          />
          <div className="mt-2 max-h-56 space-y-1 overflow-y-auto">
            {matches.map((c) => (
              <button
                key={`${c.city}-${c.state}`}
                type="button"
                onClick={() => {
                  setLocation({ lat: c.lat, lng: c.lng, label: `${c.city}, ${c.state}`, city: c.city, state: c.state, source: "manual" });
                  setOpen(false);
                }}
                className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm hover:bg-muted"
              >
                <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                {c.city}, {c.state}
              </button>
            ))}
            {!matches.length ? (
              <p className="px-1 py-2 text-xs text-muted-foreground">
                No match. Try a nearby major city, or use your current location.
              </p>
            ) : null}
          </div>
        </div>

        <div>
          <Label>Search radius</Label>
          <div className="mt-1.5 flex flex-wrap gap-2">
            {RADIUS_OPTIONS.map((r) => (
              <Button key={r} type="button" size="sm" variant={radius === r ? "default" : "outline"} onClick={() => setRadius(r)}>
                {r} km
              </Button>
            ))}
          </div>
        </div>

        {location ? (
          <Button variant="ghost" size="sm" onClick={() => { clearLocation(); setOpen(false); }}>
            Clear location
          </Button>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
