import type { Metadata } from "next";
import Link from "next/link";
import { requireStaffSelf } from "@/lib/dashboard/require-staff-access";
import { saveWorkingHours } from "@/lib/actions/working-hours";
import { WorkingHoursForm } from "@/components/working-hours-form";
import { TimeOffManager } from "@/components/time-off-manager";
import { todayInBusinessTZ } from "@/lib/booking/time";

export const metadata: Metadata = { title: "Mis horarios" };

export default async function StaffHorariosPage() {
  const { supabase, staff } = await requireStaffSelf();

  const { data: hours } = await supabase
    .from("working_hours")
    .select("*")
    .eq("staff_id", staff.id)
    .order("day_of_week", { ascending: true })
    .order("start_time", { ascending: true });

  const { data: timeOff } = await supabase
    .from("time_off")
    .select("*")
    .eq("staff_id", staff.id)
    .gte("end_date", todayInBusinessTZ())
    .order("start_date", { ascending: true });

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
        Prendé los días que trabajás y poné el horario. Si cerrás al
        mediodía, agregá una segunda franja. Los clientes solo pueden
        reservar dentro de estos horarios.
      </p>

      <WorkingHoursForm action={action} initialHours={hours ?? []} />

      <TimeOffManager staffId={staff.id} entries={timeOff ?? []} />
    </main>
  );
}
