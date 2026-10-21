import { Router } from "express";
import { prisma } from "../../lib/prisma.js";
import { notFound } from "../../lib/http-error.js";
import { toDiseaseInfo } from "../crops/crops.mapper.js";

const router = Router();

router.get("/", async (req, res) => {
  const crop = typeof req.query.crop === "string" ? req.query.crop : undefined;
  const diseases = await prisma.disease.findMany({
    where: { cropKey: crop, isHealthy: false },
    orderBy: { name: "asc" },
  });
  res.json(diseases.map(toDiseaseInfo));
});

router.get("/:key", async (req, res) => {
  const disease = await prisma.disease.findUnique({ where: { key: req.params.key } });
  if (!disease) throw notFound("Disease");
  res.json({ ...toDiseaseInfo(disease), conditions: disease.conditions, similarKeys: disease.similarKeys });
});

export default router;
