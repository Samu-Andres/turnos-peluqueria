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
    <form action={formAction} className="flex flex-col gap-4">
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
        {pending ? "Guardando..." : "Entrar"}
      </button>
    </form>
  );
}
