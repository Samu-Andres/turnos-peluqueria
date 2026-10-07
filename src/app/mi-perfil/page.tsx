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
    <main className="mx-auto w-full max-w-sm px-4 py-8 sm:px-6 sm:py-12">
      <Link
        href={backHref}
        className="back-link"
      >
        ← Volver
      </Link>

      <h1 className="page-title mt-4">Mi perfil</h1>
      <p className="mt-1 text-sm text-muted">{user.email}</p>

      <ProfileForm profile={profile} />
    </main>
  );
}
