"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireOwnerBusiness } from "@/lib/dashboard/require-owner-business";
import { combineDateAndTimeToISO } from "@/lib/booking/time";
import { getAvailableSlots } from "@/lib/actions/booking-flow";

export type RescheduleFormState = {
  error: string | null;
};

function readDateAndTime(formData: FormData): { dateStr: string; timeStr: string } {
  return {
    dateStr: String(formData.get("date") ?? "").trim(),
    timeStr: String(formData.get("time") ?? "").trim(),
  };
}

/**
 * El cliente reprograma un turno propio: misma persona y mismo servicio,
 * solo cambia la fecha/hora.
 */
export async function rescheduleBookingAsClient(
  bookingId: string,
  _prevState: RescheduleFormState,
  formData: FormData
): Promise<RescheduleFormState> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Iniciá sesión para reprogramar el turno." };
  }

  const { data: booking } = await supabase
    .from("bookings")
    .select("*")
    .eq("id", bookingId)
    .eq("client_id", user.id)
    .maybeSingle();

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

  const { dateStr, timeStr } = readDateAndTime(formData);
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

  const { error } = await supabase
    .from("bookings")
    .update({ start_at: startAt, end_at: endAt })
    .eq("id", booking.id);

  if (error) {
    if (error.code === "23P01") {
      return { error: "Justo se ocupó ese horario, elegí otro." };
    }
    return { error: error.message };
  }

  redirect("/mis-turnos?reprogramado=1");
}

/**
 * El dueño reprograma un turno de su negocio.
 */
export async function rescheduleBookingAsOwner(
  bookingId: string,
  _prevState: RescheduleFormState,
  formData: FormData
): Promise<RescheduleFormState> {
  const { supabase, business } = await requireOwnerBusiness();

  const { data: booking } = await supabase
    .from("bookings")
    .select("*")
    .eq("id", bookingId)
    .eq("business_id", business.id)
    .maybeSingle();

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

  const { dateStr, timeStr } = readDateAndTime(formData);
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

  const { error } = await supabase
    .from("bookings")
    .update({ start_at: startAt, end_at: endAt })
    .eq("id", booking.id);

  if (error) {
    if (error.code === "23P01") {
      return { error: "Justo se ocupó ese horario, elegí otro." };
    }
    return { error: error.message };
  }

  redirect(`/dashboard/staff/${booking.staff_id}/turnos?reprogramado=1`);
}
