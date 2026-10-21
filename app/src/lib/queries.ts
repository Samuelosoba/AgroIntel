// Shared data hooks. Feature folders import from here so caching keys stay consistent.
import { useQuery } from "@tanstack/react-query";
import type { Alert, CropRecommendation, CropSummary, Farm, GeoPoint, ScanResult, WeatherReport } from "@agrointel/shared";
import { api } from "./api";

export const useFarms = () => useQuery({ queryKey: ["farms"], queryFn: () => api<Farm[]>("/farms") });

export const useCrops = () =>
  useQuery({ queryKey: ["crops"], queryFn: () => api<CropSummary[]>("/crops"), staleTime: Infinity });

export const useWeather = (at: GeoPoint | null) =>
  useQuery({
    queryKey: ["weather", at?.lat.toFixed(2), at?.lon.toFixed(2)],
    queryFn: () => api<WeatherReport>(`/weather?lat=${at!.lat}&lon=${at!.lon}`),
    enabled: !!at,
    staleTime: 10 * 60 * 1000,
  });

export const useRecommendations = (at: GeoPoint | null, country: string, farmId?: string) =>
  useQuery({
    queryKey: ["recommendations", at?.lat.toFixed(2), at?.lon.toFixed(2), country, farmId],
    queryFn: () =>
      api<CropRecommendation[]>(
        `/crops/recommendations?lat=${at!.lat}&lon=${at!.lon}&country=${country}${farmId ? `&farmId=${farmId}` : ""}`,
      ),
    enabled: !!at,
    staleTime: 30 * 60 * 1000,
  });

export const useAlerts = () => useQuery({ queryKey: ["alerts"], queryFn: () => api<Alert[]>("/alerts") });

export const useScans = () => useQuery({ queryKey: ["scans"], queryFn: () => api<ScanResult[]>("/scans") });
