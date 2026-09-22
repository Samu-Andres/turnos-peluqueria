import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/lib/actions/auth";
import { CreateBusinessForm } from "./create-business-form";

export default async function DashboardPage() {
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
    .select("id, name, slug, address, phone")
    .eq("owner_id", user.id)
    .maybeSingle();

  return (
    <main className="mx-auto min-h-screen max-w-2xl px-6 py-12">
      <div className="mb-8 flex items-center justify-between">
        <p className="text-sm text-neutral-500">
          Hola, {profile.full_name}
        </p>
        <form action={signOut}>
          <button
            type="submit"
            className="text-sm font-medium text-neutral-500 underline"
          >
            Cerrar sesión
          </button>
        </form>
      </div>

      {!business ? (
        <CreateBusinessForm />
      ) : (
        <div>
          <h1 className="text-2xl font-bold">{business.name}</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Tu página pública: <code>/{business.slug}</code>
          </p>
          {business.address && (
            <p className="mt-4 text-sm">{business.address}</p>
          )}
          {business.phone && <p className="text-sm">{business.phone}</p>}

          <div className="mt-8 rounded-md border border-dashed border-neutral-300 p-4 text-sm text-neutral-500">
            Próximo paso: cargar servicios, staff y horarios de
            disponibilidad para que empiece a recibir reservas.
          </div>
        </div>
      )}
    </main>
  );
}
