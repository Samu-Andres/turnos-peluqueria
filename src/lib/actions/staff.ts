"use server";

import { revalidatePath } from "next/cache";
import { requireOwnerBusiness } from "@/lib/dashboard/require-owner-business";

export type StaffFormState = {
  error: string | null;
};

export async function createStaff(
  _prevState: StaffFormState,
  formData: FormData
): Promise<StaffFormState> {
  const { supabase, business } = await requireOwnerBusiness();

  const full_name = String(formData.get("full_name") ?? "").trim();

  if (!full_name) {
    return { error: "Poné el nombre de la persona." };
  }

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
