"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type StaffOnboardingFormState = {
  error: string | null;
};

/**
 * La persona invitada define su contraseña la primera vez que entra:
 * llega acá ya con una sesión armada por /auth/confirm (que verificó el
 * link del mail de invitación), así que solo falta setear la clave.
 */
export async function completeStaffRegistration(
  _prevState: StaffOnboardingFormState,
  formData: FormData
): Promise<StaffOnboardingFormState> {
  const password = String(formData.get("password") ?? "");

  if (password.length < 6) {
    return { error: "La contraseña tiene que tener al menos 6 caracteres." };
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      error:
        "El link expiró o no es válido. Pedile al dueño del negocio que te reenvíe la invitación.",
    };
  }

  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    return { error: error.message };
  }

  redirect("/staff");
}
