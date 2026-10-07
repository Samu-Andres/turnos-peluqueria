import type { Metadata } from "next";
import Link from "next/link";
import { CalendarX2, CircleCheck } from "lucide-react";
import { requireOwnerBusiness } from "@/lib/dashboard/require-owner-business";
import {
  addDaysToDateStr,
  formatDateLongAR,
  isoToDateStrAR,
  todayInBusinessTZ,
} from "@/lib/booking/time";
import {
  OwnerBookingCard,
  type OwnerBookingRow,
} from "@/components/owner-booking-card";

export const metadata: Metadata = { title: "Agenda" };

const BOOKING_COLUMNS =
  "id, staff_id, start_at, end_at, status, service_id, client_name, client_phone, client_address";

/**
 * Agenda general del negocio: los turnos de todo el staff juntos (con
 * filtro por persona). Arriba los que esperan confirmación, después los
 * confirmados agrupados por día, y al final los que ya pasaron y nadie
 * cerró. Cada persona del staff sigue viendo solo los suyos en /staff.
 */
export default async function AgendaPage({
  searchParams,
}: {
  searchParams: Promise<{ barbero?: string; reprogramado?: string }>;
}) {
  const { barbero, reprogramado } = await searchParams;
  const { supabase, business } = await requireOwnerBusiness();

  const { data: staffData } = await supabase
    .from("staff")
    .select("id, full_name, active")
    .eq("business_id", business.id)
    .order("full_name", { ascending: true });

  const staff = staffData ?? [];
  const selectedStaff = staff.find((p) => p.id === barbero) ?? null;
  const staffNameById = new Map(staff.map((p) => [p.id, p.full_name]));

  const nowISO = new Date().toISOString();

  let upcomingQuery = supabase
    .from("bookings")
    .select(BOOKING_COLUMNS)
    .eq("business_id", business.id)
    .in("status", ["pending", "confirmed"])
    .gte("start_at", nowISO)
    .order("start_at", { ascending: true })
    .limit(300);

  let pastQuery = supabase
    .from("bookings")
    .select(BOOKING_COLUMNS)
    .eq("business_id", business.id)
    .in("status", ["pending", "confirmed"])
    .lt("start_at", nowISO)
    .order("start_at", { ascending: false })
    .limit(30);

  if (selectedStaff) {
    upcomingQuery = upcomingQuery.eq("staff_id", selectedStaff.id);
    pastQuery = pastQuery.eq("staff_id", selectedStaff.id);
  }

  const [{ data: upcomingRaw }, { data: pastRaw }] = await Promise.all([
    upcomingQuery,
    pastQuery,
  ]);

  const upcoming: OwnerBookingRow[] = upcomingRaw ?? [];
  const past: OwnerBookingRow[] = pastRaw ?? [];

  const serviceIds = [...new Set([...upcoming, ...past].map((b) => b.service_id))];
  const { data: servicesData } = serviceIds.length
    ? await supabase.from("services").select("id, name").in("id", serviceIds)
    : { data: [] as { id: string; name: string }[] };
  const serviceNameById = new Map((servicesData ?? []).map((s) => [s.id, s.name]));

  const pending = upcoming.filter((b) => b.status === "pending");
  const confirmed = upcoming.filter((b) => b.status === "confirmed");

  const confirmedByDay = new Map<string, OwnerBookingRow[]>();
  for (const booking of confirmed) {
    const day = isoToDateStrAR(booking.start_at);
    confirmedByDay.set(day, [...(confirmedByDay.get(day) ?? []), booking]);
  }

  const today = todayInBusinessTZ();
  const tomorrow = addDaysToDateStr(today, 1);
  function dayLabel(dateStr: string) {
    if (dateStr === today) return "Hoy";
    if (dateStr === tomorrow) return "Mañana";
    return formatDateLongAR(dateStr);
  }

  // Con un solo barbero no hace falta repetir su nombre en cada turno.
  const showStaffName = !selectedStaff && staff.length > 1;

  function card(booking: OwnerBookingRow, options: { showDate?: boolean; past?: boolean } = {}) {
    return (
      <OwnerBookingCard
        key={booking.id}
        booking={booking}
        serviceName={serviceNameById.get(booking.service_id) ?? "Servicio"}
        staffName={showStaffName ? staffNameById.get(booking.staff_id) : null}
        rescheduleHref={`/dashboard/staff/${booking.staff_id}/turnos/${booking.id}/reprogramar?desde=agenda`}
        {...options}
      />
    );
  }

  const isEmpty = upcoming.length === 0 && past.length === 0;

  return (
    <main className="page">
      <Link href="/dashboard" className="back-link">
        ← Volver al panel
      </Link>

      <h1 className="page-title mt-4">Agenda</h1>
      <p className="page-subtitle">
        Los turnos de {business.name}
        {selectedStaff ? ` con ${selectedStaff.full_name}` : ", de todo el staff"}.
      </p>

      {reprogramado === "1" && (
        <p className="alert-success mt-4">El turno quedó reprogramado.</p>
      )}

      {staff.length > 1 && (
        <nav aria-label="Filtrar por barbero" className="-mx-1 mt-6 flex gap-2 overflow-x-auto px-1 pb-1">
          <Link
            href="/dashboard/agenda"
            aria-current={!selectedStaff ? "page" : undefined}
            className={`flex min-h-10 shrink-0 items-center px-4 ${
              !selectedStaff ? "option-selected" : "option"
            }`}
          >
            Todos
          </Link>
          {staff.map((person) => (
            <Link
              key={person.id}
              href={`/dashboard/agenda?barbero=${person.id}`}
              aria-current={selectedStaff?.id === person.id ? "page" : undefined}
              className={`flex min-h-10 shrink-0 items-center px-4 ${
                selectedStaff?.id === person.id ? "option-selected" : "option"
              }`}
            >
              {person.full_name}
            </Link>
          ))}
        </nav>
      )}

      {isEmpty && (
        <div className="card mt-8 flex flex-col items-center p-8 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-sunken text-muted">
            <CalendarX2 aria-hidden className="h-6 w-6" />
          </span>
          <p className="mt-4 font-semibold">No hay turnos próximos</p>
          <p className="mt-1 text-sm text-muted">
            Compartí el link de tu página para que te empiecen a reservar.
          </p>
          <Link href={`/${business.slug}`} className="btn btn-secondary mt-5">
            Ver mi página
          </Link>
        </div>
      )}

      {pending.length > 0 && (
        <section className="mt-8">
          <h2 className="flex items-center gap-2 font-semibold">
            Para confirmar
            <span className="rounded-full bg-warning-soft px-2 py-0.5 text-xs font-bold text-warning">
              {pending.length}
            </span>
          </h2>
          <p className="mt-1 text-sm text-muted">
            Reservas nuevas: confirmalas para que el cliente sepa que lo
            esperan.
          </p>
          <ul className="mt-3 flex flex-col gap-3">
            {pending.map((booking) => card(booking, { showDate: true }))}
          </ul>
        </section>
      )}

      {confirmed.length > 0 && (
        <section className="mt-10">
          <h2 className="flex items-center gap-2 font-semibold">
            <CircleCheck aria-hidden className="h-4.5 w-4.5 text-success" />
            Confirmados
          </h2>
          <div className="mt-3 flex flex-col gap-6">
            {[...confirmedByDay.entries()].map(([day, bookings]) => (
              <div key={day}>
                <h3 className="mb-2 flex items-baseline gap-2 text-sm font-semibold">
                  <span className="first-letter:uppercase">{dayLabel(day)}</span>
                  <span className="text-xs font-normal text-muted">
                    {bookings.length} {bookings.length === 1 ? "turno" : "turnos"}
                  </span>
                </h3>
                <ul className="flex flex-col gap-3">
                  {bookings.map((booking) => card(booking))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      )}

      {past.length > 0 && (
        <section className="mt-10 border-t border-border pt-8">
          <h2 className="font-semibold">Pasados sin cerrar</h2>
          <p className="mt-1 text-sm text-muted">
            Ya pasó el horario y siguen abiertos. Marcalos como completados,
            o cancelalos si no vinieron para que no cuenten en la facturación.
          </p>
          <ul className="mt-3 flex flex-col gap-3">
            {past.map((booking) => card(booking, { showDate: true, past: true }))}
          </ul>
        </section>
      )}
    </main>
  );
}
