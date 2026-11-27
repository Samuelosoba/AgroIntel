// Image storage: Vercel Blob when BLOB_READ_WRITE_TOKEN is set (production),
// local disk otherwise (development). Callers only depend on the returned URL.
import { mkdir, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { put } from "@vercel/blob";
import { env } from "../config/env.js";

const EXT: Record<string, string> = { "image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp" };

export const uploadRoot = path.resolve(env.UPLOAD_DIR);

export async function saveImage(buffer: Buffer, mimeType: string, folder: string): Promise<string> {
  // Random names: public blob URLs can't be guessed.
  const name = `${folder}/${randomUUID()}${EXT[mimeType] ?? ".jpg"}`;

  if (env.BLOB_READ_WRITE_TOKEN) {
    const blob = await put(name, buffer, { access: "public", contentType: mimeType, token: env.BLOB_READ_WRITE_TOKEN });
    return blob.url;
  }

  const file = path.join(uploadRoot, name);
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, buffer);
  return `${env.PUBLIC_BASE_URL}/uploads/${name}`;
}
