import Link from "next/link";
import { requireStaffSelf } from "@/lib/dashboard/require-staff-access";
import { saveWorkingHours } from "@/lib/actions/working-hours";
import { WorkingHoursForm } from "@/components/working-hours-form";

export default async function StaffHorariosPage() {
  const { supabase, staff } = await requireStaffSelf();

  const { data: hours } = await supabase
    .from("working_hours")
    .select("*")
    .eq("staff_id", staff.id)
    .order("day_of_week", { ascending: true });

  const action = saveWorkingHours.bind(null, staff.id);

  return (
    <main className="mx-auto min-h-screen max-w-2xl px-4 py-10 sm:px-6 sm:py-12">
      <Link
        href="/staff"
        className="text-sm text-muted underline decoration-muted/40 underline-offset-2 transition-colors hover:text-accent"
      >
        ← Volver a tu panel
      </Link>

      <h1 className="mt-4 text-2xl font-bold">Tus horarios</h1>
      <p className="mt-1 text-sm text-muted">
        Tildá los días que trabajás y definí el horario. Los clientes solo
        van a poder reservar turnos dentro de estos rangos.
      </p>

      <WorkingHoursForm action={action} initialHours={hours ?? []} />
    </main>
  );
}
