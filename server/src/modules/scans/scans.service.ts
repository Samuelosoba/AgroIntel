import type { Prisma, ScanStatus } from "@prisma/client";
import type { PredictionCandidate, QualityReport, ScanResult, Severity } from "@agrointel/shared";
import { env } from "../../config/env.js";
import { prisma } from "../../lib/prisma.js";
import { saveImage } from "../../lib/storage.js";
import { toDiseaseInfo } from "../crops/crops.mapper.js";
import { analyzeDisease } from "./ai-client.js";

export interface NewScan {
  userId: string;
  image: Buffer;
  mimeType: string;
  crop?: string;
  farmId?: string;
  lat?: number;
  lon?: number;
  description?: string;
}

/** Confidence policy: never present a low-confidence guess as a diagnosis. */
export function decideStatus(qualityOk: boolean, topConfidence: number | undefined): ScanStatus {
  if (!qualityOk || topConfidence == null) return "REJECTED_QUALITY";
  return topConfidence >= env.CONFIDENCE_CONFIDENT ? "CONFIDENT" : "LOW_CONFIDENCE";
}

const humanize = (label: string) =>
  label
    .split("__")
    .pop()!
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

export async function createScan(input: NewScan): Promise<ScanResult> {
  const analysis = await analyzeDisease(input.image, input.mimeType, input.crop);
  const imageUrl = await saveImage(input.image, input.mimeType, "scans");

  const topK = analysis.prediction?.top_k ?? [];
  const status = decideStatus(analysis.quality.usable, topK[0]?.confidence);

  if (analysis.model) {
    await prisma.modelVersion.upsert({
      where: { version: analysis.model.version },
      update: {},
      create: { version: analysis.model.version, task: analysis.model.task, metrics: {}, isActive: true },
    });
  }

  const top = topK[0];
  const scan = await prisma.scan.create({
    data: {
      userId: input.userId,
      farmId: input.farmId,
      cropKey: input.crop ?? top?.label.split("__")[0],
      imageUrl,
      lat: input.lat,
      lon: input.lon,
      description: input.description,
      status,
      predictedLabel: top?.label,
      confidence: top?.confidence,
      severity: analysis.prediction?.severity,
      candidates: topK as Prisma.InputJsonValue,
      quality: analysis.quality as unknown as Prisma.InputJsonValue,
      modelVersionId: analysis.model?.version,
    },
  });

  if (status === "CONFIDENT" && top && !top.label.endsWith("__healthy")) {
    const disease = await prisma.disease.findUnique({ where: { key: top.label } });
    await prisma.alert.create({
      data: {
        userId: input.userId,
        farmId: input.farmId,
        type: "DISEASE",
        level: analysis.prediction?.severity === "severe" ? "warning" : "watch",
        title: `${disease?.name ?? humanize(top.label)} detected`,
        body: "Open the scan to see treatment steps, and rescan in a few days to track progress.",
        dedupeKey: `scan:${scan.id}`,
      },
    });
  }

  return getScan(scan.id, input.userId);
}

export async function getScan(id: string, userId?: string): Promise<ScanResult> {
  const scan = await prisma.scan.findFirstOrThrow({
    where: { id, ...(userId && { userId }) },
    include: { feedback: true, review: true },
  });

  const candidatesRaw = scan.candidates as { label: string; confidence: number }[];
  const confirmedLabel = scan.review?.status === "RESOLVED" ? scan.review.confirmedLabel : null;
  const labels = [...new Set([...candidatesRaw.map((c) => c.label), confirmedLabel].filter(Boolean) as string[])];
  const diseases = await prisma.disease.findMany({ where: { key: { in: labels } } });
  const byKey = new Map(diseases.map((d) => [d.key, d]));
  const nameOf = (label: string) => byKey.get(label)?.name ?? humanize(label);

  const candidates: PredictionCandidate[] = candidatesRaw.map((c) => ({ ...c, name: nameOf(c.label) }));
  // Knowledge is only attached when we're confident (or an expert confirmed it).
  const knowledgeKey = confirmedLabel ?? (scan.status === "CONFIDENT" ? scan.predictedLabel : null);
  const disease = knowledgeKey ? byKey.get(knowledgeKey) : undefined;

  return {
    id: scan.id,
    status: scan.status,
    createdAt: scan.createdAt.toISOString(),
    imageUrl: scan.imageUrl,
    crop: scan.cropKey,
    quality: scan.quality as unknown as QualityReport,
    prediction:
      scan.predictedLabel && scan.confidence != null
        ? {
            label: scan.predictedLabel,
            name: nameOf(scan.predictedLabel),
            confidence: scan.confidence,
            severity: scan.severity as Severity | null,
          }
        : null,
    candidates,
    disease: disease ? toDiseaseInfo(disease) : null,
    modelVersion: scan.modelVersionId,
    feedback: scan.feedback ? { isCorrect: scan.feedback.isCorrect, correctedLabel: scan.feedback.correctedLabel } : null,
  };
}
