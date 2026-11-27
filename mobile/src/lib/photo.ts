import { ImageManipulator, SaveFormat } from "expo-image-manipulator";

// Keeps uploads well under the API's ~4.5 MB request limit. The disease model only
// needs 224 px, so 1600 px leaves plenty of detail for the quality checks.
const MAX_SIDE = 1600;

/** Downscale and re-encode a picked photo as JPEG before upload. */
export async function shrinkPhoto(uri: string): Promise<{ uri: string; mimeType: string }> {
  const image = await ImageManipulator.manipulate(uri, { maxWidth: MAX_SIDE, maxHeight: MAX_SIDE }).renderAsync();
  const saved = await image.saveAsync({ compress: 0.85, format: SaveFormat.JPEG });
  return { uri: saved.uri, mimeType: "image/jpeg" };
}
