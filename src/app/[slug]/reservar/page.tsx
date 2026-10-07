import Link from "next/link";
import { notFound } from "next/navigation";
import { getBusinessBySlug } from "@/lib/booking/get-business";
import { createClient } from "@/lib/supabase/server";
import { BookingFlow } from "./booking-flow";

type Params = Promise<{ slug: string }>;
type SearchParams = Promise<{
  service?: string;
  staff?: string;
  date?: string;
  time?: string;
}>;

export default async function ReservarPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const { slug } = await params;
  const query = await searchParams;

  const business = await getBusinessBySlug(slug);
  if (!business) {
    notFound();
  }

  const supabase = await createClient();

  const [{ data: services }, { data: staff }, { data: userData }] =
    await Promise.all([
      supabase
        .from("services")
        .select("*")
        .eq("business_id", business.id)
        .eq("active", true)
        .order("name", { ascending: true }),
      supabase
        .from("staff")
        .select("*")
        .eq("business_id", business.id)
        .eq("active", true)
        .order("full_name", { ascending: true }),
      supabase.auth.getUser(),
    ]);

  // Si ya está logueado, le precargamos nombre y teléfono para no
  // pedírselos de nuevo (no hace falta cuenta para reservar, pero si la
  // tiene, mejor no repetir datos que ya dio o que cargó en "Mi perfil").
  let prefillName: string | null = null;
  let prefillPhone: string | null = null;
  if (userData.user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, phone")
      .eq("id", userData.user.id)
      .maybeSingle();
    prefillName = profile?.full_name ?? null;
    prefillPhone = profile?.phone ?? null;
  }

  return (
    <main className="page">
      <Link href={`/${slug}`} className="back-link">
        ← Volver a {business.name}
      </Link>

      <div className="mt-4 flex items-center gap-3">
        {business.logo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={business.logo_url}
            alt=""
            className="h-12 w-12 shrink-0 rounded-xl border border-border object-cover"
          />
        ) : (
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-lg font-bold text-accent">
            {business.name.charAt(0).toUpperCase()}
          </span>
        )}
        <div>
          <h1 className="page-title">Reservar turno</h1>
          <p className="text-sm text-muted">{business.name}</p>
        </div>
      </div>

      {services && services.length > 0 && staff && staff.length > 0 ? (
        <BookingFlow
          slug={slug}
          businessId={business.id}
          services={services}
          staff={staff}
          initialServiceId={query.service}
          initialStaffId={query.staff}
          initialDateStr={query.date}
          initialTime={query.time}
          prefillName={prefillName}
          prefillPhone={prefillPhone}
          servesAtHome={business.serves_at_home}
        />
      ) : (
        <p className="alert-warning mt-8">
          Este negocio todavía no tiene turnos disponibles para reservar
          online.
        </p>
      )}
    </main>
  );
}
