import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getBusinessBySlug } from "@/lib/booking/get-business";
import { formatPrice } from "@/lib/format";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { slug } = await params;
  const business = await getBusinessBySlug(slug);

  return {
    title: business ? `${business.name} — Turnos Peluquería` : "Turnos Peluquería",
    description: business?.description ?? "Reservá tu turno online.",
  };
}

export default async function BusinessPage({ params }: { params: Params }) {
  const { slug } = await params;
  const business = await getBusinessBySlug(slug);

  if (!business) {
    notFound();
  }

  const supabase = await createClient();

  const [{ data: services }, { data: staff }] = await Promise.all([
    supabase
      .from("services")
      .select("*")
      .eq("business_id", business.id)
      .eq("active", true)
      .order("name", { ascending: true }),
    supabase
      .from("staff")
      .select("id, full_name")
      .eq("business_id", business.id)
      .eq("active", true)
      .order("full_name", { ascending: true }),
  ]);

  const hasStaff = Boolean(staff && staff.length > 0);

  return (
    <main className="mx-auto min-h-screen max-w-2xl px-6 py-12">
      <h1 className="text-3xl font-bold">{business.name}</h1>
      {(business.address || business.phone) && (
        <p className="mt-1 text-sm text-neutral-500">
          {[business.address, business.phone].filter(Boolean).join(" · ")}
        </p>
      )}
      {business.description && (
        <p className="mt-4 text-sm">{business.description}</p>
      )}

      <div className="mt-10">
        <h2 className="text-lg font-semibold">Servicios</h2>

        {!hasStaff && (
          <p className="mt-2 text-sm text-neutral-500">
            Este negocio todavía no tiene turnos disponibles para reservar
            online.
          </p>
        )}

        {services && services.length > 0 ? (
          <ul className="mt-4 flex flex-col gap-3">
            {services.map((service) => (
              <li
                key={service.id}
                className="flex items-center justify-between gap-4 rounded-md border border-neutral-200 px-4 py-3"
              >
                <div>
                  <p className="font-medium">{service.name}</p>
                  <p className="text-sm text-neutral-500">
                    {service.duration_minutes} min ·{" "}
                    {formatPrice(service.price)}
                  </p>
                </div>
                {hasStaff && (
                  <Link
                    href={`/${business.slug}/reservar?service=${service.id}`}
                    className="shrink-0 rounded-md bg-neutral-900 px-4 py-2 text-sm font-semibold text-white"
                  >
                    Reservar
                  </Link>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-neutral-500">
            Todavía no hay servicios cargados.
          </p>
        )}
      </div>
    </main>
  );
}
