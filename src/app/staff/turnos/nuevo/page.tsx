import type { Metadata } from "next";
import Link from "next/link";
import { requireStaffSelf } from "@/lib/dashboard/require-staff-access";
import { createManualBooking } from "@/lib/actions/manual-booking";
import { ManualBookingForm } from "@/components/manual-booking-form";

export const metadata: Metadata = { title: "Cargar turno" };

export default async function NuevoTurnoStaffPage() {
  const { supabase, business, staff } = await requireStaffSelf();

  const { data: services } = await supabase
    .from("services")
    .select("id, name, duration_minutes, price")
    .eq("business_id", business.id)
    .eq("active", true)
    .order("name", { ascending: true });

  return (
    <main className="page">
      <Link href="/staff/turnos" className="back-link">
        ← Volver a tus turnos
      </Link>

      <h1 className="page-title mt-4">Cargar turno</h1>
      <p className="page-subtitle">
        Para los turnos que te piden por WhatsApp, por teléfono o en el local:
        así ese horario deja de ofrecerse online. Queda confirmado.
      </p>

      {services && services.length > 0 ? (
        <ManualBookingForm
          staffOptions={[{ id: staff.id, full_name: staff.full_name }]}
          services={services}
          backHref="/staff/turnos"
          action={createManualBooking.bind(null, "staff")}
        />
      ) : (
        <p className="alert-warning mt-6">
          El negocio todavía no tiene servicios cargados.
        </p>
      )}
    </main>
  );
}
