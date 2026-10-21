import { useEffect, useState } from "react";
import type { Farm, GeoPoint } from "@agrointel/shared";

export interface ActiveLocation extends GeoPoint {
  name: string;
  source: "farm" | "gps" | "default";
  farmId?: string;
}

const fallback: ActiveLocation = {
  lat: Number(import.meta.env.VITE_DEFAULT_LAT ?? 9.0765),
  lon: Number(import.meta.env.VITE_DEFAULT_LON ?? 7.3986),
  name: import.meta.env.VITE_DEFAULT_PLACE ?? "Default location",
  source: "default",
};

/** The location the app reasons about: first farm → device GPS → configured default. */
export function useActiveLocation(farms: Farm[] | undefined): ActiveLocation | null {
  const [gps, setGps] = useState<GeoPoint | null>(null);
  const [gpsDone, setGpsDone] = useState(false);
  const farm = farms?.[0];

  useEffect(() => {
    if (farm || !navigator.geolocation) {
      setGpsDone(true);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setGps({ lat: p.coords.latitude, lon: p.coords.longitude });
        setGpsDone(true);
      },
      () => setGpsDone(true),
      { timeout: 8000, maximumAge: 30 * 60 * 1000 },
    );
  }, [farm]);

  if (farm) return { lat: farm.lat, lon: farm.lon, name: farm.locationName ?? farm.name, source: "farm", farmId: farm.id };
  if (gps) return { ...gps, name: "Your location", source: "gps" };
  if (farms && gpsDone) return fallback;
  return null;
}

export function currentPosition(): Promise<GeoPoint> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error("Location is not available on this device"));
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ lat: p.coords.latitude, lon: p.coords.longitude }),
      () => reject(new Error("Couldn't get your location. Allow location access and try again.")),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  });
}
