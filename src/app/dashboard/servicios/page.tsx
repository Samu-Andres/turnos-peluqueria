import Link from "next/link";
import { requireOwnerBusiness } from "@/lib/dashboard/require-owner-business";
import { ServiceForm } from "./service-form";
import { ServiceRow } from "./service-row";

export default async function ServiciosPage() {
  const { supabase, business } = await requireOwnerBusiness();

  const { data: services } = await supabase
    .from("services")
    .select("*")
    .eq("business_id", business.id)
    .order("created_at", { ascending: true });

  return (
    <main className="mx-auto min-h-screen max-w-2xl px-6 py-12">
      <Link href="/dashboard" className="text-sm text-neutral-500 underline">
        ← Volver al panel
      </Link>

      <h1 className="mt-4 text-2xl font-bold">Servicios de {business.name}</h1>
      <p className="mt-1 text-sm text-neutral-500">
        Los servicios que tus clientes van a poder elegir al reservar un
        turno.
      </p>

      <div className="mt-8">
        {services && services.length > 0 ? (
          <ul className="flex flex-col gap-3">
            {services.map((service) => (
              <ServiceRow key={service.id} service={service} />
            ))}
          </ul>
        ) : (
          <p className="text-sm text-neutral-500">
            Todavía no cargaste ningún servicio.
          </p>
        )}
      </div>

      <div className="mt-10 border-t border-neutral-200 pt-8">
        <h2 className="text-lg font-semibold">Agregar servicio</h2>
        <ServiceForm />
      </div>
    </main>
  );
}
