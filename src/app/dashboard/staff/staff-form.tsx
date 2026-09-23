"use client";

import { useActionState, useEffect, useRef } from "react";
import { createStaff, type StaffFormState } from "@/lib/actions/staff";

const initialState: StaffFormState = { error: null };

export function StaffForm({
  requiresAccount = false,
}: {
  requiresAccount?: boolean;
}) {
  const [state, formAction, pending] = useActionState(
    createStaff,
    initialState
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state !== initialState && !state.error) {
      formRef.current?.reset();
    }
  }, [state]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="mt-4 flex flex-col gap-4"
    >
      <div className="flex flex-col gap-1">
        <label htmlFor="full_name" className="text-sm font-medium">
          Nombre
        </label>
        <input
          id="full_name"
          name="full_name"
          type="text"
          required
          placeholder="Andrea Gómez"
          className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted/50 focus:border-accent focus:ring-1 focus:ring-accent/30"
        />
      </div>

      {requiresAccount && (
        <div className="flex flex-col gap-1">
          <label htmlFor="email" className="text-sm font-medium">
            Mail
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            placeholder="andrea@mail.com"
            className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted/50 focus:border-accent focus:ring-1 focus:ring-accent/30"
          />
          <span className="text-xs text-muted">
            Le mandamos una invitación para que se cree su propia cuenta y
            pueda ver y manejar sus turnos.
          </span>
        </div>
      )}

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
        {pending ? "Guardando..." : "Agregar persona"}
      </button>
    </form>
  );
}
