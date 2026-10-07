"use client";

import { useActionState } from "react";
import {
  completeStaffRegistration,
  type StaffOnboardingFormState,
} from "@/lib/actions/staff-onboarding";

const initialState: StaffOnboardingFormState = { error: null };

export function CompleteRegistrationForm() {
  const [state, formAction, pending] = useActionState(
    completeStaffRegistration,
    initialState
  );

  return (
    <form action={formAction} className="card flex flex-col gap-4 p-5 sm:p-6">
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
        {pending ? "Guardando..." : "Entrar"}
      </button>
    </form>
  );
}
