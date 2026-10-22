import type { Metadata } from "next";
import Link from "next/link";
import { requireOwnerBusiness } from "@/lib/dashboard/require-owner-business";
import { createManualBooking } from "@/lib/actions/manual-booking";
import { ManualBookingForm } from "@/components/manual-booking-form";

export const metadata: Metadata = { title: "Cargar turno" };

export default async function NuevoTurnoOwnerPage() {
  const { supabase, business } = await requireOwnerBusiness();

  const [{ data: staff }, { data: services }] = await Promise.all([
    supabase
      .from("staff")
      .select("id, full_name")
      .eq("business_id", business.id)
      .eq("active", true)
      .order("full_name", { ascending: true }),
    supabase
      .from("services")
      .select("id, name, duration_minutes, price")
      .eq("business_id", business.id)
      .eq("active", true)
      .order("name", { ascending: true }),
  ]);

  const ready = (staff?.length ?? 0) > 0 && (services?.length ?? 0) > 0;

  return (
    <main className="page">
      <Link href="/dashboard/agenda" className="back-link">
        ← Volver a la agenda
      </Link>

      <h1 className="page-title mt-4">Cargar turno</h1>
      <p className="page-subtitle">
        Para los turnos que te piden por WhatsApp, por teléfono o en el local:
        así ese horario deja de ofrecerse online. Queda confirmado.
      </p>

      {ready ? (
        <ManualBookingForm
          staffOptions={staff ?? []}
          services={services ?? []}
          backHref="/dashboard/agenda"
          action={createManualBooking.bind(null, "agenda")}
        />
      ) : (
        <p className="alert-warning mt-6">
          Primero cargá al menos un servicio y una persona del staff desde
          el panel.
        </p>
      )}
    </main>
  );
}
