import { useEffect, useState } from "react";
import * as Location from "expo-location";
import type { Farm, GeoPoint } from "@agrointel/shared";

export interface ActiveLocation extends GeoPoint {
  name: string;
  source: "farm" | "gps" | "default";
  farmId?: string;
}

const fallback: ActiveLocation = {
  lat: Number(process.env.EXPO_PUBLIC_DEFAULT_LAT ?? 9.0765),
  lon: Number(process.env.EXPO_PUBLIC_DEFAULT_LON ?? 7.3986),
  name: process.env.EXPO_PUBLIC_DEFAULT_PLACE ?? "Default location",
  source: "default",
};

/** Asks for permission, then returns the device position (last known first — it's instant). */
export async function currentPosition(precise = false): Promise<GeoPoint> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== "granted") throw new Error("Location permission is off. Turn it on in Settings to use your location.");
  const last = precise ? null : await Location.getLastKnownPositionAsync();
  const pos = last ?? (await Location.getCurrentPositionAsync({ accuracy: precise ? Location.Accuracy.High : Location.Accuracy.Balanced }));
  return { lat: pos.coords.latitude, lon: pos.coords.longitude };
}

/** The location the app reasons about: first farm → device GPS → configured default. */
export function useActiveLocation(farms: Farm[] | undefined): ActiveLocation | null {
  const [gps, setGps] = useState<GeoPoint | null>(null);
  const [gpsDone, setGpsDone] = useState(false);
  const farm = farms?.[0];

  useEffect(() => {
    if (farm) return;
    currentPosition()
      .then(setGps)
      .catch(() => undefined)
      .finally(() => setGpsDone(true));
  }, [farm]);

  if (farm) return { lat: farm.lat, lon: farm.lon, name: farm.locationName ?? farm.name, source: "farm", farmId: farm.id };
  if (gps) return { ...gps, name: "Your location", source: "gps" };
  if (farms && gpsDone) return fallback;
  return null;
}
