import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getBusinessMetrics } from "@/lib/dashboard/metrics";
import {
  addDaysToDateStr,
  combineDateAndTimeToISO,
  todayInBusinessTZ,
} from "@/lib/booking/time";
import { BusinessPanel } from "./business-panel";
import { CreateBusinessForm } from "./create-business-form";

export const metadata: Metadata = { title: "Mi negocio" };

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

  const [setupSteps, agenda] = business
    ? await Promise.all([
        getMissingSetup(supabase, business.id),
        getAgendaSummary(supabase, business.id),
      ])
    : [[], { pendingCount: 0, todayCount: 0 }];

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
          agenda={agenda}
        />
      )}
    </main>
  );
}

/**
 * Para el aviso del panel: cuántos turnos esperan confirmación y cuántos
 * hay hoy (de todo el staff).
 */
async function getAgendaSummary(
  supabase: Awaited<ReturnType<typeof createClient>>,
  businessId: string
): Promise<{ pendingCount: number; todayCount: number }> {
  const nowISO = new Date().toISOString();
  const today = todayInBusinessTZ();
  const todayEnd = combineDateAndTimeToISO(addDaysToDateStr(today, 1), "00:00");

  const [{ count: pendingCount }, { count: todayCount }] = await Promise.all([
    supabase
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .eq("business_id", businessId)
      .eq("status", "pending")
      .gte("start_at", nowISO),
    supabase
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .eq("business_id", businessId)
      .in("status", ["pending", "confirmed"])
      .gte("start_at", nowISO)
      .lt("start_at", todayEnd),
  ]);

  return { pendingCount: pendingCount ?? 0, todayCount: todayCount ?? 0 };
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
