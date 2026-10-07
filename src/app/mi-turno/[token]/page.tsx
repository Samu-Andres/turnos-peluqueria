import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatDateTimeLongAR, formatTimeAR } from "@/lib/booking/time";
import { getBookingByToken } from "@/lib/actions/guest-booking";
import { STATUS_LABELS, statusBadgeClass } from "@/lib/booking/status-styles";
import { CancelByTokenButton } from "./cancel-by-token-button";

export default async function MiTurnoPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ reprogramado?: string }>;
}) {
  const { token } = await params;
  const { reprogramado } = await searchParams;

  const booking = await getBookingByToken(token);

  if (!booking) {
    notFound();
  }

  const supabase = await createClient();

  const [{ data: service }, { data: staffMember }, { data: business }] =
    await Promise.all([
      supabase
        .from("services")
        .select("name")
        .eq("id", booking.service_id)
        .maybeSingle(),
      supabase
        .from("staff")
        .select("full_name")
        .eq("id", booking.staff_id)
        .maybeSingle(),
      supabase
        .from("businesses")
        .select("name, slug")
        .eq("id", booking.business_id)
        .maybeSingle(),
    ]);

  const cancellable =
    booking.status === "pending" || booking.status === "confirmed";

  return (
    <main className="page">
      {business && (
        <Link
          href={`/${business.slug}`}
          className="back-link"
        >
          ← Volver a {business.name}
        </Link>
      )}

      <h1 className="page-title mt-4">Tu turno</h1>

      {reprogramado === "1" && (
        <p className="alert-success mt-4">
          ¡Listo! Reprogramamos tu turno.
        </p>
      )}

      <div className="mt-8 rounded-lg border border-border bg-surface px-4 py-3">
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
              href={`/mi-turno/${token}/reprogramar`}
              className="action"
            >
              Reprogramar
            </Link>
            <CancelByTokenButton token={token} />
          </div>
        )}
      </div>
    </main>
  );
}
