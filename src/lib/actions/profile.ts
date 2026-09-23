"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type ProfileFormState = {
  error: string | null;
};

/**
 * El cliente (o el dueño) edita su propio nombre y teléfono. El
 * teléfono queda disponible para precargarlo al reservar un turno
 * (ver ReservarPage), así no lo tiene que tipear cada vez.
 */
export async function updateProfile(
  _prevState: ProfileFormState,
  formData: FormData
): Promise<ProfileFormState> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Iniciá sesión para editar tu perfil." };
  }

  const fullName = String(formData.get("full_name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();

  if (!fullName) {
    return { error: "Poné tu nombre completo." };
  }

  const { error } = await supabase
    .from("profiles")
    .update({ full_name: fullName, phone: phone || null })
    .eq("id", user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/mi-perfil");
  return { error: null };
}
