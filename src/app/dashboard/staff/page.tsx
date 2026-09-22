import Link from "next/link";
import { requireOwnerBusiness } from "@/lib/dashboard/require-owner-business";
import { StaffForm } from "./staff-form";
import { StaffRow } from "./staff-row";

export default async function StaffPage() {
  const { supabase, business } = await requireOwnerBusiness();

  const { data: staff } = await supabase
    .from("staff")
    .select("*")
    .eq("business_id", business.id)
    .order("created_at", { ascending: true });

  return (
    <main className="mx-auto min-h-screen max-w-2xl px-4 py-10 sm:px-6 sm:py-12">
      <Link href="/dashboard" className="text-sm text-muted underline decoration-muted/40 underline-offset-2 transition-colors hover:text-accent">
        ← Volver al panel
      </Link>

      <h1 className="mt-4 text-2xl font-bold">Staff de {business.name}</h1>
      <p className="mt-1 text-sm text-muted">
        Las personas que atienden turnos. Desde cada una podés cargar sus
        horarios de disponibilidad.
      </p>

      <div className="mt-8">
        {staff && staff.length > 0 ? (
          <ul className="flex flex-col gap-3">
            {staff.map((person) => (
              <StaffRow key={person.id} staff={person} />
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted">
            Todavía no agregaste a nadie.
          </p>
        )}
      </div>

      <div className="mt-10 border-t border-border pt-8">
        <h2 className="text-lg font-semibold">Agregar persona</h2>
        <StaffForm />
      </div>
    </main>
  );
}
