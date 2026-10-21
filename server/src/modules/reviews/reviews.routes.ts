// Expert review queue + export of verified cases for model retraining.
import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma.js";
import { notFound } from "../../lib/http-error.js";
import { currentUser, requireAuth, requireRole } from "../../middleware/auth.js";

const router = Router();
router.use(requireAuth, requireRole("EXPERT", "ADMIN"));

const resolveSchema = z.object({
  confirmedLabel: z.string(),
  notes: z.string().optional(),
  recommendations: z.array(z.string()).default([]),
  useForTraining: z.boolean().default(true),
});

router.get("/", async (req, res) => {
  const status = req.query.status === "RESOLVED" ? "RESOLVED" : "OPEN";
  const reviews = await prisma.expertReview.findMany({
    where: { status },
    orderBy: { createdAt: "asc" },
    include: {
      scan: {
        select: {
          id: true, imageUrl: true, cropKey: true, predictedLabel: true, confidence: true,
          candidates: true, lat: true, lon: true, description: true, createdAt: true,
          farm: { select: { name: true, locationName: true } },
        },
      },
    },
  });
  res.json(reviews);
});

router.post("/:id/resolve", async (req, res) => {
  const data = resolveSchema.parse(req.body);
  const review = await prisma.expertReview.findUnique({ where: { id: req.params.id } });
  if (!review) throw notFound("Review");
  await prisma.$transaction([
    prisma.expertReview.update({
      where: { id: review.id },
      data: { ...data, status: "RESOLVED", reviewerId: currentUser(req).id, resolvedAt: new Date() },
    }),
    prisma.scan.update({ where: { id: review.scanId }, data: { status: "VERIFIED" } }),
  ]);
  res.json({ ok: true });
});

/** Verified images + labels, consumed by ml/ to grow the training set. */
router.get("/training-export", requireRole("ADMIN"), async (_req, res) => {
  const rows = await prisma.expertReview.findMany({
    where: { status: "RESOLVED", useForTraining: true, confirmedLabel: { not: null } },
    select: { confirmedLabel: true, resolvedAt: true, scan: { select: { id: true, imageUrl: true, modelVersionId: true, predictedLabel: true } } },
  });
  res.json(
    rows.map((r) => ({
      scanId: r.scan.id,
      imageUrl: r.scan.imageUrl,
      label: r.confirmedLabel,
      modelLabel: r.scan.predictedLabel,
      modelVersion: r.scan.modelVersionId,
      verifiedAt: r.resolvedAt,
    })),
  );
});

export default router;
