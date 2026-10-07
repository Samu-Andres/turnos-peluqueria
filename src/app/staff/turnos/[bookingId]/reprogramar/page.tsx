import Link from "next/link";
import { redirect } from "next/navigation";
import { requireStaffSelf } from "@/lib/dashboard/require-staff-access";
import { formatDateTimeLongAR, formatTimeAR } from "@/lib/booking/time";
import { RescheduleFlow } from "@/components/reschedule-flow";
import { rescheduleBookingAsOwner } from "@/lib/actions/reschedule";

export default async function ReprogramarTurnoStaffPage({
  params,
}: {
  params: Promise<{ bookingId: string }>;
}) {
  const { bookingId } = await params;
  const { supabase, staff } = await requireStaffSelf();

  const { data: booking } = await supabase
    .from("bookings")
    .select("*")
    .eq("id", bookingId)
    .eq("staff_id", staff.id)
    .maybeSingle();

  if (
    !booking ||
    (booking.status !== "pending" && booking.status !== "confirmed")
  ) {
    redirect("/staff/turnos");
  }

  const { data: service } = await supabase
    .from("services")
    .select("name")
    .eq("id", booking.service_id)
    .maybeSingle();

  const summary = `${service?.name ?? "Servicio"}${
    booking.client_name ? ` · ${booking.client_name}` : ""
  } — actualmente el ${formatDateTimeLongAR(booking.start_at)} a las ${formatTimeAR(
    booking.start_at
  )}`;

  return (
    <main className="page">
      <Link
        href="/staff/turnos"
        className="back-link"
      >
        ← Volver a tus turnos
      </Link>

      <h1 className="page-title mt-4">Reprogramar turno</h1>

      <RescheduleFlow
        bookingId={booking.id}
        staffId={booking.staff_id}
        serviceId={booking.service_id}
        summary={summary}
        backHref="/staff/turnos"
        action={rescheduleBookingAsOwner.bind(null, booking.id, null)}
      />
    </main>
  );
}
