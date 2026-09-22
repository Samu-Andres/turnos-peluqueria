import Link from "next/link";
import { redirect } from "next/navigation";
import { requireOwnerBusiness } from "@/lib/dashboard/require-owner-business";
import { formatDateTimeLongAR, formatTimeAR } from "@/lib/booking/time";
import { CancelOwnerBookingButton } from "./cancel-owner-booking-button";
import { DaySchedule } from "./day-schedule";
import type { BookingStatus } from "@/types/database";

const STATUS_LABELS: Record<BookingStatus, string> = {
  pending: "Pendiente",
  confirmed: "Confirmado",
  cancelled: "Cancelado",
  completed: "Completado",
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

  const { data: upcomingRaw } = await supabase
    .from("bookings")
    .select("id, start_at, end_at, status, service_id, client_id")
    .eq("staff_id", staffId)
    .in("status", ["pending", "confirmed"])
    .gte("start_at", nowISO)
    .order("start_at", { ascending: true });

  const rows = upcomingRaw ?? [];
  const serviceIds = [...new Set(rows.map((b) => b.service_id))];
  const clientIds = [...new Set(rows.map((b) => b.client_id))];

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

  return (
    <main className="mx-auto min-h-screen max-w-2xl px-6 py-12">
      <Link
        href="/dashboard/staff"
        className="text-sm text-neutral-500 underline"
      >
        ← Volver a staff
      </Link>

      <h1 className="mt-4 text-2xl font-bold">Turnos de {staff.full_name}</h1>

      <section className="mt-8">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
          Próximos turnos
        </h2>

        {rows.length === 0 ? (
          <p className="mt-3 text-sm text-neutral-500">
            No tiene turnos reservados todavía.
          </p>
        ) : (
          <ul className="mt-3 flex flex-col gap-3">
            {rows.map((booking) => (
              <li
                key={booking.id}
                className="rounded-md border border-neutral-200 px-4 py-3"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-medium">
                      {serviceById.get(booking.service_id) ?? "Servicio"} ·{" "}
                      {clientById.get(booking.client_id) ?? "Cliente"}
                    </p>
                    <p className="mt-1 text-sm capitalize text-neutral-500">
                      {formatDateTimeLongAR(booking.start_at)} a las{" "}
                      {formatTimeAR(booking.start_at)}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full border border-neutral-300 px-2 py-1 text-xs font-medium text-neutral-600">
                    {STATUS_LABELS[booking.status]}
                  </span>
                </div>

                <div className="mt-3">
                  <CancelOwnerBookingButton bookingId={booking.id} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-10 border-t border-neutral-200 pt-8">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
          Disponibilidad por día
        </h2>
        <DaySchedule staffId={staffId} />
      </section>
    </main>
  );
}
