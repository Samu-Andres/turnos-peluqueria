import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/lib/actions/auth";

export default async function Home() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let role: "owner" | "client" | "staff" | null = null;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    role = profile?.role ?? null;
  }

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 text-center sm:px-6">
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/3 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/15 blur-[100px]"
      />

      <div className="relative mx-auto flex max-w-2xl flex-col items-center gap-6">
        <svg
          aria-hidden
          viewBox="0 0 24 24"
          className="h-9 w-9 text-accent"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <circle cx="6" cy="6" r="3" />
          <circle cx="6" cy="18" r="3" />
          <path
            d="M8.5 8.5 19 19M19 5 8.5 15.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-accent">
            Reservas online
          </p>
          <h1 className="mt-2 text-4xl font-bold sm:text-5xl">
            Turnos Peluquería
          </h1>
        </div>

        <p className="max-w-md text-muted">
          Reservá tu turno online en la peluquería que elijas, o si tenés un
          local, administrá tus servicios, tu staff y tus turnos en un solo
          lugar.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3">
          {!user && (
            <>
              <Link
                href="/signup"
                className="rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground shadow-sm shadow-black/30 transition-colors hover:bg-accent-hover"
              >
                Crear cuenta
              </Link>
              <Link
                href="/login"
                className="rounded-lg border border-border px-5 py-2.5 text-sm font-semibold text-foreground transition-colors hover:border-accent hover:text-accent"
              >
                Iniciar sesión
              </Link>
            </>
          )}

          {user && role === "owner" && (
            <Link
              href="/dashboard"
              className="rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground shadow-sm shadow-black/30 transition-colors hover:bg-accent-hover"
            >
              Ir al panel
            </Link>
          )}

          {user && role === "client" && (
            <Link
              href="/mis-turnos"
              className="rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground shadow-sm shadow-black/30 transition-colors hover:bg-accent-hover"
            >
              Mis turnos
            </Link>
          )}

          {user && role === "staff" && (
            <Link
              href="/staff"
              className="rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground shadow-sm shadow-black/30 transition-colors hover:bg-accent-hover"
            >
              Tus turnos
            </Link>
          )}

          {user && (
            <form action={signOut}>
              <button
                type="submit"
                className="rounded-lg border border-border px-5 py-2.5 text-sm font-semibold text-foreground transition-colors hover:border-accent hover:text-accent"
              >
                Cerrar sesión
              </button>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
