"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireStaffAccess } from "@/lib/dashboard/require-staff-access";
import {
  addDaysToDateStr,
  combineDateAndTimeToISO,
  dayOfWeekOf,
  todayInBusinessTZ,
} from "@/lib/booking/time";

export type TimeOffFormState = {
  error: string | null;
  // Aviso no bloqueante: se guardó, pero esos días ya había turnos.
  notice?: string | null;
};

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const MAX_DAYS = 120;

function revalidateSchedulePages(staffId: string) {
  revalidatePath(`/dashboard/staff/${staffId}/horarios`);
  revalidatePath("/staff/horarios");
  revalidatePath("/dashboard/agenda");
}

/**
 * Marca días libres (uno o un rango, ej. vacaciones) para una persona del
 * staff. Esos días no se ofrecen turnos online. Los turnos que ya estaban
 * reservados en esas fechas NO se tocan: se avisa para que el negocio
 * los reprograme o cancele (y le avise al cliente).
 */
export async function addTimeOff(
  staffId: string,
  _prevState: TimeOffFormState,
  formData: FormData
): Promise<TimeOffFormState> {
  const { supabase } = await requireStaffAccess(staffId);

  const startDate = String(formData.get("start_date") ?? "").trim();
  const endDateRaw = String(formData.get("end_date") ?? "").trim();
  const endDate = endDateRaw || startDate;
  const reason = String(formData.get("reason") ?? "").trim();

  if (!DATE_RE.test(startDate) || !DATE_RE.test(endDate)) {
    return { error: "Elegí desde qué día (y hasta cuál, si son varios)." };
  }
  if (endDate < startDate) {
    return { error: "El último día no puede ser antes que el primero." };
  }
  if (endDate < todayInBusinessTZ()) {
    return { error: "Esas fechas ya pasaron." };
  }
  if (addDaysToDateStr(startDate, MAX_DAYS) < endDate) {
    return { error: `Como mucho se pueden marcar ${MAX_DAYS} días seguidos.` };
  }

  const { error } = await supabase.from("time_off").insert({
    staff_id: staffId,
    start_date: startDate,
    end_date: endDate,
    reason: reason || null,
  });

  if (error) {
    console.error("addTimeOff:", error);
    return { error: "No pudimos guardar los días libres, probá de nuevo." };
  }

  revalidateSchedulePages(staffId);

  const { count } = await supabase
    .from("bookings")
    .select("id", { count: "exact", head: true })
    .eq("staff_id", staffId)
    .in("status", ["pending", "confirmed"])
    .gte("start_at", combineDateAndTimeToISO(startDate, "00:00"))
    .lt("start_at", combineDateAndTimeToISO(addDaysToDateStr(endDate, 1), "00:00"));

  if (count) {
    return {
      error: null,
      notice: `Listo. Ojo: ${
        count === 1 ? "ya hay 1 turno" : `ya hay ${count} turnos`
      } en esos días. No los tocamos: reprogramalos o cancelalos desde la agenda y avisale al cliente.`,
    };
  }

  return { error: null };
}

export async function deleteTimeOff(timeOffId: string, staffId: string): Promise<void> {
  const { supabase } = await requireStaffAccess(staffId);

  await supabase
    .from("time_off")
    .delete()
    .eq("id", timeOffId)
    .eq("staff_id", staffId);

  revalidateSchedulePages(staffId);
}

/**
 * De una lista de fechas, cuáles tiene cerradas esa persona: porque ese
 * día de la semana no trabaja o porque lo marcó como día libre. Lo usa la
 * tira de días al reservar/reprogramar para no ofrecer días sin turnos.
 * Es de lectura pública (como los horarios), así que no exige sesión.
 */
export async function getClosedDates(
  staffId: string,
  dates: string[]
): Promise<string[]> {
  if (dates.length === 0 || !dates.every((d) => DATE_RE.test(d))) {
    return [];
  }

  const supabase = await createClient();
  const sorted = [...dates].sort();
  const [{ data: hours }, { data: offs }] = await Promise.all([
    supabase.from("working_hours").select("day_of_week").eq("staff_id", staffId),
    supabase
      .from("time_off")
      .select("start_date, end_date")
      .eq("staff_id", staffId)
      .lte("start_date", sorted[sorted.length - 1])
      .gte("end_date", sorted[0]),
  ]);

  const workingDays = new Set((hours ?? []).map((h) => h.day_of_week));
  return dates.filter(
    (d) =>
      !workingDays.has(dayOfWeekOf(d)) ||
      (offs ?? []).some((off) => off.start_date <= d && d <= off.end_date)
  );
}
