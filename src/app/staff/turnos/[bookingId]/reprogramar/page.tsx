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
    <main className="mx-auto min-h-screen max-w-2xl px-4 py-10 sm:px-6 sm:py-12">
      <Link
        href="/staff/turnos"
        className="text-sm text-muted underline decoration-muted/40 underline-offset-2 transition-colors hover:text-accent"
      >
        ← Volver a tus turnos
      </Link>

      <h1 className="mt-4 text-2xl font-bold">Reprogramar turno</h1>

      <RescheduleFlow
        bookingId={booking.id}
        staffId={booking.staff_id}
        serviceId={booking.service_id}
        summary={summary}
        backHref="/staff/turnos"
        action={rescheduleBookingAsOwner.bind(null, booking.id)}
      />
    </main>
  );
}
