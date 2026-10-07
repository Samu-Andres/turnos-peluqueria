"use client";

import { Suspense, useActionState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { signIn, type AuthFormState } from "@/lib/actions/auth";
import { submitWithoutReset } from "@/lib/submit-without-reset";

const initialState: AuthFormState = { error: null };

function LoginForm() {
  const [state, formAction, pending] = useActionState(signIn, initialState);
  const searchParams = useSearchParams();
  const next = searchParams.get("next");
  const confirmed = searchParams.get("confirmado") === "1";
  const confirmError = searchParams.get("error") === "confirmacion";

  return (
    <main className="page-narrow">
      <div>
        <h1 className="page-title">Iniciar sesión</h1>
        <p className="mt-1 text-sm text-muted">
          Entrá para reservar un turno o administrar tu negocio.
        </p>
      </div>

      {confirmed && (
        <p className="alert-success">
          ¡Tu email quedó confirmado! Ya podés entrar.
        </p>
      )}

      {confirmError && (
        <p className="alert-danger">
          El link ya se usó o venció. Si ya confirmaste tu email, entrá
          normalmente; si no, registrate de nuevo.
        </p>
      )}

      <form onSubmit={submitWithoutReset(formAction)} className="card flex flex-col gap-4 p-5 sm:p-6">
        {next && <input type="hidden" name="next" value={next} />}

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
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="label">
              Contraseña
            </label>
            <Link
              href="/recuperar-password"
              className="text-xs font-medium text-muted transition-colors hover:text-accent"
            >
              ¿Olvidaste tu contraseña?
            </Link>
          </div>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
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
          {pending ? "Entrando..." : "Entrar"}
        </button>
      </form>

      <p className="text-center text-sm text-muted">
        ¿No tenés cuenta?{" "}
        <Link
          href={next ? `/signup?next=${encodeURIComponent(next)}` : "/signup"}
          className="link"
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
