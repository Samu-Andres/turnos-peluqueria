import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatDateTimeLongAR, formatTimeAR } from "@/lib/booking/time";
import { RescheduleFlow } from "@/components/reschedule-flow";
import {
  getBookingByToken,
  rescheduleBookingByToken,
} from "@/lib/actions/guest-booking";

export default async function ReprogramarPorTokenPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const booking = await getBookingByToken(token);

  if (
    !booking ||
    (booking.status !== "pending" && booking.status !== "confirmed")
  ) {
    notFound();
  }

  const supabase = await createClient();

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
  } — ${formatDateTimeLongAR(booking.start_at)}, ${formatTimeAR(
    booking.start_at
  )} hs`;

  return (
    <main className="page">
      <Link
        href={`/mi-turno/${token}`}
        className="back-link"
      >
        ← Volver a tu turno
      </Link>

      <h1 className="page-title mt-4">Reprogramar turno</h1>

      <RescheduleFlow
        bookingId={booking.id}
        staffId={booking.staff_id}
        serviceId={booking.service_id}
        summary={summary}
        backHref={`/mi-turno/${token}`}
        action={rescheduleBookingByToken.bind(null, token)}
      />
    </main>
  );
}
