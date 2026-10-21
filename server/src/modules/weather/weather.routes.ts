import { Router } from "express";
import { z } from "zod";
import { getWeather } from "./weather.service.js";

const router = Router();

const query = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lon: z.coerce.number().min(-180).max(180),
});

router.get("/", async (req, res) => {
  res.json(await getWeather(query.parse(req.query)));
});

export default router;
