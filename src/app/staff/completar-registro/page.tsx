import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CompleteRegistrationForm } from "./complete-registration-form";

export default async function CompletarRegistroPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <main className="page-narrow">
      <div>
        <h1 className="page-title">Bienvenido/a</h1>
        <p className="mt-1 text-sm text-muted">
          Elegí una contraseña para entrar a tu cuenta de staff.
        </p>
      </div>

      <CompleteRegistrationForm />
    </main>
  );
}
