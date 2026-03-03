import imageCompression from "browser-image-compression";

const COMPRESSIBLE_TYPES = [
  "image/png",
  "image/jpeg",
  "image/heic",
  "image/heif",
];

export async function compressFile(file: File): Promise<File> {
  // GIF — skip (compression breaks animation)
  if (file.type === "image/gif") return file;

  // Video — skip (client-side video compression not feasible)
  if (file.type.startsWith("video/")) return file;

  // Compressible images: png, jpg, heic
  if (COMPRESSIBLE_TYPES.includes(file.type)) {
    const isHeic = file.type === "image/heic" || file.type === "image/heif";
    const compressed = await imageCompression(file, {
      maxSizeMB: 2,
      maxWidthOrHeight: 2560,
      useWebWorker: true,
      fileType: isHeic ? "image/jpeg" : undefined,
    });
    // browser-image-compression returns a Blob — wrap as File
    if (isHeic) {
      const name = file.name.replace(/\.heic$/i, ".jpg").replace(/\.heif$/i, ".jpg");
      return new File([compressed], name, { type: "image/jpeg" });
    }
    return new File([compressed], file.name, { type: compressed.type });
  }

  return file;
}
