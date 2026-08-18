import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { nearestCity, type SelectedLocation } from "@/lib/geo";

const STORAGE_KEY = "realtreats.location.v1";
const RADIUS_KEY = "realtreats.radius.v1";

type PermissionState = "unknown" | "prompt" | "granted" | "denied" | "unsupported";

type LocationValue = {
  location: SelectedLocation | null;
  radius: number;
  ready: boolean;
  locating: boolean;
  permission: PermissionState;
  error: string | null;
  setRadius: (km: number) => void;
  setLocation: (loc: SelectedLocation) => void;
  clearLocation: () => void;
  useMyLocation: () => Promise<SelectedLocation | null>;
};

const Ctx = createContext<LocationValue | null>(null);

export function LocationProvider({ children }: { children: ReactNode }) {
  const [location, setLocationState] = useState<SelectedLocation | null>(null);
  const [radius, setRadiusState] = useState(10);
  const [ready, setReady] = useState(false);
  const [locating, setLocating] = useState(false);
  const [permission, setPermission] = useState<PermissionState>("unknown");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setLocationState(JSON.parse(raw) as SelectedLocation);
      const r = window.localStorage.getItem(RADIUS_KEY);
      if (r) setRadiusState(Number(r) || 10);
    } catch {
      /* ignore */
    }
    setReady(true);
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setPermission("unsupported");
    } else if (navigator.permissions?.query) {
      navigator.permissions
        .query({ name: "geolocation" as PermissionName })
        .then((s) => setPermission(s.state as PermissionState))
        .catch(() => setPermission("prompt"));
    }
  }, []);

  const setLocation = useCallback((loc: SelectedLocation) => {
    setLocationState(loc);
    setError(null);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(loc));
    } catch {
      /* ignore */
    }
  }, []);

  const clearLocation = useCallback(() => {
    setLocationState(null);
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }, []);

  const setRadius = useCallback((km: number) => {
    setRadiusState(km);
    try {
      window.localStorage.setItem(RADIUS_KEY, String(km));
    } catch {
      /* ignore */
    }
  }, []);

  const useMyLocation = useCallback(async () => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setPermission("unsupported");
      setError("Your browser does not support location sharing. Choose a city instead.");
      return null;
    }
    setLocating(true);
    setError(null);
    return new Promise<SelectedLocation | null>((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const point = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          const near = nearestCity(point);
          const next: SelectedLocation = {
            ...point,
            label: `Current location · near ${near.city}`,
            city: near.city,
            state: near.state,
            source: "gps",
          };
          setPermission("granted");
          setLocation(next);
          setLocating(false);
          resolve(next);
        },
        (err) => {
          setLocating(false);
          setPermission(err.code === err.PERMISSION_DENIED ? "denied" : "prompt");
          setError(
            err.code === err.PERMISSION_DENIED
              ? "Location permission was denied. You can pick your city manually instead."
              : "We couldn't read your location. Pick your city manually instead.",
          );
          resolve(null);
        },
        { timeout: 10000, enableHighAccuracy: true, maximumAge: 60000 },
      );
    });
  }, [setLocation]);

  const value = useMemo<LocationValue>(
    () => ({ location, radius, ready, locating, permission, error, setRadius, setLocation, clearLocation, useMyLocation }),
    [location, radius, ready, locating, permission, error, setRadius, setLocation, clearLocation, useMyLocation],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useLocationContext() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useLocationContext must be used inside LocationProvider");
  return ctx;
}
