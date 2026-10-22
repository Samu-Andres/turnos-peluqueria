import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { Business, Staff } from "@/types/database";

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

/**
 * Staff activo de un negocio que además tiene horarios cargados: son los
 * únicos a los que se les puede reservar. Sin horarios, el cliente vería
 * dos semanas sin ningún turno libre.
 */
export const getBookableStaff = cache(
  async (businessId: string): Promise<Staff[]> => {
    const supabase = await createClient();
    const { data: staff } = await supabase
      .from("staff")
      .select("*")
      .eq("business_id", businessId)
      .eq("active", true)
      .order("full_name", { ascending: true });

    if (!staff || staff.length === 0) {
      return [];
    }

    const { data: hours } = await supabase
      .from("working_hours")
      .select("staff_id")
      .in(
        "staff_id",
        staff.map((person) => person.id)
      );
    const withHours = new Set((hours ?? []).map((h) => h.staff_id));
    return staff.filter((person) => withHours.has(person.id));
  }
);
