import type { Metadata } from "next";
import Link from "next/link";
import { CalendarDays, Clock, MapPin, User } from "lucide-react";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatDateTimeLongAR, formatTimeAR } from "@/lib/booking/time";
import { getBookingByToken } from "@/lib/actions/guest-booking";
import { STATUS_LABELS, statusBadgeClass } from "@/lib/booking/status-styles";
import { CancelByTokenButton } from "./cancel-by-token-button";

export const metadata: Metadata = { title: "Tu turno" };

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
      <p className="page-subtitle">
        Guardá este link: desde acá podés reprogramarlo o cancelarlo.
      </p>

      {reprogramado === "1" && (
        <p className="alert-success mt-4">
          ¡Listo! Reprogramamos tu turno.
        </p>
      )}

      <article className="card mt-6 overflow-hidden">
        <div className="flex items-start justify-between gap-4 border-b border-dashed border-border-strong px-5 py-5">
          <div className="min-w-0">
            <p className="text-sm text-muted">{business?.name ?? "Turno"}</p>
            <p className="mt-0.5 text-xl font-bold">{service?.name ?? "Servicio"}</p>
          </div>
          <span className={statusBadgeClass(booking.status)}>
            {STATUS_LABELS[booking.status]}
          </span>
        </div>

        <dl className="grid grid-cols-2 gap-x-4 gap-y-4 px-5 py-5 text-sm">
          <div className="col-span-2 flex items-center gap-3">
            <CalendarDays aria-hidden className="h-5 w-5 shrink-0 text-accent" />
            <div>
              <dt className="sr-only">Día</dt>
              <dd className="font-semibold first-letter:uppercase">
                {formatDateTimeLongAR(booking.start_at)}
              </dd>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Clock aria-hidden className="h-5 w-5 shrink-0 text-accent" />
            <div>
              <dt className="sr-only">Horario</dt>
              <dd className="font-semibold tabular-nums">
                {formatTimeAR(booking.start_at)} hs
              </dd>
            </div>
          </div>
          {staffMember && (
            <div className="flex items-center gap-3">
              <User aria-hidden className="h-5 w-5 shrink-0 text-accent" />
              <div>
                <dt className="sr-only">Con</dt>
                <dd className="font-semibold">{staffMember.full_name}</dd>
              </div>
            </div>
          )}
          {booking.client_address && (
            <div className="col-span-2 flex items-center gap-3">
              <MapPin aria-hidden className="h-5 w-5 shrink-0 text-accent" />
              <div>
                <dt className="text-xs text-muted">Turno a domicilio en</dt>
                <dd className="font-semibold">{booking.client_address}</dd>
              </div>
            </div>
          )}
        </dl>

        {cancellable && (
          <div className="flex flex-col gap-2 border-t border-border bg-surface-sunken/50 px-5 py-4 sm:flex-row sm:items-center">
            <Link
              href={`/mi-turno/${token}/reprogramar`}
              className="btn btn-secondary"
            >
              Cambiar día u horario
            </Link>
            <CancelByTokenButton token={token} />
          </div>
        )}
      </article>
    </main>
  );
}
