import express from "express";
import cors from "cors";
import helmet from "helmet";
import { env } from "./config/env.js";
import { uploadRoot } from "./lib/storage.js";
import { errorHandler } from "./middleware/error.js";
import authRoutes from "./modules/auth/auth.routes.js";
import farmRoutes from "./modules/farms/farms.routes.js";
import weatherRoutes from "./modules/weather/weather.routes.js";
import cropRoutes from "./modules/crops/crops.routes.js";
import diseaseRoutes from "./modules/diseases/diseases.routes.js";
import scanRoutes from "./modules/scans/scans.routes.js";
import reviewRoutes from "./modules/reviews/reviews.routes.js";
import alertRoutes from "./modules/alerts/alerts.routes.js";
import assistantRoutes from "./modules/assistant/assistant.routes.js";

export function createApp() {
  const app = express();

  app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
  app.use(cors({ origin: env.CORS_ORIGIN.split(",") }));
  app.use(express.json({ limit: "1mb" }));
  app.use("/uploads", express.static(uploadRoot));

  app.get("/health", (_req, res) => res.json({ ok: true }));

  const api = express.Router();
  api.use("/auth", authRoutes);
  api.use("/farms", farmRoutes);
  api.use("/weather", weatherRoutes);
  api.use("/crops", cropRoutes);
  api.use("/diseases", diseaseRoutes);
  api.use("/scans", scanRoutes);
  api.use("/reviews", reviewRoutes);
  api.use("/alerts", alertRoutes);
  api.use("/assistant", assistantRoutes);
  app.use("/api/v1", api);

  app.use(errorHandler);
  return app;
}
