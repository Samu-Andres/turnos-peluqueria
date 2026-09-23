import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getBusinessBySlug } from "@/lib/booking/get-business";
import { formatPrice } from "@/lib/format";

type Params = Promise<{ slug: string }>;
type SearchParams = Promise<{ reservado?: string }>;

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

export default async function BusinessPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const { slug } = await params;
  const { reservado } = await searchParams;
  const business = await getBusinessBySlug(slug);

  if (!business) {
    notFound();
  }

  const supabase = await createClient();

  const [{ data: services }, { data: staff }, { data: photos }] = await Promise.all([
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
    supabase
      .from("business_photos")
      .select("id, url")
      .eq("business_id", business.id)
      .order("created_at", { ascending: true }),
  ]);

  const hasStaff = Boolean(staff && staff.length > 0);

  return (
    <main className="mx-auto min-h-screen max-w-2xl px-4 py-10 sm:px-6 sm:py-12">
      <div className="flex items-center gap-4">
        {business.logo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={business.logo_url}
            alt={business.name}
            className="h-16 w-16 shrink-0 rounded-xl border border-border object-cover shadow-sm shadow-black/30"
          />
        ) : null}
        <div>
          <h1 className="text-3xl font-bold">{business.name}</h1>
          {(business.address || business.phone) && (
            <p className="mt-1 text-sm text-muted">
              {[business.address, business.phone].filter(Boolean).join(" · ")}
            </p>
          )}
          {business.serves_at_home && (
            <span className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-accent/40 bg-accent/10 px-2.5 py-1 text-xs font-medium text-accent">
              Atiende a domicilio
            </span>
          )}
        </div>
      </div>

      {reservado === "1" && (
        <p className="mt-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400">
          ¡Listo! Tu turno quedó reservado. Cualquier cosa te contactan al
          teléfono que dejaste.
        </p>
      )}

      {business.description && (
        <p className="mt-4 text-sm">{business.description}</p>
      )}

      {photos && photos.length > 0 && (
        <div className="mt-6 grid grid-cols-3 gap-2 sm:grid-cols-4">
          {photos.map((photo) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={photo.id}
              src={photo.url}
              alt=""
              className="aspect-square w-full rounded-lg border border-border object-cover"
            />
          ))}
        </div>
      )}

      <div className="mt-10">
        <h2 className="text-lg font-semibold">Servicios</h2>

        {!hasStaff && (
          <p className="mt-2 text-sm text-muted">
            Este negocio todavía no tiene turnos disponibles para reservar
            online.
          </p>
        )}

        {services && services.length > 0 ? (
          <ul className="mt-4 flex flex-col gap-3">
            {services.map((service) => (
              <li
                key={service.id}
                className="flex items-center justify-between gap-4 rounded-lg border border-border bg-surface px-4 py-3 transition-colors hover:border-border-strong"
              >
                <div>
                  <p className="font-medium">{service.name}</p>
                  <p className="text-sm text-muted">
                    {service.duration_minutes} min ·{" "}
                    {formatPrice(service.price)}
                  </p>
                </div>
                {hasStaff && (
                  <Link
                    href={`/${business.slug}/reservar?service=${service.id}`}
                    className="shrink-0 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground shadow-sm shadow-black/30 transition-colors hover:bg-accent-hover"
                  >
                    Reservar
                  </Link>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-muted">
            Todavía no hay servicios cargados.
          </p>
        )}
      </div>
    </main>
  );
}
