"use client";

import { Suspense, useActionState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { signIn, type AuthFormState } from "@/lib/actions/auth";

const initialState: AuthFormState = { error: null };

function LoginForm() {
  const [state, formAction, pending] = useActionState(signIn, initialState);
  const searchParams = useSearchParams();
  const next = searchParams.get("next");

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-6 px-4 sm:px-6">
      <div>
        <h1 className="text-2xl font-bold">Iniciar sesión</h1>
        <p className="mt-1 text-sm text-muted">
          Entrá para reservar un turno o administrar tu negocio.
        </p>
      </div>

      <form action={formAction} className="flex flex-col gap-4">
        {next && <input type="hidden" name="next" value={next} />}

        <div className="flex flex-col gap-1">
          <label htmlFor="email" className="text-sm font-medium">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted/50 focus:border-accent focus:ring-1 focus:ring-accent/30"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="password" className="text-sm font-medium">
            Contraseña
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted/50 focus:border-accent focus:ring-1 focus:ring-accent/30"
          />
        </div>

        {state.error && (
          <p className="text-sm text-red-400" role="alert">
            {state.error}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground shadow-sm shadow-black/30 transition-colors hover:bg-accent-hover disabled:opacity-50"
        >
          {pending ? "Entrando..." : "Entrar"}
        </button>
      </form>

      <p className="text-center text-sm text-muted">
        ¿No tenés cuenta?{" "}
        <Link
          href={next ? `/signup?next=${encodeURIComponent(next)}` : "/signup"}
          className="font-medium text-accent underline decoration-accent/40 underline-offset-2 hover:text-accent-hover"
        >
          Registrate
        </Link>
      </p>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
