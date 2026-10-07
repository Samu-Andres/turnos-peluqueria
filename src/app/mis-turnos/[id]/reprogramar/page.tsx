import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatDateTimeLongAR, formatTimeAR } from "@/lib/booking/time";
import { RescheduleFlow } from "@/components/reschedule-flow";
import { rescheduleBookingAsClient } from "@/lib/actions/reschedule";

export default async function ReprogramarMiTurnoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: bookingId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(
      `/login?next=${encodeURIComponent(`/mis-turnos/${bookingId}/reprogramar`)}`
    );
  }

  const { data: booking } = await supabase
    .from("bookings")
    .select("*")
    .eq("id", bookingId)
    .eq("client_id", user.id)
    .maybeSingle();

  if (
    !booking ||
    (booking.status !== "pending" && booking.status !== "confirmed")
  ) {
    redirect("/mis-turnos");
  }

  const [{ data: service }, { data: staffMember }] = await Promise.all([
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
  ]);

  const summary = `${service?.name ?? "Servicio"}${
    staffMember ? ` · con ${staffMember.full_name}` : ""
  } — actualmente el ${formatDateTimeLongAR(booking.start_at)} a las ${formatTimeAR(
    booking.start_at
  )}`;

  return (
    <main className="page">
      <Link href="/mis-turnos" className="back-link">
        ← Volver a mis turnos
      </Link>

      <h1 className="page-title mt-4">Reprogramar turno</h1>

      <RescheduleFlow
        bookingId={booking.id}
        staffId={booking.staff_id}
        serviceId={booking.service_id}
        summary={summary}
        backHref="/mis-turnos"
        action={rescheduleBookingAsClient.bind(null, booking.id)}
      />
    </main>
  );
}
