import Link from "next/link";
import { redirect } from "next/navigation";
import { requireOwnerBusiness } from "@/lib/dashboard/require-owner-business";
import { formatDateTimeLongAR, formatTimeAR } from "@/lib/booking/time";
import { CancelOwnerBookingButton } from "./cancel-owner-booking-button";
import { CompleteBookingButton } from "./complete-booking-button";
import { DaySchedule } from "./day-schedule";
import { STATUS_LABELS, statusBadgeClass } from "@/lib/booking/status-styles";
import type { BookingStatus } from "@/types/database";

type BookingRow = {
  id: string;
  start_at: string;
  end_at: string;
  status: BookingStatus;
  service_id: string;
  client_id: string;
};

export default async function StaffTurnosPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: staffId } = await params;
  const { supabase, business } = await requireOwnerBusiness();

  const { data: staff } = await supabase
    .from("staff")
    .select("id, full_name")
    .eq("id", staffId)
    .eq("business_id", business.id)
    .maybeSingle();

  if (!staff) {
    redirect("/dashboard/staff");
  }

  const nowISO = new Date().toISOString();

  const [{ data: upcomingRaw }, { data: pastRaw }] = await Promise.all([
    supabase
      .from("bookings")
      .select("id, start_at, end_at, status, service_id, client_id")
      .eq("staff_id", staffId)
      .in("status", ["pending", "confirmed"])
      .gte("start_at", nowISO)
      .order("start_at", { ascending: true }),
    supabase
      .from("bookings")
      .select("id, start_at, end_at, status, service_id, client_id")
      .eq("staff_id", staffId)
      .in("status", ["pending", "confirmed"])
      .lt("start_at", nowISO)
      .order("start_at", { ascending: false })
      .limit(20),
  ]);

  const upcoming = upcomingRaw ?? [];
  const past = pastRaw ?? [];
  const allRows = [...upcoming, ...past];

  const serviceIds = [...new Set(allRows.map((b) => b.service_id))];
  const clientIds = [...new Set(allRows.map((b) => b.client_id))];

  const [servicesRes, clientsRes] = await Promise.all([
    serviceIds.length
      ? supabase.from("services").select("id, name").in("id", serviceIds)
      : Promise.resolve({ data: [] as { id: string; name: string }[] }),
    clientIds.length
      ? supabase.from("profiles").select("id, full_name").in("id", clientIds)
      : Promise.resolve({ data: [] as { id: string; full_name: string }[] }),
  ]);

  const serviceById = new Map((servicesRes.data ?? []).map((s) => [s.id, s.name]));
  const clientById = new Map((clientsRes.data ?? []).map((c) => [c.id, c.full_name]));

  function renderBooking(booking: BookingRow, pastBooking: boolean) {
    return (
      <li
        key={booking.id}
        className="rounded-lg border border-border bg-surface px-4 py-3 transition-colors hover:border-border-strong"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-medium">
              {serviceById.get(booking.service_id) ?? "Servicio"} ·{" "}
              {clientById.get(booking.client_id) ?? "Cliente"}
            </p>
            <p className="mt-1 text-sm capitalize text-muted">
              {formatDateTimeLongAR(booking.start_at)} a las{" "}
              {formatTimeAR(booking.start_at)}
            </p>
          </div>
          <span className={statusBadgeClass(booking.status)}>
            {STATUS_LABELS[booking.status]}
          </span>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-4">
          {pastBooking && <CompleteBookingButton bookingId={booking.id} />}
          <Link
            href={`/dashboard/staff/${staffId}/turnos/${booking.id}/reprogramar`}
            className="text-sm text-muted underline decoration-muted/40 underline-offset-2 transition-colors hover:text-accent"
          >
            Reprogramar
          </Link>
          <CancelOwnerBookingButton bookingId={booking.id} />
        </div>
      </li>
    );
  }

  return (
    <main className="mx-auto min-h-screen max-w-2xl px-4 py-10 sm:px-6 sm:py-12">
      <Link
        href="/dashboard/staff"
        className="text-sm text-muted underline decoration-muted/40 underline-offset-2 transition-colors hover:text-accent"
      >
        ← Volver a staff
      </Link>

      <h1 className="mt-4 text-2xl font-bold">Turnos de {staff.full_name}</h1>

      <section className="mt-8">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
          Próximos turnos
        </h2>

        {upcoming.length === 0 ? (
          <p className="mt-3 text-sm text-muted">
            No tiene turnos reservados todavía.
          </p>
        ) : (
          <ul className="mt-3 flex flex-col gap-3">
            {upcoming.map((booking) => renderBooking(booking, false))}
          </ul>
        )}
      </section>

      {past.length > 0 && (
        <section className="mt-10">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
            Turnos pasados sin cerrar
          </h2>
          <p className="mt-1 text-sm text-muted">
            Ya pasó la fecha y siguen como pendientes o confirmados. Marcalos
            como completados o cancelalos si no se presentaron.
          </p>
          <ul className="mt-3 flex flex-col gap-3">
            {past.map((booking) => renderBooking(booking, true))}
          </ul>
        </section>
      )}

      <section className="mt-10 border-t border-border pt-8">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
          Disponibilidad por día
        </h2>
        <DaySchedule staffId={staffId} />
      </section>
    </main>
  );
}
