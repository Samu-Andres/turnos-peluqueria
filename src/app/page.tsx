import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/lib/actions/auth";

export default async function Home() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let role: "owner" | "client" | null = null;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    role = profile?.role ?? null;
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center gap-6 px-6 text-center">
      <h1 className="text-3xl font-bold sm:text-4xl">Turnos Peluquería</h1>
      <p className="max-w-md text-neutral-500">
        Reservá tu turno online en la peluquería que elijas, o si tenés un
        local, administrá tus servicios, tu staff y tus turnos en un solo
        lugar.
      </p>

      <div className="flex flex-wrap items-center justify-center gap-3">
        {!user && (
          <>
            <Link
              href="/signup"
              className="rounded-md bg-neutral-900 px-5 py-2.5 text-sm font-semibold text-white"
            >
              Crear cuenta
            </Link>
            <Link
              href="/login"
              className="rounded-md border border-neutral-300 px-5 py-2.5 text-sm font-semibold text-neutral-900"
            >
              Iniciar sesión
            </Link>
          </>
        )}

        {user && role === "owner" && (
          <Link
            href="/dashboard"
            className="rounded-md bg-neutral-900 px-5 py-2.5 text-sm font-semibold text-white"
          >
            Ir al panel
          </Link>
        )}

        {user && role === "client" && (
          <Link
            href="/mis-turnos"
            className="rounded-md bg-neutral-900 px-5 py-2.5 text-sm font-semibold text-white"
          >
            Mis turnos
          </Link>
        )}

        {user && (
          <form action={signOut}>
            <button
              type="submit"
              className="rounded-md border border-neutral-300 px-5 py-2.5 text-sm font-semibold text-neutral-900"
            >
              Cerrar sesión
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
