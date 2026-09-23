import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { combineDateAndTimeToISO, todayInBusinessTZ } from "@/lib/booking/time";

export type BusinessMetrics = {
  bookingsThisMonth: number;
  topServiceName: string | null;
  estimatedRevenue: number;
};

/**
 * Métricas simples del mes en curso para el panel del dueño. Solo
 * cuenta turnos "confirmed"/"completed" (no pending ni cancelled): un
 * turno todavía sin confirmar no es un compromiso firme, así que no
 * debería inflar la facturación estimada ni el conteo del mes.
 */
export async function getBusinessMetrics(
  supabase: SupabaseClient<Database>,
  businessId: string
): Promise<BusinessMetrics> {
  const today = todayInBusinessTZ(); // "YYYY-MM-DD"
  const [yearStr, monthStr] = today.split("-");
  const year = Number(yearStr);
  const month = Number(monthStr); // 1-indexado

  const monthStartStr = `${yearStr}-${monthStr}-01`;
  // Date.UTC recibe el mes 0-indexado, así que pasarle `month` (1-indexado)
  // da directamente el día 1 del mes SIGUIENTE.
  const monthEndStr = new Date(Date.UTC(year, month, 1)).toISOString().slice(0, 10);

  const monthStartISO = combineDateAndTimeToISO(monthStartStr, "00:00");
  const monthEndISO = combineDateAndTimeToISO(monthEndStr, "00:00");

  const { data: rows } = await supabase
    .from("bookings")
    .select("service_id")
    .eq("business_id", businessId)
    .in("status", ["confirmed", "completed"])
    .gte("start_at", monthStartISO)
    .lt("start_at", monthEndISO);

  const bookings = rows ?? [];
  const bookingsThisMonth = bookings.length;

  if (bookingsThisMonth === 0) {
    return { bookingsThisMonth: 0, topServiceName: null, estimatedRevenue: 0 };
  }

  const serviceIds = [...new Set(bookings.map((b) => b.service_id))];
  const { data: services } = await supabase
    .from("services")
    .select("id, name, price")
    .in("id", serviceIds);

  const serviceById = new Map((services ?? []).map((s) => [s.id, s]));

  const countByService = new Map<string, number>();
  let estimatedRevenue = 0;

  for (const booking of bookings) {
    countByService.set(
      booking.service_id,
      (countByService.get(booking.service_id) ?? 0) + 1
    );
    estimatedRevenue += serviceById.get(booking.service_id)?.price ?? 0;
  }

  let topServiceId: string | null = null;
  let topCount = 0;
  for (const [serviceId, count] of countByService) {
    if (count > topCount) {
      topCount = count;
      topServiceId = serviceId;
    }
  }

  const topServiceName = topServiceId
    ? serviceById.get(topServiceId)?.name ?? null
    : null;

  return { bookingsThisMonth, topServiceName, estimatedRevenue };
}
