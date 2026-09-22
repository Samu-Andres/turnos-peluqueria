"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

export type BusinessFormState = {
  error: string | null;
};

const MAX_LOGO_BYTES = 3 * 1024 * 1024; // 3 MB
const ALLOWED_LOGO_TYPES: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/svg+xml": "svg",
};

function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // saca acentos
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Sube el logo (si vino uno válido en el form) al bucket "logos" y
 * devuelve su URL pública. Si no se adjuntó ningún archivo, devuelve
 * null sin error (el logo es opcional). Cada subida usa un nombre de
 * archivo único (con timestamp) para no depender de caché de imagen.
 */
async function uploadLogoIfPresent(
  supabase: SupabaseClient<Database>,
  ownerId: string,
  formData: FormData
): Promise<{ url: string | null; error: string | null }> {
  const file = formData.get("logo");

  if (!(file instanceof File) || file.size === 0) {
    return { url: null, error: null };
  }

  if (file.size > MAX_LOGO_BYTES) {
    return { url: null, error: "El logo no puede pesar más de 3 MB." };
  }

  const ext = ALLOWED_LOGO_TYPES[file.type];
  if (!ext) {
    return {
      url: null,
      error: "El logo tiene que ser una imagen (PNG, JPG, WEBP o SVG).",
    };
  }

  const path = `${ownerId}/logo-${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("logos")
    .upload(path, file, { contentType: file.type, upsert: true });

  if (uploadError) {
    return { url: null, error: `No se pudo subir el logo: ${uploadError.message}` };
  }

  const { data } = supabase.storage.from("logos").getPublicUrl(path);
  return { url: data.publicUrl, error: null };
}

export async function createBusiness(
  _prevState: BusinessFormState,
  formData: FormData
): Promise<BusinessFormState> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const name = String(formData.get("name") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();

  if (!name) {
    return { error: "Poné un nombre para tu negocio." };
  }

  const { url: logoUrl, error: logoError } = await uploadLogoIfPresent(
    supabase,
    user.id,
    formData
  );
  if (logoError) {
    return { error: logoError };
  }

  const baseSlug = slugify(name);
  if (!baseSlug) {
    return { error: "Ese nombre no genera una URL válida, probá con otro." };
  }

  // Si el slug ya existe, le suma un sufijo corto hasta encontrar uno libre.
  let slug = baseSlug;
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const { data: existing } = await supabase
      .from("businesses")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();

    if (!existing) break;
    slug = `${baseSlug}-${Math.random().toString(36).slice(2, 6)}`;
  }

  const { error } = await supabase.from("businesses").insert({
    owner_id: user.id,
    name,
    slug,
    address: address || null,
    phone: phone || null,
    description: description || null,
    logo_url: logoUrl,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard");
  redirect("/dashboard");
}

export async function updateBusiness(
  _prevState: BusinessFormState,
  formData: FormData
): Promise<BusinessFormState> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const name = String(formData.get("name") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();

  if (!name) {
    return { error: "Poné un nombre para tu negocio." };
  }

  const { url: logoUrl, error: logoError } = await uploadLogoIfPresent(
    supabase,
    user.id,
    formData
  );
  if (logoError) {
    return { error: logoError };
  }

  // El slug no se toca al editar: cambiar el nombre no debería romper el
  // link público que el dueño ya haya compartido. El logo solo se
  // actualiza si se subió uno nuevo (si no, se mantiene el que ya había).
  const { error } = await supabase
    .from("businesses")
    .update({
      name,
      address: address || null,
      phone: phone || null,
      description: description || null,
      ...(logoUrl ? { logo_url: logoUrl } : {}),
    })
    .eq("owner_id", user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard");
  redirect("/dashboard");
}
