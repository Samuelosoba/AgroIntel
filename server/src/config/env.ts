import "dotenv/config";
import { z } from "zod";

const schema = z.object({
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(8),
  CORS_ORIGIN: z.string().default("http://localhost:5173"),
  AI_SERVICE_URL: z.string().url().default("http://localhost:8000"),
  AI_SERVICE_TIMEOUT_MS: z.coerce.number().default(20_000),
  CONFIDENCE_CONFIDENT: z.coerce.number().min(0).max(1).default(0.8),
  CONFIDENCE_POSSIBLE: z.coerce.number().min(0).max(1).default(0.45),
  UPLOAD_DIR: z.string().default("uploads"),
  PUBLIC_BASE_URL: z.string().default("http://localhost:4000"),
  ANTHROPIC_API_KEY: z.string().optional(),
});

export const env = schema.parse(process.env);
