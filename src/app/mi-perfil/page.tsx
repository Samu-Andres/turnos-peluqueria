import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProfileForm } from "./profile-form";

export default async function MiPerfilPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=${encodeURIComponent("/mi-perfil")}`);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  const backHref = profile?.role === "owner" ? "/dashboard" : "/mis-turnos";

  return (
    <main className="mx-auto min-h-screen max-w-sm px-4 py-10 sm:px-6 sm:py-12">
      <Link
        href={backHref}
        className="text-sm text-muted underline decoration-muted/40 underline-offset-2 transition-colors hover:text-accent"
      >
        ← Volver
      </Link>

      <h1 className="mt-4 text-2xl font-bold">Mi perfil</h1>
      <p className="mt-1 text-sm text-muted">{user.email}</p>

      <ProfileForm profile={profile} />
    </main>
  );
}
