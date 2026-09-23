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
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-6 px-4 sm:px-6">
      <div>
        <h1 className="text-2xl font-bold">Bienvenido/a</h1>
        <p className="mt-1 text-sm text-muted">
          Elegí una contraseña para entrar a tu cuenta de staff.
        </p>
      </div>

      <CompleteRegistrationForm />
    </main>
  );
}
