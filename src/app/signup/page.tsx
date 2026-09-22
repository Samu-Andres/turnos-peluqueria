"use client";

import { Suspense, useActionState, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { signUp, type AuthFormState } from "@/lib/actions/auth";

const initialState: AuthFormState = { error: null };

function SignupForm() {
  const [state, formAction, pending] = useActionState(signUp, initialState);
  const [role, setRole] = useState<"client" | "owner">("client");
  const searchParams = useSearchParams();
  const next = searchParams.get("next");

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-6 px-4 sm:px-6">
      <div>
        <h1 className="text-2xl font-bold">Crear cuenta</h1>
        <p className="mt-1 text-sm text-muted">
          Elegí si vas a reservar turnos o si administrás una peluquería.
        </p>
      </div>

      <form action={formAction} className="flex flex-col gap-4">
        {next && <input type="hidden" name="next" value={next} />}

        <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Tipo de cuenta">
          <label
            className={`cursor-pointer rounded-lg border px-3 py-2 text-center text-sm font-medium ${
              role === "client"
                ? "border-accent bg-accent text-accent-foreground"
                : "border-border text-muted"
            }`}
          >
            <input
              type="radio"
              name="role"
              value="client"
              checked={role === "client"}
              onChange={() => setRole("client")}
              className="sr-only"
            />
            Cliente
          </label>

          <label
            className={`cursor-pointer rounded-lg border px-3 py-2 text-center text-sm font-medium ${
              role === "owner"
                ? "border-accent bg-accent text-accent-foreground"
                : "border-border text-muted"
            }`}
          >
            <input
              type="radio"
              name="role"
              value="owner"
              checked={role === "owner"}
              onChange={() => setRole("owner")}
              className="sr-only"
            />
            Dueño/a
          </label>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="full_name" className="text-sm font-medium">
            Nombre completo
          </label>
          <input
            id="full_name"
            name="full_name"
            type="text"
            required
            autoComplete="name"
            className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted/50 focus:border-accent focus:ring-1 focus:ring-accent/30"
          />
        </div>

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
            minLength={6}
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
          {pending ? "Creando cuenta..." : "Crear cuenta"}
        </button>
      </form>

      <p className="text-center text-sm text-muted">
        ¿Ya tenés cuenta?{" "}
        <Link
          href={next ? `/login?next=${encodeURIComponent(next)}` : "/login"}
          className="font-medium text-accent underline decoration-accent/40 underline-offset-2 hover:text-accent-hover"
        >
          Iniciá sesión
        </Link>
      </p>
    </main>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={null}>
      <SignupForm />
    </Suspense>
  );
}
