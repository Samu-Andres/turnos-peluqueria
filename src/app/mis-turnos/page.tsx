import Link from "next/link";
import { CalendarPlus } from "lucide-react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatDateTimeLongAR, formatTimeAR } from "@/lib/booking/time";
import { CancelBookingButton } from "./cancel-booking-button";
import { STATUS_LABELS, statusBadgeClass } from "@/lib/booking/status-styles";

export default async function MisTurnosPage({
  searchParams,
}: {
  searchParams: Promise<{ reservado?: string }>;
}) {
  const { reservado } = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=${encodeURIComponent("/mis-turnos")}`);
  }

  const { data: bookings } = await supabase
    .from("bookings")
    .select("*")
    .eq("client_id", user.id)
    .order("start_at", { ascending: false });

  const rows = bookings ?? [];

  const serviceIds = [...new Set(rows.map((b) => b.service_id))];
  const staffIds = [...new Set(rows.map((b) => b.staff_id))];
  const businessIds = [...new Set(rows.map((b) => b.business_id))];

  const [servicesRes, staffRes, businessesRes] = await Promise.all([
    serviceIds.length
      ? supabase.from("services").select("id, name").in("id", serviceIds)
      : Promise.resolve({ data: [] as { id: string; name: string }[] }),
    staffIds.length
      ? supabase.from("staff").select("id, full_name").in("id", staffIds)
      : Promise.resolve({ data: [] as { id: string; full_name: string }[] }),
    businessIds.length
      ? supabase.from("businesses").select("id, name, slug").in("id", businessIds)
      : Promise.resolve({ data: [] as { id: string; name: string; slug: string }[] }),
  ]);

  const serviceById = new Map((servicesRes.data ?? []).map((s) => [s.id, s]));
  const staffById = new Map((staffRes.data ?? []).map((s) => [s.id, s]));
  const businessById = new Map((businessesRes.data ?? []).map((b) => [b.id, b]));

  return (
    <main className="page">
      <h1 className="page-title">Mis turnos</h1>
      <p className="page-subtitle">Tus reservas en todas las peluquerías.</p>

      {reservado === "1" && (
        <p className="alert-success mt-4">
          ¡Listo! Tu turno quedó pendiente de confirmación por el negocio.
        </p>
      )}

      <div className="mt-8">
        {rows.length === 0 ? (
          <div className="card flex flex-col items-center p-8 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-soft text-accent">
              <CalendarPlus aria-hidden className="h-6 w-6" />
            </span>
            <p className="mt-4 font-semibold">Todavía no reservaste ningún turno</p>
            <p className="mt-1 text-sm text-muted">
              Elegí una peluquería y sacá tu primer turno.
            </p>
            <Link href="/#peluquerias" className="btn btn-primary mt-5">
              Buscar peluquería
            </Link>
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {rows.map((booking) => {
              const service = serviceById.get(booking.service_id);
              const staffMember = staffById.get(booking.staff_id);
              const business = businessById.get(booking.business_id);
              const cancellable =
                booking.status === "pending" || booking.status === "confirmed";

              return (
                <li
                  key={booking.id}
                  className="card px-4 py-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold">
                        {service?.name ?? "Servicio"}
                        {business && ` · ${business.name}`}
                      </p>
                      <p className="mt-1 text-sm capitalize text-muted">
                        {formatDateTimeLongAR(booking.start_at)} a las{" "}
                        {formatTimeAR(booking.start_at)}
                        {staffMember && ` · con ${staffMember.full_name}`}
                      </p>
                      {booking.client_address && (
                        <p className="mt-1 text-sm text-muted">
                          Turno a domicilio en: {booking.client_address}
                        </p>
                      )}
                    </div>
                    <span className={statusBadgeClass(booking.status)}>
                      {STATUS_LABELS[booking.status]}
                    </span>
                  </div>

                  {cancellable && (
                    <div className="-ml-2 mt-3 flex flex-wrap items-center gap-1 border-t border-border pt-3">
                      <Link
                        href={`/mis-turnos/${booking.id}/reprogramar`}
                        className="action"
                      >
                        Reprogramar
                      </Link>
                      <CancelBookingButton bookingId={booking.id} />
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </main>
  );
}
