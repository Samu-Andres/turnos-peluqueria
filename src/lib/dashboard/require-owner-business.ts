import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Business } from "@/types/database";

/**
 * Helper compartido para las páginas del panel que necesitan que:
 * 1) haya un usuario logueado,
 * 2) sea "owner",
 * 3) ya tenga un negocio creado.
 *
 * A diferencia de /dashboard (que muestra el formulario de creación
 * cuando no hay negocio), estas páginas no tienen sentido sin uno,
 * así que mandan de vuelta a /dashboard en ese caso.
 */
export async function requireOwnerBusiness() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "owner") {
    redirect("/");
  }

  const { data: business } = await supabase
    .from("businesses")
    .select("*")
    .eq("owner_id", user.id)
    .maybeSingle();

  if (!business) {
    redirect("/dashboard");
  }

  return { supabase, business: business as Business };
}
