"use client";

import { useActionState, useEffect, useRef } from "react";
import { createStaff, type StaffFormState } from "@/lib/actions/staff";

const initialState: StaffFormState = { error: null };

export function StaffForm() {
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
          className="rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-900"
        />
      </div>

      {state.error && (
        <p className="text-sm text-red-600" role="alert">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
      >
        {pending ? "Guardando..." : "Agregar persona"}
      </button>
    </form>
  );
}
