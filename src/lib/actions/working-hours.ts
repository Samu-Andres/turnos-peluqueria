"use server";

import { revalidatePath } from "next/cache";
import { requireStaffAccess } from "@/lib/dashboard/require-staff-access";
import { DAY_LABELS } from "@/lib/dashboard/days";

export type WorkingHoursFormState = {
  error: string | null;
};

const DAYS = [0, 1, 2, 3, 4, 5, 6] as const;

export async function saveWorkingHours(
  staffId: string,
  _prevState: WorkingHoursFormState,
  formData: FormData
): Promise<WorkingHoursFormState> {
  const { supabase } = await requireStaffAccess(staffId);

  const rows: {
    staff_id: string;
    day_of_week: number;
    start_time: string;
    end_time: string;
  }[] = [];

  for (const day of DAYS) {
    const enabled = formData.get(`day_${day}_enabled`) === "on";
    if (!enabled) continue;

    const start = String(formData.get(`day_${day}_start`) ?? "").trim();
    const end = String(formData.get(`day_${day}_end`) ?? "").trim();

    if (!start || !end) {
      return {
        error: `Completá el horario de inicio y fin para ${DAY_LABELS[day]}.`,
      };
    }
    if (end <= start) {
      return {
        error: `El horario de ${DAY_LABELS[day]} tiene que terminar después de empezar.`,
      };
    }

    rows.push({ staff_id: staffId, day_of_week: day, start_time: start, end_time: end });
  }

  // Reemplaza todos los horarios de esta persona por los que vinieron en el form.
  const { error: deleteError } = await supabase
    .from("working_hours")
    .delete()
    .eq("staff_id", staffId);

  if (deleteError) {
    return { error: deleteError.message };
  }

  if (rows.length > 0) {
    const { error: insertError } = await supabase
      .from("working_hours")
      .insert(rows);

    if (insertError) {
      return { error: insertError.message };
    }
  }

  revalidatePath(`/dashboard/staff/${staffId}/horarios`);
  revalidatePath("/staff/horarios");
  return { error: null };
}
