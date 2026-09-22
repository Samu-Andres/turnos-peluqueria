import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { Business } from "@/types/database";

/**
 * Busca un negocio por slug. Envuelto en cache() de React para que, si se
 * llama más de una vez en el mismo request (por ejemplo desde
 * generateMetadata y desde el Server Component de la página), Supabase
 * solo se consulte una vez.
 */
export const getBusinessBySlug = cache(
  async (slug: string): Promise<Business | null> => {
    const supabase = await createClient();
    const { data } = await supabase
      .from("businesses")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();
    return data;
  }
);
