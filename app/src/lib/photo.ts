// Keeps uploads well under the API's ~4.5 MB request limit, and re-encoding drops
// the photo's metadata (EXIF, including GPS). The model only needs 224 px.
const MAX_SIDE = 1600;

/** Downscale and re-encode a photo as JPEG; returns the original if the browser can't decode it. */
export async function shrinkPhoto(file: File): Promise<File> {
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
    const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.85));
    return blob ? new File([blob], "plant.jpg", { type: "image/jpeg" }) : file;
  } catch {
    return file;
  }
}
