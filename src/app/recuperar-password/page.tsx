"use client";

import { useActionState } from "react";
import Link from "next/link";
import { requestPasswordReset, type AuthFormState } from "@/lib/actions/auth";

const initialState: AuthFormState = { error: null };

export default function RecuperarPasswordPage() {
  const [state, formAction, pending] = useActionState(
    requestPasswordReset,
    initialState
  );

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-6 px-4 sm:px-6">
      <div>
        <h1 className="text-2xl font-bold">Recuperar contraseña</h1>
        <p className="mt-1 text-sm text-muted">
          Ingresá tu email y te mandamos un link para elegir una nueva.
        </p>
      </div>

      <form action={formAction} className="flex flex-col gap-4">
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
          {pending ? "Enviando..." : "Mandar link"}
        </button>
      </form>

      <p className="text-center text-sm text-muted">
        <Link
          href="/login"
          className="font-medium text-accent underline decoration-accent/40 underline-offset-2 hover:text-accent-hover"
        >
          Volver a iniciar sesión
        </Link>
      </p>
    </main>
  );
}
