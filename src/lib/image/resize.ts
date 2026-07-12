/**
 * Downscales and re-encodes an image client-side before upload, so a
 * multi-megabyte phone photo never has to survive the trip to the server --
 * avatars are displayed at 64px max, so anything beyond a few hundred pixels
 * per side is wasted bytes anyway.
 */
export async function resizeImageFile(file: File, maxDimension = 512, quality = 0.85): Promise<File> {
  const bitmap = await createImageBitmap(file);
  try {
    const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas is not supported in this browser.");
    ctx.drawImage(bitmap, 0, 0, width, height);

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
    if (!blob) throw new Error("Failed to encode the resized image.");

    const baseName = file.name.replace(/\.\w+$/, "") || "avatar";
    return new File([blob], `${baseName}.jpg`, { type: "image/jpeg" });
  } finally {
    bitmap.close();
  }
}
