/**
 * Achica una imagen en el navegador antes de subirla. Las fotos del
 * celular pesan 2–6 MB y las acciones del servidor solo aceptan pedidos
 * chicos (ver serverActions.bodySizeLimit en next.config.ts; Vercel
 * además corta todo lo que pase de 4,5 MB), así que sin esto la subida
 * fallaba con fotos reales.
 *
 * - Redimensiona para que el lado más largo mida como mucho `maxSide`.
 * - PNG queda PNG (para no perder la transparencia de un logo); el resto
 *   pasa a JPEG.
 * - SVG y archivos que no son imagen se devuelven tal cual.
 * - Si algo falla (navegador viejo, formato raro) devuelve el original y
 *   el servidor decide.
 */
export async function compressImage(
  file: File,
  { maxSide, quality = 0.82 }: { maxSide: number; quality?: number }
): Promise<File> {
  if (!file.type.startsWith("image/") || file.type === "image/svg+xml") {
    return file;
  }

  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));

    // Ya es chica: no vale la pena recomprimirla.
    if (scale === 1 && file.size <= 400 * 1024) {
      bitmap.close();
      return file;
    }

    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) {
      bitmap.close();
      return file;
    }
    context.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    const keepPng = file.type === "image/png";
    const type = keepPng ? "image/png" : "image/jpeg";
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, type, keepPng ? undefined : quality)
    );

    if (!blob || blob.size >= file.size) {
      return file;
    }

    const baseName = file.name.replace(/\.[^.]+$/, "") || "imagen";
    return new File([blob], `${baseName}.${keepPng ? "png" : "jpg"}`, {
      type,
      lastModified: Date.now(),
    });
  } catch {
    return file;
  }
}
