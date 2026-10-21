import { Router } from "express";
import { z } from "zod";
import type { Farm } from "@agrointel/shared";
import { prisma } from "../../lib/prisma.js";
import { notFound } from "../../lib/http-error.js";
import { currentUser, requireAuth } from "../../middleware/auth.js";

const router = Router();
router.use(requireAuth);

const farmSchema = z.object({
  name: z.string().trim().min(1),
  lat: z.number().min(-90).max(90),
  lon: z.number().min(-180).max(180),
  locationName: z.string().optional(),
  sizeHa: z.number().positive().optional(),
  soilType: z.string().optional(),
  soil: z
    .object({
      ph: z.number().min(0).max(14).optional(),
      nitrogen: z.number().min(0).optional(),
      phosphorus: z.number().min(0).optional(),
      potassium: z.number().min(0).optional(),
      organicMatter: z.number().min(0).optional(),
    })
    .optional(),
});

const farmCropSchema = z.object({
  cropKey: z.string(),
  plantedAt: z.coerce.date().optional(),
  expectedHarvestAt: z.coerce.date().optional(),
});

const include = { crops: { include: { crop: { select: { name: true } } } } } as const;

type FarmRow = Awaited<ReturnType<typeof findOwnedFarm>>;

function toFarm(f: FarmRow): Farm {
  return {
    id: f.id,
    name: f.name,
    lat: f.lat,
    lon: f.lon,
    locationName: f.locationName,
    sizeHa: f.sizeHa,
    soilType: f.soilType,
    soil: f.soil as Farm["soil"],
    crops: f.crops.map((c) => ({
      id: c.id,
      cropKey: c.cropKey,
      cropName: c.crop.name,
      plantedAt: c.plantedAt?.toISOString() ?? null,
      expectedHarvestAt: c.expectedHarvestAt?.toISOString() ?? null,
    })),
  };
}

async function findOwnedFarm(id: string, ownerId: string) {
  const farm = await prisma.farm.findFirst({ where: { id, ownerId }, include });
  if (!farm) throw notFound("Farm");
  return farm;
}

router.get("/", async (req, res) => {
  const farms = await prisma.farm.findMany({
    where: { ownerId: currentUser(req).id },
    include,
    orderBy: { createdAt: "asc" },
  });
  res.json(farms.map(toFarm));
});

router.post("/", async (req, res) => {
  const data = farmSchema.parse(req.body);
  const farm = await prisma.farm.create({ data: { ...data, ownerId: currentUser(req).id }, include });
  res.status(201).json(toFarm(farm));
});

router.get("/:id", async (req, res) => {
  res.json(toFarm(await findOwnedFarm(req.params.id, currentUser(req).id)));
});

router.patch("/:id", async (req, res) => {
  await findOwnedFarm(req.params.id, currentUser(req).id);
  const farm = await prisma.farm.update({
    where: { id: req.params.id },
    data: farmSchema.partial().parse(req.body),
    include,
  });
  res.json(toFarm(farm));
});

router.delete("/:id", async (req, res) => {
  await findOwnedFarm(req.params.id, currentUser(req).id);
  await prisma.farm.delete({ where: { id: req.params.id } });
  res.status(204).end();
});

router.post("/:id/crops", async (req, res) => {
  const farm = await findOwnedFarm(req.params.id, currentUser(req).id);
  const data = farmCropSchema.parse(req.body);
  let { expectedHarvestAt } = data;
  if (!expectedHarvestAt && data.plantedAt) {
    const crop = await prisma.crop.findUnique({ where: { key: data.cropKey } });
    if (!crop) throw notFound("Crop");
    const days = Math.round((crop.growingDaysMin + crop.growingDaysMax) / 2);
    expectedHarvestAt = new Date(data.plantedAt.getTime() + days * 86_400_000);
  }
  await prisma.farmCrop.create({ data: { ...data, expectedHarvestAt, farmId: farm.id } });
  res.status(201).json(toFarm(await findOwnedFarm(farm.id, currentUser(req).id)));
});

router.delete("/:id/crops/:farmCropId", async (req, res) => {
  const farm = await findOwnedFarm(req.params.id, currentUser(req).id);
  await prisma.farmCrop.deleteMany({ where: { id: req.params.farmCropId, farmId: farm.id } });
  res.status(204).end();
});

export default router;
