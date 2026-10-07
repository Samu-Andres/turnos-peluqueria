import Link from "next/link";
import { Scissors } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/lib/actions/auth";

/**
 * Encabezado de todas las páginas: la marca (vuelve al inicio) y, a la
 * derecha, lo que corresponde según quién esté logueado. Reemplaza las
 * barras sueltas que cada pantalla armaba por su cuenta.
 */
export async function SiteHeader() {
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
      .maybeSingle();
    role = profile?.role ?? null;
  }

  const home =
    role === "owner"
      ? { href: "/dashboard", label: "Mi negocio" }
      : role === "staff"
        ? { href: "/staff", label: "Mi agenda" }
        : { href: "/mis-turnos", label: "Mis turnos" };

  return (
    <header className="sticky top-0 z-20 border-b border-border/80 bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between gap-3 px-4 sm:px-6">
        <Link href="/" className="flex min-h-11 items-center gap-2.5 font-bold tracking-tight">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent text-accent-foreground shadow-sm">
            <Scissors aria-hidden className="h-4.5 w-4.5" strokeWidth={2.2} />
          </span>
          <span className="hidden sm:inline">Turnos Peluquería</span>
          <span className="sm:hidden">Turnos</span>
        </Link>

        <nav className="flex items-center gap-1 sm:gap-2">
          {user ? (
            <>
              <Link href={home.href} className="action">
                {home.label}
              </Link>
              {role !== "staff" && (
                <Link href="/mi-perfil" className="action hidden sm:inline-flex">
                  Mi perfil
                </Link>
              )}
              <form action={signOut}>
                <button type="submit" className="action">
                  Salir
                </button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className="action">
                Iniciar sesión
              </Link>
              <Link href="/signup" className="btn btn-primary btn-sm">
                Crear cuenta
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
