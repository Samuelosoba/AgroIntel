// Turns raw forecasts into farm decisions ("delay fertilizer", "don't spray today").
// Rules are deliberately simple and explainable; each advisory says *why*.
import type { Advisory, CurrentWeather, DailyForecast } from "@agrointel/shared";

const RANK = { warning: 0, watch: 1, info: 2 } as const;
const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);

export function buildAdvisories(current: CurrentWeather, daily: DailyForecast[]): Advisory[] {
  const out: Advisory[] = [];
  const [today, tomorrow] = daily;
  const next2 = daily.slice(0, 2);
  const next7Rain = sum(daily.map((d) => d.rainMm));
  const rain48 = sum(next2.map((d) => d.rainMm));

  if (rain48 >= 20) {
    out.push({
      id: "heavy-rain-fertilizer",
      level: "warning",
      title: "Delay fertilizer application",
      action: "Hold off on fertilizer and manure for the next 2 days.",
      reason: `About ${Math.round(rain48)} mm of rain is expected in 48 hours. Heavy rain washes nutrients away before roots can use them.`,
    });
  }

  if (tomorrow && tomorrow.rainChance >= 60) {
    out.push({
      id: "rain-spray",
      level: "watch",
      title: "Avoid spraying before rain",
      action: "Spray pesticides or fungicides only if they can dry for 4–6 hours first, or wait until after the rain.",
      reason: `${tomorrow.rainChance}% chance of rain tomorrow could wash chemicals off leaves.`,
    });
  }

  const windy = next2.some((d) => d.windMaxKph >= 25);
  if (windy) {
    out.push({
      id: "wind-drift",
      level: "watch",
      title: "Too windy to spray",
      action: "Spray early in the morning when wind is calm.",
      reason: "Strong wind blows spray away from your crop and onto people, animals and water.",
    });
  }

  const humidDays = daily.slice(0, 4).filter((d) => d.rainChance >= 50 && d.tempMaxC <= 32 && d.tempMinC >= 18);
  if (current.humidity >= 80 && humidDays.length >= 3) {
    out.push({
      id: "fungal-risk",
      level: "watch",
      title: "High risk of leaf diseases",
      action: "Scout tomato, pepper and maize leaves for spots and scan anything suspicious.",
      reason: "Several warm, humid, rainy days in a row favour blight, leaf spot and rust.",
    });
  }

  if (next7Rain < 5) {
    out.push({
      id: "dry-spell",
      level: "watch",
      title: "Dry week ahead",
      action: "Irrigate if you can, mulch to keep soil moist, and delay planting rain-fed crops.",
      reason: `Only ${next7Rain.toFixed(1)} mm of rain expected over 7 days.`,
    });
  }

  const hot = daily.slice(0, 3).find((d) => d.tempMaxC >= 36);
  if (hot) {
    out.push({
      id: "heat-stress",
      level: "warning",
      title: "Heat stress expected",
      action: "Water early morning or evening and give shade to nursery seedlings.",
      reason: `Temperatures up to ${Math.round(hot.tempMaxC)}°C can burn leaves and cause flowers to drop.`,
    });
  }

  if (today && today.rainChance < 30 && today.windMaxKph < 15 && rain48 < 5) {
    out.push({
      id: "spray-window",
      level: "info",
      title: "Good day for field work",
      action: "Today is a good window for spraying, weeding or applying fertilizer.",
      reason: "Low chance of rain and calm wind.",
    });
  }

  if (rain48 >= 10 && rain48 < 40 && next7Rain >= 25) {
    out.push({
      id: "planting-moisture",
      level: "info",
      title: "Good soil moisture for planting",
      action: "If it's planting season for your crop, the next few days are a good time to plant.",
      reason: "Steady rain is expected to keep the soil moist for germination.",
    });
  }

  return out.sort((a, b) => RANK[a.level] - RANK[b.level]);
}
