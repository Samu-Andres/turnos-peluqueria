"use client";

import { useActionState } from "react";
import { updatePassword, type AuthFormState } from "@/lib/actions/auth";

const initialState: AuthFormState = { error: null };

export default function ResetPasswordPage() {
  const [state, formAction, pending] = useActionState(
    updatePassword,
    initialState
  );

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-6 px-4 sm:px-6">
      <div>
        <h1 className="text-2xl font-bold">Elegí tu nueva contraseña</h1>
      </div>

      <form action={formAction} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <label htmlFor="password" className="text-sm font-medium">
            Nueva contraseña
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="new-password"
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
          {pending ? "Guardando..." : "Guardar contraseña"}
        </button>
      </form>
    </main>
  );
}
