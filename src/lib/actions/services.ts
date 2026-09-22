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
  if (!Number.isFinite(duration_minutes) || duration_minutes <= 0) {
    return {
      error: "La duración tiene que ser un número de minutos mayor a 0.",
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
    return { error: error.message };
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

export async function deleteService(serviceId: string): Promise<void> {
  const { supabase, business } = await requireOwnerBusiness();

  await supabase
    .from("services")
    .delete()
    .eq("id", serviceId)
    .eq("business_id", business.id);

  revalidatePath("/dashboard/servicios");
}
