import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

/**
 * Cliente con la service role key: para lo único que la necesita hoy,
 * invitar por mail a una cuenta de staff (supabase.auth.admin.*). Nunca
 * se importa desde código de cliente ni se expone al navegador; solo se
 * usa dentro de server actions. Requiere SUPABASE_SERVICE_ROLE_KEY en
 * las variables de entorno (ver .env.local.example).
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Falta configurar SUPABASE_SERVICE_ROLE_KEY para invitar staff por mail."
    );
  }

  return createSupabaseClient<Database>(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
