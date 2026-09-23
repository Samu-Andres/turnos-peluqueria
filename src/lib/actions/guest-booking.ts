"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { combineDateAndTimeToISO } from "@/lib/booking/time";
import { getAvailableSlots } from "@/lib/actions/booking-flow";
import type { RescheduleFormState } from "@/lib/actions/reschedule";
import type { Booking } from "@/types/database";

/**
 * Trae un turno por su manage_token: el link que se muestra una sola vez
 * al confirmar una reserva de invitado (sin cuenta). No requiere sesión;
 * la función de la base valida el token puertas adentro (security
 * definer), así que acá solo la llamamos.
 */
export async function getBookingByToken(token: string): Promise<Booking | null> {
  const supabase = await createClient();
  const { data } = await supabase.rpc("get_booking_by_token", {
    p_token: token,
  });
  return data?.[0] ?? null;
}

export async function cancelBookingByToken(token: string): Promise<void> {
  const supabase = await createClient();
  await supabase.rpc("cancel_booking_by_token", { p_token: token });
  revalidatePath(`/mi-turno/${token}`);
}

export async function rescheduleBookingByToken(
  token: string,
  _prevState: RescheduleFormState,
  formData: FormData
): Promise<RescheduleFormState> {
  const supabase = await createClient();

  const booking = await getBookingByToken(token);
  if (!booking) {
    return { error: "No encontramos ese turno." };
  }
  if (booking.status !== "pending" && booking.status !== "confirmed") {
    return { error: "Ese turno ya no se puede reprogramar." };
  }

  const { data: service } = await supabase
    .from("services")
    .select("duration_minutes")
    .eq("id", booking.service_id)
    .maybeSingle();

  if (!service) {
    return { error: "No encontramos el servicio de ese turno." };
  }

  const dateStr = String(formData.get("date") ?? "").trim();
  const timeStr = String(formData.get("time") ?? "").trim();
  if (!dateStr || !timeStr) {
    return { error: "Elegí una fecha y un horario." };
  }

  const availability = await getAvailableSlots(
    booking.staff_id,
    booking.service_id,
    dateStr,
    booking.id
  );
  if (availability.error || !availability.slots?.includes(timeStr)) {
    return { error: "Ese horario ya no está disponible, elegí otro." };
  }

  const startAt = combineDateAndTimeToISO(dateStr, timeStr);
  const endAt = new Date(
    new Date(startAt).getTime() + service.duration_minutes * 60000
  ).toISOString();

  const { data: ok, error } = await supabase.rpc("reschedule_booking_by_token", {
    p_token: token,
    p_start: startAt,
    p_end: endAt,
  });

  if (error) {
    if (error.code === "23P01") {
      return { error: "Justo se ocupó ese horario, elegí otro." };
    }
    return { error: error.message };
  }
  if (!ok) {
    return { error: "Ese turno ya no se puede reprogramar." };
  }

  redirect(`/mi-turno/${token}?reprogramado=1`);
}
