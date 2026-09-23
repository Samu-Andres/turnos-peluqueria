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
  } — actualmente el ${formatDateTimeLongAR(booking.start_at)} a las ${formatTimeAR(
    booking.start_at
  )}`;

  return (
    <main className="mx-auto min-h-screen max-w-2xl px-4 py-10 sm:px-6 sm:py-12">
      <Link
        href={`/mi-turno/${token}`}
        className="text-sm text-muted underline decoration-muted/40 underline-offset-2 transition-colors hover:text-accent"
      >
        ← Volver a tu turno
      </Link>

      <h1 className="mt-4 text-2xl font-bold">Reprogramar turno</h1>

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
