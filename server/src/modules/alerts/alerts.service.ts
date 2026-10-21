// Generates smart alerts from farm context. Called when alerts are listed; a
// scheduled job can call `refreshAlerts` for every user once push notifications land.
import type { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { getWeather } from "../weather/weather.service.js";

const DAY = 86_400_000;

export async function refreshAlerts(userId: string) {
  const farms = await prisma.farm.findMany({
    where: { ownerId: userId },
    include: { crops: { include: { crop: { select: { name: true } } } } },
  });
  const today = new Date().toISOString().slice(0, 10);
  const alerts: Prisma.AlertCreateManyInput[] = [];

  for (const farm of farms) {
    const weather = await getWeather({ lat: farm.lat, lon: farm.lon }).catch(() => null);
    for (const a of weather?.advisories ?? []) {
      if (a.level === "info") continue;
      alerts.push({
        userId,
        farmId: farm.id,
        type: "WEATHER",
        level: a.level,
        title: `${farm.name}: ${a.title}`,
        body: `${a.action} ${a.reason}`,
        dedupeKey: `wx:${farm.id}:${a.id}:${today}`,
      });
    }

    for (const fc of farm.crops) {
      if (!fc.expectedHarvestAt) continue;
      const daysLeft = Math.round((fc.expectedHarvestAt.getTime() - Date.now()) / DAY);
      if (daysLeft >= 0 && daysLeft <= 14) {
        alerts.push({
          userId,
          farmId: farm.id,
          type: "HARVEST",
          level: "info",
          title: `${fc.crop.name} harvest approaching on ${farm.name}`,
          body: `Expected in about ${daysLeft} day${daysLeft === 1 ? "" : "s"}. Arrange labour, bags and storage now.`,
          dedupeKey: `harvest:${fc.id}`,
        });
      }
    }
  }

  if (alerts.length) await prisma.alert.createMany({ data: alerts, skipDuplicates: true });
}
