import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Business, Staff } from "@/types/database";

type StaffAccess = {
  supabase: Awaited<ReturnType<typeof createClient>>;
  business: Business;
  staff: Staff;
};

/**
 * Para páginas/acciones que operan sobre un/a staff puntual (turnos,
 * horarios) y tienen que dejar pasar tanto al dueño del negocio como a
 * la propia persona, si tiene una cuenta de staff vinculada a ese
 * staff_id. Así se puede reusar la misma página para ambos casos.
 */
export async function requireStaffAccess(staffId: string): Promise<StaffAccess> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: staff } = await supabase
    .from("staff")
    .select("*")
    .eq("id", staffId)
    .maybeSingle();

  if (!staff) {
    redirect("/dashboard");
  }

  const { data: business } = await supabase
    .from("businesses")
    .select("*")
    .eq("id", staff.business_id)
    .maybeSingle();

  if (!business) {
    redirect("/dashboard");
  }

  const isOwner = business.owner_id === user.id;
  const isThisStaffMember = staff.user_id === user.id;

  if (!isOwner && !isThisStaffMember) {
    redirect("/");
  }

  return { supabase, business, staff };
}

/**
 * Para /staff/*: la propia persona entra a su panel (sin id en la URL,
 * a diferencia de /dashboard/staff/[id]). Busca el staff vinculado a
 * su cuenta.
 */
export async function requireStaffSelf(): Promise<StaffAccess> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: staff } = await supabase
    .from("staff")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!staff) {
    redirect("/");
  }

  const { data: business } = await supabase
    .from("businesses")
    .select("*")
    .eq("id", staff.business_id)
    .maybeSingle();

  if (!business) {
    redirect("/");
  }

  return { supabase, business, staff };
}
