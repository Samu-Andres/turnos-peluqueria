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
    <main className="page-narrow">
      <div>
        <h1 className="page-title">Elegí tu nueva contraseña</h1>
      </div>

      <form action={formAction} className="card flex flex-col gap-4 p-5 sm:p-6">
        <div className="field">
          <label htmlFor="password" className="label">
            Nueva contraseña
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
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
          {pending ? "Guardando..." : "Guardar contraseña"}
        </button>
      </form>
    </main>
  );
}
