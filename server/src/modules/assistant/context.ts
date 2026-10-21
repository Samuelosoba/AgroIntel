// Builds the farmer context the assistant reasons with: location, weather,
// farms, crops and recent scans. Kept as plain text so it's easy to audit.
import { prisma } from "../../lib/prisma.js";
import { getWeather } from "../weather/weather.service.js";

export async function buildFarmerContext(userId: string): Promise<string> {
  const [user, farms, scans] = await Promise.all([
    prisma.user.findUniqueOrThrow({ where: { id: userId }, include: { country: true } }),
    prisma.farm.findMany({ where: { ownerId: userId }, include: { crops: { include: { crop: true } } }, take: 5 }),
    prisma.scan.findMany({
      where: { userId, status: { in: ["CONFIDENT", "VERIFIED"] } },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  const lines = [
    `Today: ${new Date().toDateString()}`,
    `Farmer: ${user.name}, country: ${user.country.name}, preferred language: ${user.language}`,
  ];

  for (const farm of farms) {
    const crops = farm.crops
      .map((c) => `${c.crop.name}${c.plantedAt ? ` (planted ${c.plantedAt.toDateString()})` : ""}`)
      .join(", ");
    lines.push(
      `Farm "${farm.name}" at ${farm.locationName ?? `${farm.lat.toFixed(2)}, ${farm.lon.toFixed(2)}`}` +
        `${farm.sizeHa ? `, ${farm.sizeHa} ha` : ""}${farm.soilType ? `, ${farm.soilType} soil` : ""}` +
        `${farm.soil ? `, soil test ${JSON.stringify(farm.soil)}` : ""}. Crops: ${crops || "none recorded"}.`,
    );
  }

  const primary = farms[0];
  if (primary) {
    const w = await getWeather({ lat: primary.lat, lon: primary.lon }).catch(() => null);
    if (w) {
      const week = w.daily.map((d) => `${d.date}: ${d.condition}, ${Math.round(d.tempMinC)}–${Math.round(d.tempMaxC)}°C, rain ${d.rainMm}mm (${d.rainChance}%)`);
      lines.push(`Weather at ${primary.name} now: ${w.current.condition}, ${w.current.temperatureC}°C, humidity ${w.current.humidity}%.`);
      lines.push(`7-day forecast:\n${week.join("\n")}`);
    }
  }

  if (scans.length) {
    lines.push(
      "Recent plant scans:\n" +
        scans
          .map((s) => `${s.createdAt.toDateString()}: ${s.predictedLabel} (${Math.round((s.confidence ?? 0) * 100)}% confidence, ${s.status.toLowerCase()})`)
          .join("\n"),
    );
  }

  return lines.join("\n");
}
