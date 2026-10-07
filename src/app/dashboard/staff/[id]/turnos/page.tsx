import Link from "next/link";
import { redirect } from "next/navigation";
import { requireOwnerBusiness } from "@/lib/dashboard/require-owner-business";
import { DaySchedule } from "@/components/day-schedule";
import {
  OwnerBookingCard,
  type OwnerBookingRow,
} from "@/components/owner-booking-card";


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
      .select("id, staff_id, start_at, end_at, status, service_id, client_name, client_phone, client_address")
      .eq("staff_id", staffId)
      .in("status", ["pending", "confirmed"])
      .gte("start_at", nowISO)
      .order("start_at", { ascending: true }),
    supabase
      .from("bookings")
      .select("id, staff_id, start_at, end_at, status, service_id, client_name, client_phone, client_address")
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

  const servicesRes = serviceIds.length
    ? await supabase.from("services").select("id, name").in("id", serviceIds)
    : { data: [] as { id: string; name: string }[] };

  const serviceById = new Map((servicesRes.data ?? []).map((s) => [s.id, s.name]));

  function renderBooking(booking: OwnerBookingRow, pastBooking: boolean) {
    return (
      <OwnerBookingCard
        key={booking.id}
        booking={booking}
        serviceName={serviceById.get(booking.service_id) ?? "Servicio"}
        rescheduleHref={`/dashboard/staff/${staffId}/turnos/${booking.id}/reprogramar`}
        showDate
        past={pastBooking}
      />
    );
  }

  return (
    <main className="page">
      <Link
        href="/dashboard/staff"
        className="back-link"
      >
        ← Volver a staff
      </Link>

      <h1 className="page-title mt-4">Turnos de {staff.full_name}</h1>
      <p className="page-subtitle">
        ¿Querés ver los de todo el local juntos?{" "}
        <Link href="/dashboard/agenda" className="link">
          Abrí la agenda
        </Link>
        .
      </p>

      <section className="mt-8">
        <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
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
          <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
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
        <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
          Disponibilidad por día
        </h2>
        <DaySchedule staffId={staffId} />
      </section>
    </main>
  );
}
