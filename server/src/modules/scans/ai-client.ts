// Internal client for the Python AI service (ai/). Contract: ai/app/schemas.py
import { env } from "../../config/env.js";
import { HttpError } from "../../lib/http-error.js";

export interface AiQuality {
  usable: boolean;
  issues: { code: string; message: string }[];
  metrics: Record<string, number>;
}

export interface AiAnalysis {
  quality: AiQuality;
  prediction: {
    top_k: { label: string; confidence: number }[];
    severity: "mild" | "moderate" | "severe" | null;
    affected_ratio: number | null;
  } | null;
  model: { version: string; task: string } | null;
}

export async function analyzeDisease(image: Buffer, mimeType: string, cropHint?: string): Promise<AiAnalysis> {
  const form = new FormData();
  form.append("image", new Blob([new Uint8Array(image)], { type: mimeType }), "upload");
  if (cropHint) form.append("crop", cropHint);

  let res: Response;
  try {
    res = await fetch(`${env.AI_SERVICE_URL}/v1/disease/analyze`, {
      method: "POST",
      body: form,
      signal: AbortSignal.timeout(env.AI_SERVICE_TIMEOUT_MS),
    });
  } catch {
    throw new HttpError(503, "The plant analysis service is not reachable right now. Your photo was not analysed.");
  }

  if (res.status === 503) {
    throw new HttpError(503, "The disease detection model is not deployed yet.");
  }
  if (!res.ok) {
    throw new HttpError(502, "The plant analysis service returned an error.", await res.text());
  }
  return (await res.json()) as AiAnalysis;
}
