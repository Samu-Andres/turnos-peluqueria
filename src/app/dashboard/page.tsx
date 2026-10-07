import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getBusinessMetrics } from "@/lib/dashboard/metrics";
import { BusinessPanel } from "./business-panel";
import { CreateBusinessForm } from "./create-business-form";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ tipo?: string }>;
}) {
  const { tipo } = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "owner") {
    redirect("/");
  }

  const { data: business } = await supabase
    .from("businesses")
    .select("*")
    .eq("owner_id", user.id)
    .maybeSingle();

  const metrics = business
    ? await getBusinessMetrics(supabase, business.id)
    : null;

  const setupSteps = business ? await getMissingSetup(supabase, business.id) : [];

  return (
    <main className="page">
      <p className="mb-6 text-sm text-muted">Hola, {profile.full_name}</p>

      {!business || !metrics ? (
        <CreateBusinessForm defaultServesAtHome={tipo === "domicilio"} />
      ) : (
        <BusinessPanel
          business={business}
          metrics={metrics}
          setupSteps={setupSteps}
        />
      )}
    </main>
  );
}

/**
 * Lo que le falta al negocio para que un cliente pueda reservar: sin
 * servicios, sin staff activo o sin horarios cargados, la página pública
 * no ofrece turnos y el dueño no tiene cómo darse cuenta solo.
 */
async function getMissingSetup(
  supabase: Awaited<ReturnType<typeof createClient>>,
  businessId: string
): Promise<string[]> {
  const [{ count: servicesCount }, { data: staff }] = await Promise.all([
    supabase
      .from("services")
      .select("id", { count: "exact", head: true })
      .eq("business_id", businessId)
      .eq("active", true),
    supabase
      .from("staff")
      .select("id")
      .eq("business_id", businessId)
      .eq("active", true),
  ]);

  const missing: string[] = [];
  if (!servicesCount) {
    missing.push("Cargá al menos un servicio.");
  }
  if (!staff || staff.length === 0) {
    missing.push("Agregá al staff a quien atiende (si trabajás solo/a, agregate a vos).");
    return missing;
  }

  const { count: hoursCount } = await supabase
    .from("working_hours")
    .select("id", { count: "exact", head: true })
    .in(
      "staff_id",
      staff.map((person) => person.id)
    );
  if (!hoursCount) {
    missing.push("Cargá los horarios de trabajo de tu staff.");
  }
  return missing;
}
