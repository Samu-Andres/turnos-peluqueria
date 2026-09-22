import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatDateTimeLongAR, formatTimeAR } from "@/lib/booking/time";
import { CancelBookingButton } from "./cancel-booking-button";
import type { Booking } from "@/types/database";

const STATUS_LABELS: Record<Booking["status"], string> = {
  pending: "Pendiente",
  confirmed: "Confirmado",
  cancelled: "Cancelado",
  completed: "Completado",
};

export default async function MisTurnosPage({
  searchParams,
}: {
  searchParams: Promise<{ reservado?: string }>;
}) {
  const { reservado } = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=${encodeURIComponent("/mis-turnos")}`);
  }

  const { data: bookings } = await supabase
    .from("bookings")
    .select("*")
    .eq("client_id", user.id)
    .order("start_at", { ascending: false });

  const rows = bookings ?? [];

  const serviceIds = [...new Set(rows.map((b) => b.service_id))];
  const staffIds = [...new Set(rows.map((b) => b.staff_id))];
  const businessIds = [...new Set(rows.map((b) => b.business_id))];

  const [servicesRes, staffRes, businessesRes] = await Promise.all([
    serviceIds.length
      ? supabase.from("services").select("id, name").in("id", serviceIds)
      : Promise.resolve({ data: [] as { id: string; name: string }[] }),
    staffIds.length
      ? supabase.from("staff").select("id, full_name").in("id", staffIds)
      : Promise.resolve({ data: [] as { id: string; full_name: string }[] }),
    businessIds.length
      ? supabase.from("businesses").select("id, name, slug").in("id", businessIds)
      : Promise.resolve({ data: [] as { id: string; name: string; slug: string }[] }),
  ]);

  const serviceById = new Map((servicesRes.data ?? []).map((s) => [s.id, s]));
  const staffById = new Map((staffRes.data ?? []).map((s) => [s.id, s]));
  const businessById = new Map((businessesRes.data ?? []).map((b) => [b.id, b]));

  return (
    <main className="mx-auto min-h-screen max-w-2xl px-6 py-12">
      <Link href="/" className="text-sm text-neutral-500 underline">
        ← Volver al inicio
      </Link>

      <h1 className="mt-4 text-2xl font-bold">Mis turnos</h1>

      {reservado === "1" && (
        <p className="mt-4 rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          ¡Listo! Tu turno quedó reservado.
        </p>
      )}

      <div className="mt-8">
        {rows.length === 0 ? (
          <p className="text-sm text-neutral-500">
            Todavía no reservaste ningún turno.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {rows.map((booking) => {
              const service = serviceById.get(booking.service_id);
              const staffMember = staffById.get(booking.staff_id);
              const business = businessById.get(booking.business_id);
              const cancellable =
                booking.status === "pending" || booking.status === "confirmed";

              return (
                <li
                  key={booking.id}
                  className="rounded-md border border-neutral-200 px-4 py-3"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-medium">
                        {service?.name ?? "Servicio"}
                        {business && ` · ${business.name}`}
                      </p>
                      <p className="mt-1 text-sm capitalize text-neutral-500">
                        {formatDateTimeLongAR(booking.start_at)} a las{" "}
                        {formatTimeAR(booking.start_at)}
                        {staffMember && ` · con ${staffMember.full_name}`}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-full border border-neutral-300 px-2 py-1 text-xs font-medium text-neutral-600">
                      {STATUS_LABELS[booking.status]}
                    </span>
                  </div>

                  {cancellable && (
                    <div className="mt-3">
                      <CancelBookingButton bookingId={booking.id} />
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </main>
  );
}
