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
    <main className="page-narrow">
      <div>
        <h1 className="page-title">Recuperar contraseña</h1>
        <p className="mt-1 text-sm text-muted">
          Ingresá tu email y te mandamos un link para elegir una nueva.
        </p>
      </div>

      <form action={formAction} className="card flex flex-col gap-4 p-5 sm:p-6">
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
          {pending ? "Enviando..." : "Mandar link"}
        </button>
      </form>

      <p className="text-center text-sm text-muted">
        <Link
          href="/login"
          className="link"
        >
          Volver a iniciar sesión
        </Link>
      </p>
    </main>
  );
}
