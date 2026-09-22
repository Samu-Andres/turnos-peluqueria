import Link from "next/link";
import { redirect } from "next/navigation";
import { requireOwnerBusiness } from "@/lib/dashboard/require-owner-business";
import { saveWorkingHours } from "@/lib/actions/working-hours";
import { WorkingHoursForm } from "./working-hours-form";

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
    .order("day_of_week", { ascending: true });

  const action = saveWorkingHours.bind(null, staffId);

  return (
    <main className="mx-auto min-h-screen max-w-2xl px-6 py-12">
      <Link
        href="/dashboard/staff"
        className="text-sm text-neutral-500 underline"
      >
        ← Volver a staff
      </Link>

      <h1 className="mt-4 text-2xl font-bold">
        Horarios de {staff.full_name}
      </h1>
      <p className="mt-1 text-sm text-neutral-500">
        Tildá los días que trabaja y definí el horario. Los clientes solo
        van a poder reservar turnos dentro de estos rangos.
      </p>

      <WorkingHoursForm action={action} initialHours={hours ?? []} />
    </main>
  );
}
