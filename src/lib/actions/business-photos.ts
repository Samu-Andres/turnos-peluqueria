"use server";

import { revalidatePath } from "next/cache";
import { requireOwnerBusiness } from "@/lib/dashboard/require-owner-business";

export type BusinessPhotosFormState = {
  error: string | null;
};

const MAX_PHOTO_BYTES = 4 * 1024 * 1024; // 4 MB
const MAX_PHOTOS = 12;
const ALLOWED_PHOTO_TYPES: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
};

export async function addBusinessPhotos(
  _prevState: BusinessPhotosFormState,
  formData: FormData
): Promise<BusinessPhotosFormState> {
  const { supabase, business } = await requireOwnerBusiness();

  const files = formData
    .getAll("photos")
    .filter((f): f is File => f instanceof File && f.size > 0);

  if (files.length === 0) {
    return { error: "Elegí al menos una foto." };
  }

  const { count } = await supabase
    .from("business_photos")
    .select("id", { count: "exact", head: true })
    .eq("business_id", business.id);

  if ((count ?? 0) + files.length > MAX_PHOTOS) {
    return {
      error: `Como mucho podés tener ${MAX_PHOTOS} fotos. Borrá alguna antes de subir más.`,
    };
  }

  for (const file of files) {
    if (file.size > MAX_PHOTO_BYTES) {
      return { error: `"${file.name}" pesa más de 4 MB.` };
    }
    if (!ALLOWED_PHOTO_TYPES[file.type]) {
      return { error: `"${file.name}" tiene que ser una imagen PNG, JPG o WEBP.` };
    }
  }

  const uploadedUrls: string[] = [];

  for (const file of files) {
    const ext = ALLOWED_PHOTO_TYPES[file.type];
    const path = `${business.owner_id}/photo-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 8)}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("business-photos")
      .upload(path, file, { contentType: file.type });

    if (uploadError) {
      return { error: `No se pudo subir "${file.name}": ${uploadError.message}` };
    }

    const { data } = supabase.storage.from("business-photos").getPublicUrl(path);
    uploadedUrls.push(data.publicUrl);
  }

  const { error } = await supabase.from("business_photos").insert(
    uploadedUrls.map((url) => ({ business_id: business.id, url }))
  );

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard/fotos");
  return { error: null };
}

export async function deleteBusinessPhoto(photoId: string): Promise<void> {
  const { supabase, business } = await requireOwnerBusiness();

  await supabase
    .from("business_photos")
    .delete()
    .eq("id", photoId)
    .eq("business_id", business.id);

  revalidatePath("/dashboard/fotos");
}
