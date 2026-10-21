import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma.js";
import { HttpError, notFound } from "../../lib/http-error.js";
import { currentUser, requireAuth } from "../../middleware/auth.js";
import { imageUpload } from "../../middleware/upload.js";
import { createScan, getScan } from "./scans.service.js";

const router = Router();
router.use(requireAuth);

const scanFields = z.object({
  crop: z.string().optional(),
  farmId: z.string().optional(),
  lat: z.coerce.number().optional(),
  lon: z.coerce.number().optional(),
  description: z.string().max(1000).optional(),
});

const feedbackSchema = z.object({
  isCorrect: z.boolean(),
  correctedLabel: z.string().optional(),
  notes: z.string().max(1000).optional(),
});

async function ownedScan(id: string, userId: string) {
  const scan = await prisma.scan.findFirst({ where: { id, userId } });
  if (!scan) throw notFound("Scan");
  return scan;
}

router.post("/", imageUpload.single("image"), async (req, res) => {
  if (!req.file) throw new HttpError(400, "Please add a photo of the plant");
  const fields = scanFields.parse(req.body);
  const result = await createScan({
    ...fields,
    userId: currentUser(req).id,
    image: req.file.buffer,
    mimeType: req.file.mimetype,
  });
  res.status(201).json(result);
});

router.get("/", async (req, res) => {
  const scans = await prisma.scan.findMany({
    where: { userId: currentUser(req).id },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: { id: true },
  });
  res.json(await Promise.all(scans.map((s) => getScan(s.id))));
});

router.get("/:id", async (req, res) => {
  await ownedScan(req.params.id, currentUser(req).id);
  res.json(await getScan(req.params.id));
});

router.post("/:id/feedback", async (req, res) => {
  const scan = await ownedScan(req.params.id, currentUser(req).id);
  const data = feedbackSchema.parse(req.body);
  await prisma.scanFeedback.upsert({ where: { scanId: scan.id }, update: data, create: { ...data, scanId: scan.id } });
  res.json(await getScan(scan.id));
});

router.post("/:id/review", async (req, res) => {
  const scan = await ownedScan(req.params.id, currentUser(req).id);
  if (scan.status === "REJECTED_QUALITY") throw new HttpError(400, "Please retake the photo before requesting a review");
  await prisma.$transaction([
    prisma.expertReview.upsert({ where: { scanId: scan.id }, update: {}, create: { scanId: scan.id } }),
    prisma.scan.update({ where: { id: scan.id }, data: { status: "PENDING_REVIEW" } }),
  ]);
  res.json(await getScan(scan.id));
});

export default router;
