"use server";

import { revalidatePath } from "next/cache";
import { requireOwnerBusiness } from "@/lib/dashboard/require-owner-business";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSiteOrigin } from "@/lib/site-url";

export type StaffFormState = {
  error: string | null;
  // Aviso no bloqueante: la persona se agregó igual, pero algo del
  // extra (la invitación por mail) no salió y el dueño tiene que saberlo.
  notice?: string | null;
};

/**
 * Agrega a alguien al staff. La persona queda agregada siempre (y con
 * eso el negocio ya puede recibir reservas para ella, una vez que tenga
 * horarios). En un negocio con local propio, si además se pone un mail,
 * la invitamos por Supabase para que tenga su propia cuenta y maneje sus
 * turnos; pero la invitación es un extra: si el mail falla (límite de
 * envíos, mail ya registrado, SMTP sin configurar) no perdemos el alta.
 *
 * Si el mail es el del propio dueño (caso típico: barbero que trabaja
 * solo en su local) no invitamos a nadie: el dueño ya maneja todo desde
 * el panel.
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

  const email = business.serves_at_home
    ? ""
    : String(formData.get("email") ?? "").trim().toLowerCase();

  const {
    data: { user: owner },
  } = await supabase.auth.getUser();
  const isOwnerEmail = Boolean(email) && email === owner?.email?.toLowerCase();

  const { data: created, error } = await supabase
    .from("staff")
    .insert({
      business_id: business.id,
      full_name,
      email: email && !isOwnerEmail ? email : null,
    })
    .select("id")
    .single();

  if (error || !created) {
    return { error: error?.message ?? "No pudimos agregar a esa persona." };
  }

  revalidatePath("/dashboard/staff");

  if (!email || isOwnerEmail) {
    return { error: null };
  }

  const notice = await inviteStaffAccount(created.id, email, full_name);
  return { error: null, notice };
}

/**
 * Invita por mail a una persona ya agregada al staff y vincula la cuenta
 * creada. Devuelve un aviso para el dueño si no se pudo (null si salió
 * bien).
 */
async function inviteStaffAccount(
  staffId: string,
  email: string,
  fullName: string
): Promise<string | null> {
  const fallback =
    "La persona quedó agregada y ya puede recibir turnos (cargale los horarios), pero";

  let admin: ReturnType<typeof createAdminClient>;
  try {
    admin = createAdminClient();
  } catch {
    return `${fallback} no pudimos mandarle la invitación: falta configurar SUPABASE_SERVICE_ROLE_KEY en el servidor.`;
  }

  const origin = await getSiteOrigin();
  const { data: inviteData, error: inviteError } =
    await admin.auth.admin.inviteUserByEmail(email, {
      data: { full_name: fullName, role: "staff" },
      redirectTo: `${origin}/auth/confirm?next=${encodeURIComponent(
        "/staff/completar-registro"
      )}`,
    });

  if (inviteError || !inviteData.user) {
    if (
      inviteError?.code === "email_exists" ||
      inviteError?.code === "user_already_exists"
    ) {
      return `${fallback} ese mail ya tiene una cuenta, así que no le mandamos invitación. Sus turnos los podés manejar vos desde acá.`;
    }
    if (inviteError?.code === "over_email_send_rate_limit") {
      return `${fallback} se alcanzó el límite de mails por hora. Probá invitarla más tarde.`;
    }
    return `${fallback} no pudimos mandarle la invitación (${
      inviteError?.message ?? "error desconocido"
    }).`;
  }

  await admin
    .from("staff")
    .update({ user_id: inviteData.user.id })
    .eq("id", staffId);

  return null;
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
