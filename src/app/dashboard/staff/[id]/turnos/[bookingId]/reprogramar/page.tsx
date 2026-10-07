import Link from "next/link";
import { redirect } from "next/navigation";
import { requireOwnerBusiness } from "@/lib/dashboard/require-owner-business";
import { formatDateTimeLongAR, formatTimeAR } from "@/lib/booking/time";
import { RescheduleFlow } from "@/components/reschedule-flow";
import { rescheduleBookingAsOwner } from "@/lib/actions/reschedule";

export default async function ReprogramarTurnoOwnerPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; bookingId: string }>;
  searchParams: Promise<{ desde?: string }>;
}) {
  const { id: staffId, bookingId } = await params;
  const fromAgenda = (await searchParams).desde === "agenda";
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
    redirect(fromAgenda ? "/dashboard/agenda" : `/dashboard/staff/${staffId}/turnos`);
  }

  const { data: service } = await supabase
    .from("services")
    .select("name")
    .eq("id", booking.service_id)
    .maybeSingle();

  const summary = `${service?.name ?? "Servicio"}${
    booking.client_name ? ` · ${booking.client_name}` : ""
  } — ${formatDateTimeLongAR(booking.start_at)}, ${formatTimeAR(
    booking.start_at
  )} hs`;

  const backHref = fromAgenda ? "/dashboard/agenda" : `/dashboard/staff/${staffId}/turnos`;

  return (
    <main className="page">
      <Link
        href={backHref}
        className="back-link"
      >
        {fromAgenda ? "← Volver a la agenda" : `← Volver a turnos de ${staff.full_name}`}
      </Link>

      <h1 className="page-title mt-4">Reprogramar turno</h1>

      <RescheduleFlow
        bookingId={booking.id}
        staffId={booking.staff_id}
        serviceId={booking.service_id}
        summary={summary}
        backHref={backHref}
        action={rescheduleBookingAsOwner.bind(
          null,
          booking.id,
          fromAgenda ? "agenda" : null
        )}
      />
    </main>
  );
}
