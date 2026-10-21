import { Router } from "express";
import { z } from "zod";
import type { Farm } from "@agrointel/shared";
import { prisma } from "../../lib/prisma.js";
import { notFound } from "../../lib/http-error.js";
import { getWeather } from "../weather/weather.service.js";
import { formatMonths, recommendCrops } from "./recommender.js";
import { toCropSummary, toDiseaseInfo } from "./crops.mapper.js";

const router = Router();

const recommendQuery = z.object({
  lat: z.coerce.number(),
  lon: z.coerce.number(),
  country: z.string().length(2).default("NG"),
  farmId: z.string().optional(),
});

router.get("/", async (_req, res) => {
  const crops = await prisma.crop.findMany({ orderBy: { name: "asc" } });
  res.json(crops.map(toCropSummary));
});

router.get("/recommendations", async (req, res) => {
  const { lat, lon, country, farmId } = recommendQuery.parse(req.query);
  const [weather, crops, farm] = await Promise.all([
    getWeather({ lat, lon }),
    prisma.crop.findMany({
      include: {
        calendars: { where: { countryCode: country, regionId: null } },
        diseases: { select: { name: true, isHealthy: true } },
      },
    }),
    farmId ? prisma.farm.findUnique({ where: { id: farmId }, select: { soilType: true, soil: true } }) : null,
  ]);
  const soil = farm ? { soilType: farm.soilType, soil: farm.soil as Farm["soil"] } : null;
  res.json(recommendCrops({ crops, weather, soil }));
});

router.get("/:key", async (req, res) => {
  const crop = await prisma.crop.findUnique({
    where: { key: req.params.key },
    include: { diseases: true, calendars: true },
  });
  if (!crop) throw notFound("Crop");
  res.json({
    ...toCropSummary(crop),
    tempRangeC: [crop.tempMinC, crop.tempMaxC],
    phRange: [crop.phMin, crop.phMax],
    soilTypes: crop.soilTypes,
    pestRisks: crop.pestRisks,
    calendars: crop.calendars.map((c) => ({
      countryCode: c.countryCode,
      planting: formatMonths(c.plantMonths),
      harvest: formatMonths(c.harvestMonths),
      notes: c.notes,
    })),
    diseases: crop.diseases.filter((d) => !d.isHealthy).map(toDiseaseInfo),
  });
});

export default router;
