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
      <div className="field">
        <label htmlFor="full_name" className="label">
          Nombre
        </label>
        <input
          id="full_name"
          name="full_name"
          type="text"
          required
          placeholder="Andrea Gómez"
          className="input"
        />
      </div>

      {requiresAccount && (
        <div className="field">
          <label htmlFor="email" className="label">
            Mail (opcional)
          </label>
          <input
            id="email"
            name="email"
            type="email"
            placeholder="andrea@mail.com"
            className="input"
          />
          <span className="text-xs text-muted">
            Si ponés su mail, le mandamos una invitación para que tenga su
            propia cuenta y maneje sus turnos. Si sos vos o no hace falta,
            dejalo vacío: igual va a poder recibir reservas.
          </span>
        </div>
      )}

      {state.notice && (
        <p className="text-sm text-warning" role="status">
          {state.notice}
        </p>
      )}

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
        {pending ? "Guardando..." : "Agregar persona"}
      </button>
    </form>
  );
}
