import type { Metadata } from "next";
import Link from "next/link";
import { CircleCheck, Clock, Home, MapPin, Phone } from "lucide-react";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getBusinessBySlug } from "@/lib/booking/get-business";
import { formatPrice } from "@/lib/format";
import { ManageLinkBox } from "@/components/manage-link-box";

type Params = Promise<{ slug: string }>;
type SearchParams = Promise<{ reservado?: string; turno?: string }>;

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
  const { reservado, turno } = await searchParams;
  const business = await getBusinessBySlug(slug);

  if (!business) {
    notFound();
  }

  const supabase = await createClient();

  const [
    { data: services },
    { data: staff },
    { data: photos },
    {
      data: { user },
    },
  ] = await Promise.all([
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
    supabase.auth.getUser(),
  ]);

  const hasStaff = Boolean(staff && staff.length > 0);

  return (
    <main className="flex-1">
      <section className="border-b border-border bg-surface">
        <div className="mx-auto w-full max-w-2xl px-4 py-8 sm:px-6 sm:py-10">
          <div className="flex items-center gap-4">
            {business.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={business.logo_url}
                alt={`Logo de ${business.name}`}
                className="h-20 w-20 shrink-0 rounded-2xl border border-border object-cover shadow-card"
              />
            ) : (
              <span className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-accent-soft text-3xl font-bold text-accent">
                {business.name.charAt(0).toUpperCase()}
              </span>
            )}
            <div className="min-w-0">
              <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
                {business.name}
              </h1>
              {business.serves_at_home && (
                <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-accent-soft px-2.5 py-1 text-xs font-semibold text-accent">
                  <Home aria-hidden className="h-3.5 w-3.5" />
                  Atiende a domicilio
                </span>
              )}
            </div>
          </div>

          {(business.address || business.phone) && (
            <ul className="mt-5 flex flex-col gap-2 text-sm text-muted sm:flex-row sm:gap-6">
              {business.address && (
                <li className="flex items-center gap-2">
                  <MapPin aria-hidden className="h-4 w-4 shrink-0 text-accent" />
                  {business.address}
                </li>
              )}
              {business.phone && (
                <li className="flex items-center gap-2">
                  <Phone aria-hidden className="h-4 w-4 shrink-0 text-accent" />
                  <a href={`tel:${business.phone}`} className="hover:text-accent">
                    {business.phone}
                  </a>
                </li>
              )}
            </ul>
          )}

          {business.description && (
            <p className="mt-4 max-w-prose text-[15px] leading-relaxed">
              {business.description}
            </p>
          )}
        </div>
      </section>

      <div className="mx-auto w-full max-w-2xl px-4 py-8 sm:px-6">
        {reservado === "1" && (
          <div className="alert-success mb-6 flex items-start gap-3">
            <CircleCheck aria-hidden className="mt-0.5 h-5 w-5 shrink-0" />
            <p>
              <span className="font-semibold">¡Listo! Tu turno quedó pendiente de confirmación.</span>{" "}
              Te contactan al teléfono que dejaste para confirmarlo.
            </p>
          </div>
        )}

        {reservado === "1" && turno && <ManageLinkBox token={turno} />}

        {photos && photos.length > 0 && (
          <div className="mb-10 grid grid-cols-3 gap-2 sm:grid-cols-4">
            {photos.map((photo) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={photo.id}
                src={photo.url}
                alt={`Foto de ${business.name}`}
                loading="lazy"
                className="aspect-square w-full rounded-xl border border-border object-cover"
              />
            ))}
          </div>
        )}

        <h2 className="section-title">Servicios</h2>
        {hasStaff ? (
          <p className="page-subtitle">
            Elegí un servicio para ver los horarios libres.
            {!user && " No hace falta tener cuenta."}
          </p>
        ) : (
          <div className="alert-warning mt-3">
            Este negocio todavía no tiene turnos disponibles para reservar
            online.
          </div>
        )}

        {services && services.length > 0 ? (
          <ul className="mt-5 flex flex-col gap-3">
            {services.map((service) => (
              <li
                key={service.id}
                className="card flex items-center justify-between gap-4 px-4 py-4"
              >
                <div className="min-w-0">
                  <p className="font-semibold">{service.name}</p>
                  <p className="mt-0.5 flex items-center gap-3 text-sm text-muted">
                    <span className="inline-flex items-center gap-1">
                      <Clock aria-hidden className="h-3.5 w-3.5" />
                      {service.duration_minutes} min
                    </span>
                    <span className="font-semibold text-foreground">
                      {formatPrice(service.price)}
                    </span>
                  </p>
                </div>
                {hasStaff && (
                  <Link
                    href={`/${business.slug}/reservar?service=${service.id}`}
                    className="btn btn-primary shrink-0"
                  >
                    Reservar
                  </Link>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-muted">
            Todavía no hay servicios cargados.
          </p>
        )}

        {hasStaff && !user && (
          <p className="mt-8 text-center text-sm text-muted">
            ¿Ya tenés cuenta?{" "}
            <Link
              href={`/login?next=${encodeURIComponent(`/${business.slug}`)}`}
              className="link"
            >
              Iniciá sesión
            </Link>{" "}
            para ver tus turnos en un solo lugar.
          </p>
        )}
      </div>
    </main>
  );
}
