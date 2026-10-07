import type { Metadata } from "next";
import Link from "next/link";
import { requireStaffSelf } from "@/lib/dashboard/require-staff-access";
import { saveWorkingHours } from "@/lib/actions/working-hours";
import { WorkingHoursForm } from "@/components/working-hours-form";

export const metadata: Metadata = { title: "Mis horarios" };

export default async function StaffHorariosPage() {
  const { supabase, staff } = await requireStaffSelf();

  const { data: hours } = await supabase
    .from("working_hours")
    .select("*")
    .eq("staff_id", staff.id)
    .order("day_of_week", { ascending: true });

  const action = saveWorkingHours.bind(null, staff.id);

  return (
    <main className="page">
      <Link
        href="/staff"
        className="back-link"
      >
        ← Volver a tu panel
      </Link>

      <h1 className="page-title mt-4">Tus horarios</h1>
      <p className="mt-1 text-sm text-muted">
        Tildá los días que trabajás y definí el horario. Los clientes solo
        van a poder reservar turnos dentro de estos rangos.
      </p>

      <WorkingHoursForm action={action} initialHours={hours ?? []} />
    </main>
  );
}
