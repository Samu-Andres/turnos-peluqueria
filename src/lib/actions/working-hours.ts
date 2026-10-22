"use server";

import { revalidatePath } from "next/cache";
import { requireStaffAccess } from "@/lib/dashboard/require-staff-access";
import { DAY_LABELS } from "@/lib/dashboard/days";

export type WorkingHoursFormState = {
  error: string | null;
};

const DAYS = [0, 1, 2, 3, 4, 5, 6] as const;
const MAX_RANGES_PER_DAY = 3;

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

    // Cada día puede tener varias franjas (horario cortado, ej. 9 a 13 y
    // 16 a 20): llegan como day_<d>_start_<i> / day_<d>_end_<i>.
    const ranges: { start: string; end: string }[] = [];
    for (let i = 0; i < MAX_RANGES_PER_DAY; i += 1) {
      const start = String(formData.get(`day_${day}_start_${i}`) ?? "").trim();
      const end = String(formData.get(`day_${day}_end_${i}`) ?? "").trim();
      if (!start && !end) continue;

      if (!start || !end) {
        return {
          error: `Completá el horario de inicio y fin para ${DAY_LABELS[day]}.`,
        };
      }
      if (end <= start) {
        return {
          error: `El horario de ${DAY_LABELS[day]} tiene que terminar después de empezar (${start} a ${end}).`,
        };
      }
      ranges.push({ start, end });
    }

    if (ranges.length === 0) {
      return {
        error: `Completá el horario de ${DAY_LABELS[day]} o apagá ese día.`,
      };
    }

    ranges.sort((a, b) => a.start.localeCompare(b.start));
    for (let i = 1; i < ranges.length; i += 1) {
      if (ranges[i].start < ranges[i - 1].end) {
        return {
          error: `Las franjas de ${DAY_LABELS[day]} se pisan (${ranges[i - 1].start}–${ranges[i - 1].end} y ${ranges[i].start}–${ranges[i].end}).`,
        };
      }
    }

    for (const range of ranges) {
      rows.push({
        staff_id: staffId,
        day_of_week: day,
        start_time: range.start,
        end_time: range.end,
      });
    }
  }

  // Reemplaza todos los horarios de esta persona por los que vinieron en el form.
  const { error: deleteError } = await supabase
    .from("working_hours")
    .delete()
    .eq("staff_id", staffId);

  if (deleteError) {
    console.error("saveWorkingHours:", deleteError);
    return { error: "No pudimos guardar los horarios, probá de nuevo." };
  }

  if (rows.length > 0) {
    const { error: insertError } = await supabase
      .from("working_hours")
      .insert(rows);

    if (insertError) {
      console.error("saveWorkingHours:", insertError);
      return { error: "No pudimos guardar los horarios, probá de nuevo." };
    }
  }

  revalidatePath(`/dashboard/staff/${staffId}/horarios`);
  revalidatePath("/staff/horarios");
  return { error: null };
}
