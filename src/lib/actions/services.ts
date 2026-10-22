"use server";

import { revalidatePath } from "next/cache";
import { requireOwnerBusiness } from "@/lib/dashboard/require-owner-business";

export type ServiceFormState = {
  error: string | null;
};

export async function createService(
  _prevState: ServiceFormState,
  formData: FormData
): Promise<ServiceFormState> {
  const { supabase, business } = await requireOwnerBusiness();

  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const durationRaw = String(formData.get("duration_minutes") ?? "").trim();
  const priceRaw = String(formData.get("price") ?? "").trim();

  if (!name) {
    return { error: "Poné un nombre para el servicio." };
  }

  const duration_minutes = Number(durationRaw);
  if (!Number.isInteger(duration_minutes) || duration_minutes <= 0) {
    return {
      error: "Poné la duración en minutos enteros (por ejemplo 25 o 40).",
    };
  }

  const price = Number(priceRaw);
  if (!Number.isFinite(price) || price < 0) {
    return { error: "El precio tiene que ser un número válido." };
  }

  const { error } = await supabase.from("services").insert({
    business_id: business.id,
    name,
    description: description || null,
    duration_minutes,
    price,
  });

  if (error) {
    console.error("services:", error);
    return { error: "No pudimos guardar el servicio, probá de nuevo." };
  }

  revalidatePath("/dashboard/servicios");
  return { error: null };
}

export async function toggleServiceActive(
  serviceId: string,
  active: boolean
): Promise<void> {
  const { supabase, business } = await requireOwnerBusiness();

  await supabase
    .from("services")
    .update({ active })
    .eq("id", serviceId)
    .eq("business_id", business.id);

  revalidatePath("/dashboard/servicios");
}

/**
 * Borra solo si no tiene turnos: en la base los turnos dependen de esta
 * fila, y borrarla se llevaría puesto el historial (y los turnos futuros
 * ya confirmados). Para que deje de aparecer alcanza con desactivarla.
 */
export async function deleteService(id: string): Promise<{ error: string | null }> {
  const { supabase, business } = await requireOwnerBusiness();

  const { count } = await supabase
    .from("bookings")
    .select("id", { count: "exact", head: true })
    .eq("service_id", id);

  if (count) {
    return { error: "Este servicio ya tiene turnos, así que no se puede borrar sin perderlos. Desactivalo: deja de aparecer para reservar y se conserva el historial." };
  }

  const { error } = await supabase
    .from("services")
    .delete()
    .eq("id", id)
    .eq("business_id", business.id);

  if (error) {
    console.error("deleteService:", error);
    return {
      error:
        error.code === "23503"
          ? "Este servicio ya tiene turnos, así que no se puede borrar sin perderlos. Desactivalo: deja de aparecer para reservar y se conserva el historial."
          : "No pudimos borrarlo, probá de nuevo.",
    };
  }

  revalidatePath("/dashboard/servicios");
  return { error: null };
}

export async function updateService(
  serviceId: string,
  _prevState: ServiceFormState,
  formData: FormData
): Promise<ServiceFormState> {
  const { supabase, business } = await requireOwnerBusiness();

  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const durationRaw = String(formData.get("duration_minutes") ?? "").trim();
  const priceRaw = String(formData.get("price") ?? "").trim();

  if (!name) {
    return { error: "Poné un nombre para el servicio." };
  }

  const duration_minutes = Number(durationRaw);
  if (!Number.isInteger(duration_minutes) || duration_minutes <= 0) {
    return {
      error: "Poné la duración en minutos enteros (por ejemplo 25 o 40).",
    };
  }

  const price = Number(priceRaw);
  if (!Number.isFinite(price) || price < 0) {
    return { error: "El precio tiene que ser un número válido." };
  }

  const { error } = await supabase
    .from("services")
    .update({
      name,
      description: description || null,
      duration_minutes,
      price,
    })
    .eq("id", serviceId)
    .eq("business_id", business.id);

  if (error) {
    console.error("services:", error);
    return { error: "No pudimos guardar el servicio, probá de nuevo." };
  }

  revalidatePath("/dashboard/servicios");
  return { error: null };
}
