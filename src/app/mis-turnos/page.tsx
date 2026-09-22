import Link from "next/link";
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
    <main className="mx-auto min-h-screen max-w-2xl px-4 py-10 sm:px-6 sm:py-12">
      <Link href="/" className="text-sm text-muted underline decoration-muted/40 underline-offset-2 transition-colors hover:text-accent">
        ← Volver al inicio
      </Link>

      <h1 className="mt-4 text-2xl font-bold">Mis turnos</h1>

      {reservado === "1" && (
        <p className="mt-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400">
          ¡Listo! Tu turno quedó reservado.
        </p>
      )}

      <div className="mt-8">
        {rows.length === 0 ? (
          <p className="text-sm text-muted">
            Todavía no reservaste ningún turno.
          </p>
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
                  className="rounded-lg border border-border bg-surface px-4 py-3 transition-colors hover:border-border-strong"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-medium">
                        {service?.name ?? "Servicio"}
                        {business && ` · ${business.name}`}
                      </p>
                      <p className="mt-1 text-sm capitalize text-muted">
                        {formatDateTimeLongAR(booking.start_at)} a las{" "}
                        {formatTimeAR(booking.start_at)}
                        {staffMember && ` · con ${staffMember.full_name}`}
                      </p>
                      {booking.client_address && (
                        <p className="mt-1 text-sm text-accent">
                          Turno a domicilio en: {booking.client_address}
                        </p>
                      )}
                    </div>
                    <span className={statusBadgeClass(booking.status)}>
                      {STATUS_LABELS[booking.status]}
                    </span>
                  </div>

                  {cancellable && (
                    <div className="mt-3 flex flex-wrap items-center gap-4">
                      <Link
                        href={`/mis-turnos/${booking.id}/reprogramar`}
                        className="text-sm text-muted underline decoration-muted/40 underline-offset-2 transition-colors hover:text-accent"
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
