import { Router } from "express";
import type { Alert } from "@agrointel/shared";
import { prisma } from "../../lib/prisma.js";
import { currentUser, requireAuth } from "../../middleware/auth.js";
import { refreshAlerts } from "./alerts.service.js";

const router = Router();
router.use(requireAuth);

router.get("/", async (req, res) => {
  const userId = currentUser(req).id;
  await refreshAlerts(userId);
  const rows = await prisma.alert.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 30 });
  const alerts: Alert[] = rows.map((a) => ({
    id: a.id,
    type: a.type,
    level: a.level as Alert["level"],
    title: a.title,
    body: a.body,
    createdAt: a.createdAt.toISOString(),
    readAt: a.readAt?.toISOString() ?? null,
  }));
  res.json(alerts);
});

router.post("/:id/read", async (req, res) => {
  await prisma.alert.updateMany({
    where: { id: req.params.id, userId: currentUser(req).id },
    data: { readAt: new Date() },
  });
  res.status(204).end();
});

export default router;
