import Link from "next/link";
import { ArrowRight, CalendarCheck, Clock, MapPin, Scissors, Store } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

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

  // Sin esta lista, un cliente que entra a la portada no tiene cómo
  // llegar a ninguna peluquería (solo con el link directo del negocio).
  const { data: businesses } = await supabase
    .from("businesses")
    .select("id, name, slug, address, logo_url, serves_at_home")
    .order("name", { ascending: true });

  const showDirectory = role !== "owner" && role !== "staff";

  return (
    <main className="flex-1">
      <section className="border-b border-border bg-surface">
        <div className="mx-auto grid w-full max-w-5xl gap-10 px-4 py-14 sm:px-6 sm:py-20 md:grid-cols-[1.2fr_1fr] md:items-center">
          <div>
            <p className="eyebrow">Reservas online</p>
            <h1 className="mt-3 text-4xl font-extrabold tracking-tight sm:text-5xl">
              Tu próximo corte,
              <br />
              <span className="text-accent">a dos clics.</span>
            </h1>
            <p className="mt-4 max-w-md text-base text-muted">
              Elegí la peluquería, el servicio y el horario que te quede
              cómodo. Sin llamar, sin esperar respuesta y sin necesidad de
              crear una cuenta.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              {showDirectory && (
                <a href="#peluquerias" className="btn btn-primary">
                  Ver peluquerías
                  <ArrowRight aria-hidden className="h-4 w-4" />
                </a>
              )}
              {role === "owner" && (
                <Link href="/dashboard" className="btn btn-primary">
                  Ir a mi negocio
                  <ArrowRight aria-hidden className="h-4 w-4" />
                </Link>
              )}
              {role === "staff" && (
                <Link href="/staff" className="btn btn-primary">
                  Ir a mi agenda
                  <ArrowRight aria-hidden className="h-4 w-4" />
                </Link>
              )}
              {!user && (
                <Link href="/signup" className="btn btn-secondary">
                  <Store aria-hidden className="h-4 w-4" />
                  Tengo una peluquería
                </Link>
              )}
            </div>
          </div>

          <ul className="grid gap-3 text-sm">
            {[
              { icon: Scissors, title: "Elegí el servicio", text: "Con precio y duración a la vista." },
              { icon: Clock, title: "Mirá horarios libres", text: "Solo los que de verdad están disponibles." },
              { icon: CalendarCheck, title: "Reservá al toque", text: "Y gestioná tu turno desde un link." },
            ].map(({ icon: Icon, title, text }) => (
              <li key={title} className="card flex items-start gap-4 p-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent">
                  <Icon aria-hidden className="h-5 w-5" />
                </span>
                <div>
                  <p className="font-semibold">{title}</p>
                  <p className="text-muted">{text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {showDirectory && (
        <section id="peluquerias" className="mx-auto w-full max-w-5xl scroll-mt-20 px-4 py-12 sm:px-6">
          <h2 className="text-2xl font-bold">Peluquerías</h2>
          <p className="page-subtitle">Elegí dónde querés atenderte.</p>

          {businesses && businesses.length > 0 ? (
            <ul className="mt-6 grid gap-3 sm:grid-cols-2">
              {businesses.map((business) => (
                <li key={business.id}>
                  <Link
                    href={`/${business.slug}`}
                    className="card-interactive group flex items-center gap-4 p-4"
                  >
                    {business.logo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={business.logo_url}
                        alt=""
                        className="h-14 w-14 shrink-0 rounded-xl border border-border object-cover"
                      />
                    ) : (
                      <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-lg font-bold text-accent">
                        {business.name.charAt(0).toUpperCase()}
                      </span>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold">{business.name}</p>
                      <p className="mt-0.5 flex items-center gap-1.5 truncate text-sm text-muted">
                        <MapPin aria-hidden className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">
                          {business.serves_at_home
                            ? "Atiende a domicilio"
                            : business.address ?? "Sin dirección cargada"}
                        </span>
                      </p>
                    </div>
                    <ArrowRight
                      aria-hidden
                      className="h-5 w-5 shrink-0 text-muted transition-colors group-hover:text-accent"
                    />
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="card mt-6 p-8 text-center">
              <p className="font-semibold">Todavía no hay peluquerías</p>
              <p className="mt-1 text-sm text-muted">
                Si tenés una, creá tu cuenta y cargala en minutos.
              </p>
              <Link href="/signup" className="btn btn-primary mt-5">
                Sumar mi peluquería
              </Link>
            </div>
          )}
        </section>
      )}
    </main>
  );
}
