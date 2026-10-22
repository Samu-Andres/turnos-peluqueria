import Link from "next/link";
import { redirect } from "next/navigation";
import { requireOwnerBusiness } from "@/lib/dashboard/require-owner-business";
import { saveWorkingHours } from "@/lib/actions/working-hours";
import { WorkingHoursForm } from "@/components/working-hours-form";
import { TimeOffManager } from "@/components/time-off-manager";
import { todayInBusinessTZ } from "@/lib/booking/time";

export default async function StaffHorariosPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: staffId } = await params;
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

  const { data: hours } = await supabase
    .from("working_hours")
    .select("*")
    .eq("staff_id", staffId)
    .order("day_of_week", { ascending: true })
    .order("start_time", { ascending: true });

  const { data: timeOff } = await supabase
    .from("time_off")
    .select("*")
    .eq("staff_id", staffId)
    .gte("end_date", todayInBusinessTZ())
    .order("start_date", { ascending: true });

  const action = saveWorkingHours.bind(null, staffId);

  return (
    <main className="page">
      <Link
        href="/dashboard/staff"
        className="back-link"
      >
        ← Volver a staff
      </Link>

      <h1 className="page-title mt-4">
        Horarios de {staff.full_name}
      </h1>
      <p className="mt-1 text-sm text-muted">
        Prendé los días que trabaja y poné el horario. Si cierra al
        mediodía, agregá una segunda franja. Los clientes solo pueden
        reservar dentro de estos horarios.
      </p>

      <WorkingHoursForm action={action} initialHours={hours ?? []} />

      <TimeOffManager staffId={staffId} entries={timeOff ?? []} />
    </main>
  );
}
