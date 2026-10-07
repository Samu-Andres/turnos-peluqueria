import Link from "next/link";
import { MapPin, Phone, User } from "lucide-react";
import { formatDateTimeLongAR, formatTimeAR } from "@/lib/booking/time";
import { STATUS_LABELS, statusBadgeClass } from "@/lib/booking/status-styles";
import { CancelOwnerBookingButton } from "@/components/cancel-owner-booking-button";
import { CompleteBookingButton } from "@/components/complete-booking-button";
import { ConfirmBookingButton } from "@/components/confirm-booking-button";
import type { BookingStatus } from "@/types/database";

export type OwnerBookingRow = {
  id: string;
  staff_id: string;
  start_at: string;
  end_at: string;
  status: BookingStatus;
  service_id: string;
  client_name: string | null;
  client_phone: string | null;
  client_address: string | null;
};

/**
 * Un turno visto desde el negocio (dueño): hora, cliente, servicio y las
 * acciones para manejarlo. Se usa en la agenda general y en la página de
 * turnos de cada persona del staff.
 */
export function OwnerBookingCard({
  booking,
  serviceName,
  staffName,
  rescheduleHref,
  showDate = false,
  past = false,
}: {
  booking: OwnerBookingRow;
  serviceName: string;
  // Solo en la agenda general, donde se mezclan turnos de varias personas.
  staffName?: string | null;
  rescheduleHref: string;
  showDate?: boolean;
  past?: boolean;
}) {
  return (
    <li className="card flex gap-4 p-4">
      <div className="flex w-14 shrink-0 flex-col items-center border-r border-border pr-4 text-center">
        <span className="text-lg font-bold tabular-nums leading-tight">
          {formatTimeAR(booking.start_at)}
        </span>
        <span className="text-xs tabular-nums text-muted">
          {formatTimeAR(booking.end_at)}
        </span>
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate font-semibold">
              {booking.client_name ?? "Cliente"}
            </p>
            <p className="text-sm text-muted">
              {serviceName}
              {staffName && (
                <>
                  {" · "}
                  <span className="inline-flex items-center gap-1">
                    <User aria-hidden className="h-3.5 w-3.5" />
                    {staffName}
                  </span>
                </>
              )}
            </p>
            {showDate && (
              <p className="text-sm text-muted first-letter:uppercase">
                {formatDateTimeLongAR(booking.start_at)}
              </p>
            )}
          </div>
          <span className={statusBadgeClass(booking.status)}>
            {STATUS_LABELS[booking.status]}
          </span>
        </div>

        {(booking.client_phone || booking.client_address) && (
          <div className="mt-2 flex flex-col gap-1 text-sm text-muted">
            {booking.client_phone && (
              <a
                href={`tel:${booking.client_phone}`}
                className="inline-flex items-center gap-1.5 hover:text-accent"
              >
                <Phone aria-hidden className="h-3.5 w-3.5" />
                {booking.client_phone}
              </a>
            )}
            {booking.client_address && (
              <span className="inline-flex items-center gap-1.5">
                <MapPin aria-hidden className="h-3.5 w-3.5 shrink-0" />
                A domicilio: {booking.client_address}
              </span>
            )}
          </div>
        )}

        <div className="-ml-2 mt-3 flex flex-wrap items-center gap-1 border-t border-border pt-2">
          {booking.status === "pending" && (
            <ConfirmBookingButton bookingId={booking.id} />
          )}
          {past && <CompleteBookingButton bookingId={booking.id} />}
          <Link href={rescheduleHref} className="action">
            Reprogramar
          </Link>
          <CancelOwnerBookingButton bookingId={booking.id} />
        </div>
      </div>
    </li>
  );
}
