"use server";

import { revalidatePath } from "next/cache";
import { requireOwnerBusiness } from "@/lib/dashboard/require-owner-business";
import {
  addDaysToDateStr,
  combineDateAndTimeToISO,
  dayOfWeekOf,
  isoToMinutesSinceMidnight,
  minutesToTimeLabel,
  timeStrToMinutes,
} from "@/lib/booking/time";
import { computeFreeIntervals, type MinuteInterval } from "@/lib/booking/slots";
import type { BookingStatus } from "@/types/database";

export type StaffDayBooking = {
  id: string;
  startTime: string;
  endTime: string;
  status: BookingStatus;
  serviceName: string;
  clientName: string;
  clientPhone: string | null;
  clientAddress: string | null;
};

type TimeRange = { start: string; end: string };

export type StaffDaySchedule =
  | {
      works: true;
      workingRanges: TimeRange[];
      freeRanges: TimeRange[];
      bookings: StaffDayBooking[];
      error?: undefined;
    }
  | { works: false; bookings: StaffDayBooking[]; error?: undefined }
  | { error: string };

/**
 * Trae, para un día puntual, en qué horario trabaja esa persona, qué
 * turnos ya tiene y qué huecos le quedan libres. Solo lo puede pedir el
 * dueño del negocio (vía requireOwnerBusiness).
 */
export async function getStaffDaySchedule(
  staffId: string,
  dateStr: string
): Promise<StaffDaySchedule> {
  const { supabase, business } = await requireOwnerBusiness();

  const { data: staff } = await supabase
    .from("staff")
    .select("id")
    .eq("id", staffId)
    .eq("business_id", business.id)
    .maybeSingle();

  if (!staff) {
    return { error: "No encontramos a esa persona en tu negocio." };
  }

  const day = dayOfWeekOf(dateStr);

  const { data: workingHours } = await supabase
    .from("working_hours")
    .select("start_time, end_time")
    .eq("staff_id", staffId)
    .eq("day_of_week", day);

  const dayStart = combineDateAndTimeToISO(dateStr, "00:00");
  const dayEnd = combineDateAndTimeToISO(addDaysToDateStr(dateStr, 1), "00:00");

  const { data: bookingsRaw } = await supabase
    .from("bookings")
    .select(
      "id, start_at, end_at, status, service_id, client_name, client_phone, client_address"
    )
    .eq("staff_id", staffId)
    .in("status", ["pending", "confirmed"])
    .gte("start_at", dayStart)
    .lt("start_at", dayEnd)
    .order("start_at", { ascending: true });

  const rows = bookingsRaw ?? [];
  const serviceIds = [...new Set(rows.map((b) => b.service_id))];

  const { data: servicesData } = serviceIds.length
    ? await supabase.from("services").select("id, name").in("id", serviceIds)
    : { data: [] as { id: string; name: string }[] };

  const serviceById = new Map((servicesData ?? []).map((s) => [s.id, s.name]));

  const bookings: StaffDayBooking[] = rows.map((b) => ({
    id: b.id,
    startTime: minutesToTimeLabel(isoToMinutesSinceMidnight(b.start_at, dateStr)),
    endTime: minutesToTimeLabel(isoToMinutesSinceMidnight(b.end_at, dateStr)),
    status: b.status,
    serviceName: serviceById.get(b.service_id) ?? "Servicio",
    clientName: b.client_name ?? "Cliente",
    clientPhone: b.client_phone,
    clientAddress: b.client_address,
  }));

  if (!workingHours || workingHours.length === 0) {
    return { works: false, bookings };
  }

  const workingIntervals: MinuteInterval[] = workingHours.map((hours) => ({
    startMinutes: timeStrToMinutes(hours.start_time),
    endMinutes: timeStrToMinutes(hours.end_time),
  }));

  const busyIntervals: MinuteInterval[] = bookings.map((b) => ({
    startMinutes: timeStrToMinutes(b.startTime),
    endMinutes: timeStrToMinutes(b.endTime),
  }));

  const freeIntervals = computeFreeIntervals(workingIntervals, busyIntervals);

  return {
    works: true,
    workingRanges: workingIntervals.map((interval) => ({
      start: minutesToTimeLabel(interval.startMinutes),
      end: minutesToTimeLabel(interval.endMinutes),
    })),
    freeRanges: freeIntervals.map((interval) => ({
      start: minutesToTimeLabel(interval.startMinutes),
      end: minutesToTimeLabel(interval.endMinutes),
    })),
    bookings,
  };
}

export async function ownerCancelBooking(bookingId: string): Promise<void> {
  const { supabase, business } = await requireOwnerBusiness();

  await supabase
    .from("bookings")
    .update({ status: "cancelled" })
    .eq("id", bookingId)
    .eq("business_id", business.id);

  revalidatePath("/dashboard/staff/[id]/turnos", "page");
}

export async function markBookingCompleted(bookingId: string): Promise<void> {
  const { supabase, business } = await requireOwnerBusiness();

  await supabase
    .from("bookings")
    .update({ status: "completed" })
    .eq("id", bookingId)
    .eq("business_id", business.id);

  revalidatePath("/dashboard/staff/[id]/turnos", "page");
}
