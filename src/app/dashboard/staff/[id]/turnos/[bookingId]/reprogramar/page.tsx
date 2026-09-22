import Link from "next/link";
import { redirect } from "next/navigation";
import { requireOwnerBusiness } from "@/lib/dashboard/require-owner-business";
import { formatDateTimeLongAR, formatTimeAR } from "@/lib/booking/time";
import { RescheduleFlow } from "@/components/reschedule-flow";
import { rescheduleBookingAsOwner } from "@/lib/actions/reschedule";

export default async function ReprogramarTurnoOwnerPage({
  params,
}: {
  params: Promise<{ id: string; bookingId: string }>;
}) {
  const { id: staffId, bookingId } = await params;
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

  const { data: booking } = await supabase
    .from("bookings")
    .select("*")
    .eq("id", bookingId)
    .eq("business_id", business.id)
    .eq("staff_id", staffId)
    .maybeSingle();

  if (
    !booking ||
    (booking.status !== "pending" && booking.status !== "confirmed")
  ) {
    redirect(`/dashboard/staff/${staffId}/turnos`);
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
        href={`/dashboard/staff/${staffId}/turnos`}
        className="text-sm text-muted underline decoration-muted/40 underline-offset-2 transition-colors hover:text-accent"
      >
        ← Volver a turnos de {staff.full_name}
      </Link>

      <h1 className="mt-4 text-2xl font-bold">Reprogramar turno</h1>

      <RescheduleFlow
        bookingId={booking.id}
        staffId={booking.staff_id}
        serviceId={booking.service_id}
        summary={summary}
        backHref={`/dashboard/staff/${staffId}/turnos`}
        action={rescheduleBookingAsOwner.bind(null, booking.id)}
      />
    </main>
  );
}
