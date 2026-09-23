"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
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
 * El dueño o la propia persona asignada (si tiene cuenta de staff)
 * reprograman un turno "del lado del negocio". Igual que en
 * staff-schedule.ts, se valida explícitamente quién llama en vez de
 * apoyarse en la policy de bookings: esa policy también deja pasar al
 * cliente dueño del turno (para "Mis turnos"), pero acá no queremos
 * que el cliente pueda reprogramar por esta vía paralela.
 */
export async function rescheduleBookingAsOwner(
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
    .maybeSingle();

  if (!booking) {
    return { error: "No encontramos ese turno." };
  }

  const [{ data: business }, { data: staff }] = await Promise.all([
    supabase
      .from("businesses")
      .select("owner_id")
      .eq("id", booking.business_id)
      .maybeSingle(),
    supabase
      .from("staff")
      .select("user_id")
      .eq("id", booking.staff_id)
      .maybeSingle(),
  ]);

  const isOwner = business?.owner_id === user.id;
  const isAssignedStaff = staff?.user_id === user.id;

  if (!isOwner && !isAssignedStaff) {
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

  // El dueño vuelve al listado de turnos de ese staff; la propia
  // persona (si fue quien reprogramó) vuelve a su propio listado.
  redirect(
    isOwner
      ? `/dashboard/staff/${booking.staff_id}/turnos?reprogramado=1`
      : "/staff/turnos?reprogramado=1"
  );
}
