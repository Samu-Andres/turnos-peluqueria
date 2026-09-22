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

  return (
    <main className="mx-auto min-h-screen max-w-2xl px-4 py-10 sm:px-6 sm:py-12">
      <Link href={`/${slug}`} className="text-sm text-muted underline decoration-muted/40 underline-offset-2 transition-colors hover:text-accent">
        ← Volver a {business.name}
      </Link>

      <h1 className="mt-4 text-2xl font-bold">Reservar turno</h1>
      <p className="mt-1 text-sm text-muted">{business.name}</p>

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
          isLoggedIn={Boolean(userData.user)}
        />
      ) : (
        <p className="mt-8 text-sm text-muted">
          Este negocio todavía no tiene turnos disponibles para reservar
          online.
        </p>
      )}
    </main>
  );
}
