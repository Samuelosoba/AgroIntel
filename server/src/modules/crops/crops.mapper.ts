import type { Crop, Disease } from "@prisma/client";
import type { CropSummary, DiseaseInfo } from "@agrointel/shared";

export const toCropSummary = (c: Crop): CropSummary => ({
  key: c.key,
  name: c.name,
  localNames: c.localNames as Record<string, string>,
  category: c.category,
  growingDays: [c.growingDaysMin, c.growingDaysMax],
  waterNeed: c.waterNeed as CropSummary["waterNeed"],
});

export const toDiseaseInfo = (d: Disease): DiseaseInfo => ({
  key: d.key,
  name: d.name,
  crop: d.cropKey,
  isHealthy: d.isHealthy,
  summary: d.summary,
  symptoms: d.symptoms,
  causes: d.causes,
  treatment: d.treatment,
  prevention: d.prevention,
  monitoring: d.monitoring,
});
