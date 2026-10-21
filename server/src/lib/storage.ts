// Image storage. Local disk for development; replace `saveImage` with an
// S3/Cloudinary upload in production — callers only depend on the returned URL.
import { mkdir, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { env } from "../config/env.js";

const EXT: Record<string, string> = { "image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp" };

export const uploadRoot = path.resolve(env.UPLOAD_DIR);

export async function saveImage(buffer: Buffer, mimeType: string, folder: string): Promise<string> {
  const dir = path.join(uploadRoot, folder);
  await mkdir(dir, { recursive: true });
  const name = `${randomUUID()}${EXT[mimeType] ?? ".jpg"}`;
  await writeFile(path.join(dir, name), buffer);
  return `${env.PUBLIC_BASE_URL}/uploads/${folder}/${name}`;
}
