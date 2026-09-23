"use server";

import { revalidatePath } from "next/cache";
import { requireOwnerBusiness } from "@/lib/dashboard/require-owner-business";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSiteOrigin } from "@/lib/site-url";

export type StaffFormState = {
  error: string | null;
};

/**
 * Agrega a alguien al staff. En un negocio con local propio
 * (serves_at_home = false) esa persona necesita su propia cuenta para
 * ver y manejar sus turnos, así que pedimos el mail y lo invitamos por
 * Supabase (crea la cuenta ya vinculada, sin contraseña: la define
 * sola/o al abrir el mail). En un negocio a domicilio (sin local, uno
 * solo trabajando) no hace falta cuenta: alcanza con el nombre.
 */
export async function createStaff(
  _prevState: StaffFormState,
  formData: FormData
): Promise<StaffFormState> {
  const { supabase, business } = await requireOwnerBusiness();

  const full_name = String(formData.get("full_name") ?? "").trim();

  if (!full_name) {
    return { error: "Poné el nombre de la persona." };
  }

  const requiresAccount = !business.serves_at_home;

  if (!requiresAccount) {
    const { error } = await supabase.from("staff").insert({
      business_id: business.id,
      full_name,
    });

    if (error) {
      return { error: error.message };
    }

    revalidatePath("/dashboard/staff");
    return { error: null };
  }

  const email = String(formData.get("email") ?? "").trim();

  if (!email) {
    return { error: "Poné el mail de la persona para invitarla." };
  }

  let admin: ReturnType<typeof createAdminClient>;
  try {
    admin = createAdminClient();
  } catch {
    return {
      error:
        "Falta configurar el servidor para poder invitar por mail (SUPABASE_SERVICE_ROLE_KEY).",
    };
  }

  const origin = await getSiteOrigin();
  const { data: inviteData, error: inviteError } =
    await admin.auth.admin.inviteUserByEmail(email, {
      data: { full_name, role: "staff" },
      redirectTo: `${origin}/auth/confirm?next=${encodeURIComponent(
        "/staff/completar-registro"
      )}`,
    });

  if (inviteError || !inviteData.user) {
    if (
      inviteError?.code === "email_exists" ||
      inviteError?.code === "user_already_exists"
    ) {
      return { error: "Ese mail ya tiene una cuenta en el sistema." };
    }
    return {
      error: inviteError?.message ?? "No pudimos enviar la invitación.",
    };
  }

  const { error } = await supabase.from("staff").insert({
    business_id: business.id,
    full_name,
    email,
    user_id: inviteData.user.id,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard/staff");
  return { error: null };
}

export async function toggleStaffActive(
  staffId: string,
  active: boolean
): Promise<void> {
  const { supabase, business } = await requireOwnerBusiness();

  await supabase
    .from("staff")
    .update({ active })
    .eq("id", staffId)
    .eq("business_id", business.id);

  revalidatePath("/dashboard/staff");
}

export async function deleteStaff(staffId: string): Promise<void> {
  const { supabase, business } = await requireOwnerBusiness();

  await supabase
    .from("staff")
    .delete()
    .eq("id", staffId)
    .eq("business_id", business.id);

  revalidatePath("/dashboard/staff");
}

export async function updateStaff(
  staffId: string,
  _prevState: StaffFormState,
  formData: FormData
): Promise<StaffFormState> {
  const { supabase, business } = await requireOwnerBusiness();

  const full_name = String(formData.get("full_name") ?? "").trim();

  if (!full_name) {
    return { error: "Poné el nombre de la persona." };
  }

  const { error } = await supabase
    .from("staff")
    .update({ full_name })
    .eq("id", staffId)
    .eq("business_id", business.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard/staff");
  return { error: null };
}
