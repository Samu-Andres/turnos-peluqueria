"use client";

import { Suspense, useActionState, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { signUp, type AuthFormState } from "@/lib/actions/auth";

const initialState: AuthFormState = { error: null };

function SignupForm() {
  const [state, formAction, pending] = useActionState(signUp, initialState);
  const [role, setRole] = useState<"client" | "owner">("client");
  const [businessType, setBusinessType] = useState<"local" | "domicilio">("local");
  const searchParams = useSearchParams();
  const next = searchParams.get("next");

  return (
    <main className="page-narrow">
      <div>
        <h1 className="page-title">Crear cuenta</h1>
        <p className="mt-1 text-sm text-muted">
          Elegí si vas a reservar turnos o si administrás una peluquería.
        </p>
      </div>

      <form action={formAction} className="card flex flex-col gap-4 p-5 sm:p-6">
        {next && <input type="hidden" name="next" value={next} />}

        <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Tipo de cuenta">
          <label
            className={`flex min-h-11 cursor-pointer items-center justify-center rounded-xl border px-3 py-2 text-center text-sm font-semibold transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent ${
              role === "client"
                ? "border-accent bg-accent-soft text-foreground ring-1 ring-accent"
                : "border-border bg-surface text-muted hover:border-border-strong"
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
            className={`flex min-h-11 cursor-pointer items-center justify-center rounded-xl border px-3 py-2 text-center text-sm font-semibold transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent ${
              role === "owner"
                ? "border-accent bg-accent-soft text-foreground ring-1 ring-accent"
                : "border-border bg-surface text-muted hover:border-border-strong"
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

        {role === "owner" && (
          <div className="flex flex-col gap-2 rounded-xl bg-surface-sunken p-3">
            <p className="text-sm font-medium">¿Tenés local o vas a domicilio?</p>
            <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Tipo de negocio">
              <label
                className={`flex min-h-11 cursor-pointer items-center justify-center rounded-xl border px-3 py-2 text-center text-sm font-semibold transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent ${
                  businessType === "local"
                    ? "border-accent bg-accent-soft text-foreground ring-1 ring-accent"
                    : "border-border bg-surface text-muted hover:border-border-strong"
                }`}
              >
                <input
                  type="radio"
                  name="business_type"
                  value="local"
                  checked={businessType === "local"}
                  onChange={() => setBusinessType("local")}
                  className="sr-only"
                />
                Tengo local
              </label>
              <label
                className={`flex min-h-11 cursor-pointer items-center justify-center rounded-xl border px-3 py-2 text-center text-sm font-semibold transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent ${
                  businessType === "domicilio"
                    ? "border-accent bg-accent-soft text-foreground ring-1 ring-accent"
                    : "border-border bg-surface text-muted hover:border-border-strong"
                }`}
              >
                <input
                  type="radio"
                  name="business_type"
                  value="domicilio"
                  checked={businessType === "domicilio"}
                  onChange={() => setBusinessType("domicilio")}
                  className="sr-only"
                />
                Voy a domicilio
              </label>
            </div>
            <p className="text-xs text-muted">
              Después lo podés cambiar cuando quieras desde tu panel.
            </p>
          </div>
        )}

        <div className="field">
          <label htmlFor="full_name" className="label">
            Nombre completo
          </label>
          <input
            id="full_name"
            name="full_name"
            type="text"
            required
            autoComplete="name"
            className="input"
          />
        </div>

        <div className="field">
          <label htmlFor="email" className="label">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className="input"
          />
        </div>

        <div className="field">
          <label htmlFor="password" className="label">
            Contraseña
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={6}
            autoComplete="new-password"
            className="input"
          />
        </div>

        {state.error && (
          <p className="form-error" role="alert">
            {state.error}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="btn btn-primary"
        >
          {pending ? "Creando cuenta..." : "Crear cuenta"}
        </button>
      </form>

      <p className="text-center text-sm text-muted">
        ¿Ya tenés cuenta?{" "}
        <Link
          href={next ? `/login?next=${encodeURIComponent(next)}` : "/login"}
          className="link"
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
