"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { combineDateAndTimeToISO, formatDateLongAR } from "@/lib/booking/time";

export type ManualBookingFormState = {
  error: string | null;
};

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

/**
 * El negocio carga un turno a mano (lo pidieron por WhatsApp, por
 * teléfono o vino alguien al local), así ese horario deja de ofrecerse
 * online y no se lo reservan encima. Queda confirmado de entrada.
 *
 * Lo puede hacer el dueño (para cualquiera de su staff) o la persona del
 * staff con cuenta (solo para sí misma). No se limita a los horarios de
 * trabajo a propósito: el barbero puede querer meter un turno fuera de
 * hora. Lo único que la base no deja es pisar otro turno.
 */
export async function createManualBooking(
  returnTo: "agenda" | "staff",
  _prevState: ManualBookingFormState,
  formData: FormData
): Promise<ManualBookingFormState> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const staffId = String(formData.get("staff_id") ?? "");
  const serviceId = String(formData.get("service_id") ?? "");
  const dateStr = String(formData.get("date") ?? "").trim();
  const timeStr = String(formData.get("time") ?? "").trim();
  const clientName = String(formData.get("client_name") ?? "").trim();
  const clientPhone = String(formData.get("client_phone") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();

  if (!staffId || !serviceId) {
    return { error: "Elegí con quién y qué servicio." };
  }
  if (!DATE_RE.test(dateStr) || !TIME_RE.test(timeStr)) {
    return { error: "Elegí el día y el horario." };
  }
  if (!clientName) {
    return { error: "Poné el nombre del cliente." };
  }

  const { data: staff } = await supabase
    .from("staff")
    .select("id, business_id, user_id, full_name")
    .eq("id", staffId)
    .maybeSingle();

  if (!staff) {
    return { error: "No encontramos a esa persona del staff." };
  }

  const [{ data: business }, { data: service }] = await Promise.all([
    supabase
      .from("businesses")
      .select("id, owner_id")
      .eq("id", staff.business_id)
      .maybeSingle(),
    supabase
      .from("services")
      .select("id, duration_minutes")
      .eq("id", serviceId)
      .eq("business_id", staff.business_id)
      .maybeSingle(),
  ]);

  const isOwner = business?.owner_id === user.id;
  const isSelf = staff.user_id === user.id;
  if (!business || (!isOwner && !isSelf)) {
    return { error: "No tenés permiso para cargar turnos a esa persona." };
  }
  if (!service) {
    return { error: "Ese servicio no es de este negocio." };
  }

  const startAt = combineDateAndTimeToISO(dateStr, timeStr);
  const endAt = new Date(
    new Date(startAt).getTime() + service.duration_minutes * 60000
  ).toISOString();

  const { error } = await supabase.from("bookings").insert({
    business_id: business.id,
    staff_id: staff.id,
    service_id: service.id,
    client_id: null,
    start_at: startAt,
    end_at: endAt,
    status: "confirmed",
    source: "manual",
    client_name: clientName,
    client_phone: clientPhone || null,
    notes: notes || null,
  });

  if (error) {
    // 23P01 = se pisa con otro turno de la misma persona.
    if (error.code === "23P01") {
      return {
        error: `${staff.full_name} ya tiene un turno que se pisa con ese horario el ${formatDateLongAR(
          dateStr
        )}. Elegí otro horario.`,
      };
    }
    console.error("createManualBooking:", error);
    return { error: "No pudimos guardar el turno, probá de nuevo." };
  }

  revalidatePath("/dashboard/agenda");
  revalidatePath("/dashboard");
  revalidatePath("/staff/turnos");

  redirect(returnTo === "agenda" ? "/dashboard/agenda?cargado=1" : "/staff/turnos?cargado=1");
}
