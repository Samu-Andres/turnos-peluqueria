import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/lib/actions/auth";
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

  return (
    <main className="mx-auto min-h-screen max-w-2xl px-4 py-10 sm:px-6 sm:py-12">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <p className="text-sm text-muted">
            Hola, {profile.full_name}
          </p>
          <Link
            href="/mi-perfil"
            className="text-sm text-muted underline decoration-muted/40 underline-offset-2 transition-colors hover:text-accent"
          >
            Mi perfil
          </Link>
        </div>
        <form action={signOut}>
          <button
            type="submit"
            className="text-sm font-medium text-muted underline"
          >
            Cerrar sesión
          </button>
        </form>
      </div>

      {!business ? (
        <CreateBusinessForm defaultServesAtHome={tipo === "domicilio"} />
      ) : (
        <BusinessPanel business={business} />
      )}
    </main>
  );
}
