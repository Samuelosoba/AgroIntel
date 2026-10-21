// Weather from Open-Meteo (free, no API key, global coverage).
import type { CurrentWeather, DailyForecast, GeoPoint, WeatherReport } from "@agrointel/shared";
import { HttpError } from "../../lib/http-error.js";
import { buildAdvisories } from "./advisor.js";

const CACHE_TTL_MS = 10 * 60 * 1000;
const cache = new Map<string, { at: number; report: WeatherReport }>();

// WMO weather interpretation codes → plain words.
const CONDITIONS: [number[], string][] = [
  [[0], "Clear sky"],
  [[1, 2], "Partly cloudy"],
  [[3], "Overcast"],
  [[45, 48], "Fog"],
  [[51, 53, 55, 56, 57], "Drizzle"],
  [[61, 63, 66, 80, 81], "Rain"],
  [[65, 67, 82], "Heavy rain"],
  [[95, 96, 99], "Thunderstorm"],
];

const describe = (code: number) => CONDITIONS.find(([codes]) => codes.includes(code))?.[1] ?? "Unknown";

export async function getWeather({ lat, lon }: GeoPoint): Promise<WeatherReport> {
  const key = `${lat.toFixed(2)},${lon.toFixed(2)}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) return hit.report;

  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.search = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    current: "temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m,is_day",
    daily:
      "weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,wind_speed_10m_max,sunrise,sunset",
    timezone: "auto",
    forecast_days: "7",
  }).toString();

  const res = await fetch(url);
  if (!res.ok) throw new HttpError(502, "Weather service is unavailable, try again shortly");
  const raw = (await res.json()) as OpenMeteoResponse;

  const current: CurrentWeather = {
    temperatureC: raw.current.temperature_2m,
    humidity: raw.current.relative_humidity_2m,
    windKph: raw.current.wind_speed_10m,
    rainMm: raw.current.precipitation,
    condition: describe(raw.current.weather_code),
    isDay: raw.current.is_day === 1,
  };

  const d = raw.daily;
  const daily: DailyForecast[] = d.time.map((date, i) => ({
    date,
    tempMaxC: d.temperature_2m_max[i],
    tempMinC: d.temperature_2m_min[i],
    rainMm: d.precipitation_sum[i] ?? 0,
    rainChance: d.precipitation_probability_max[i] ?? 0,
    windMaxKph: d.wind_speed_10m_max[i],
    condition: describe(d.weather_code[i]),
    sunrise: d.sunrise[i],
    sunset: d.sunset[i],
  }));

  const report: WeatherReport = {
    location: { lat, lon },
    current,
    daily,
    advisories: buildAdvisories(current, daily),
    fetchedAt: new Date().toISOString(),
  };
  cache.set(key, { at: Date.now(), report });
  return report;
}

interface OpenMeteoResponse {
  current: {
    temperature_2m: number;
    relative_humidity_2m: number;
    precipitation: number;
    weather_code: number;
    wind_speed_10m: number;
    is_day: number;
  };
  daily: {
    time: string[];
    weather_code: number[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    precipitation_sum: (number | null)[];
    precipitation_probability_max: (number | null)[];
    wind_speed_10m_max: number[];
    sunrise: string[];
    sunset: string[];
  };
}
