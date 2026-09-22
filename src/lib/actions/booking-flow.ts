"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  addDaysToDateStr,
  combineDateAndTimeToISO,
  dayOfWeekOf,
  isoToMinutesSinceMidnight,
  minutesToTimeLabel,
  nowMinutesInBusinessTZ,
  timeStrToMinutes,
  todayInBusinessTZ,
} from "@/lib/booking/time";
import { computeAvailableSlots, type MinuteInterval } from "@/lib/booking/slots";

export type SlotsResult =
  | { slots: string[]; error?: undefined }
  | { slots?: undefined; error: string };

/**
 * Calcula los horarios libres de un staff, para un servicio y una fecha
 * dados. No es una form action: se llama directamente desde el componente
 * cliente cuando cambia la selección.
 */
export async function getAvailableSlots(
  staffId: string,
  serviceId: string,
  dateStr: string
): Promise<SlotsResult> {
  const today = todayInBusinessTZ();
  if (dateStr < today) {
    return { slots: [] };
  }

  const supabase = await createClient();

  const [{ data: service }, { data: staff }] = await Promise.all([
    supabase
      .from("services")
      .select("*")
      .eq("id", serviceId)
      .eq("active", true)
      .maybeSingle(),
    supabase
      .from("staff")
      .select("*")
      .eq("id", staffId)
      .eq("active", true)
      .maybeSingle(),
  ]);

  if (!service || !staff || service.business_id !== staff.business_id) {
    return { error: "No pudimos encontrar ese servicio o esa persona." };
  }

  const day = dayOfWeekOf(dateStr);

  const { data: workingHours } = await supabase
    .from("working_hours")
    .select("start_time, end_time")
    .eq("staff_id", staffId)
    .eq("day_of_week", day);

  if (!workingHours || workingHours.length === 0) {
    return { slots: [] };
  }

  const workingIntervals: MinuteInterval[] = workingHours.map((hours) => ({
    startMinutes: timeStrToMinutes(hours.start_time),
    endMinutes: timeStrToMinutes(hours.end_time),
  }));

  const dayStart = combineDateAndTimeToISO(dateStr, "00:00");
  const dayEnd = combineDateAndTimeToISO(addDaysToDateStr(dateStr, 1), "00:00");

  const { data: busy, error: busyError } = await supabase.rpc(
    "get_busy_intervals",
    { p_staff_id: staffId, p_from: dayStart, p_to: dayEnd }
  );

  if (busyError) {
    return { error: "No pudimos calcular la disponibilidad, probá de nuevo." };
  }

  const busyIntervals: MinuteInterval[] = (busy ?? []).map((interval) => ({
    startMinutes: isoToMinutesSinceMidnight(interval.start_at, dateStr),
    endMinutes: isoToMinutesSinceMidnight(interval.end_at, dateStr),
  }));

  const earliestStartMinutes =
    dateStr === today ? nowMinutesInBusinessTZ() : 0;

  const slotsMinutes = computeAvailableSlots({
    workingIntervals,
    busyIntervals,
    durationMinutes: service.duration_minutes,
    earliestStartMinutes,
  });

  return { slots: slotsMinutes.map(minutesToTimeLabel) };
}

export type BookingFormState = {
  error: string | null;
};

/**
 * Confirma la reserva. Se usa junto con useActionState pero con los ids
 * de negocio/servicio/staff ya "bindeados" desde el server component que
 * la pasa al form.
 */
export async function createBooking(
  businessId: string,
  serviceId: string,
  staffId: string,
  _prevState: BookingFormState,
  formData: FormData
): Promise<BookingFormState> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Iniciá sesión para confirmar la reserva." };
  }

  const dateStr = String(formData.get("date") ?? "").trim();
  const timeStr = String(formData.get("time") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();

  if (!dateStr || !timeStr) {
    return { error: "Elegí una fecha y un horario." };
  }

  const [{ data: service }, { data: staff }] = await Promise.all([
    supabase
      .from("services")
      .select("*")
      .eq("id", serviceId)
      .eq("business_id", businessId)
      .eq("active", true)
      .maybeSingle(),
    supabase
      .from("staff")
      .select("*")
      .eq("id", staffId)
      .eq("business_id", businessId)
      .eq("active", true)
      .maybeSingle(),
  ]);

  if (!service || !staff) {
    return { error: "Ese servicio o esa persona ya no están disponibles." };
  }

  // Recalculamos disponibilidad server-side antes de reservar, para no
  // confiar ciegamente en lo que mandó el cliente (pudo haber quedado
  // desactualizado si otra persona reservó ese mismo horario mientras
  // tanto). El exclude constraint en la base es la red de seguridad final.
  const availability = await getAvailableSlots(staffId, serviceId, dateStr);
  if (availability.error || !availability.slots?.includes(timeStr)) {
    return { error: "Ese horario ya no está disponible, elegí otro." };
  }

  const startAt = combineDateAndTimeToISO(dateStr, timeStr);
  const endAt = new Date(
    new Date(startAt).getTime() + service.duration_minutes * 60000
  ).toISOString();

  const { error } = await supabase.from("bookings").insert({
    business_id: businessId,
    staff_id: staffId,
    service_id: serviceId,
    client_id: user.id,
    start_at: startAt,
    end_at: endAt,
    status: "confirmed",
    notes: notes || null,
  });

  if (error) {
    // 23P01 = exclusion_violation: otra reserva se metió justo en el medio.
    if (error.code === "23P01") {
      return { error: "Justo se ocupó ese horario, elegí otro." };
    }
    return { error: error.message };
  }

  redirect("/mis-turnos?reservado=1");
}
