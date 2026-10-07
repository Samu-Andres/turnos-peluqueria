"use client";

import { useActionState, useEffect, useRef } from "react";
import { createService, type ServiceFormState } from "@/lib/actions/services";

const initialState: ServiceFormState = { error: null };

export function ServiceForm() {
  const [state, formAction, pending] = useActionState(
    createService,
    initialState
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    // Si la última acción no fue el estado inicial y no hubo error,
    // fue un alta exitosa: limpiamos el formulario.
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
        <label htmlFor="name" className="label">
          Nombre del servicio
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          placeholder="Corte de pelo"
          className="input"
        />
      </div>

      <div className="flex gap-4">
        <div className="flex flex-1 flex-col gap-1">
          <label htmlFor="duration_minutes" className="label">
            Duración (min)
          </label>
          <input
            id="duration_minutes"
            name="duration_minutes"
            type="number"
            min={1}
            step={5}
            required
            placeholder="30"
            className="input"
          />
        </div>

        <div className="flex flex-1 flex-col gap-1">
          <label htmlFor="price" className="label">
            Precio
          </label>
          <input
            id="price"
            name="price"
            type="number"
            min={0}
            step={0.01}
            required
            placeholder="5000"
            className="input"
          />
        </div>
      </div>

      <div className="field">
        <label htmlFor="description" className="label">
          Descripción (opcional)
        </label>
        <textarea
          id="description"
          name="description"
          rows={2}
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
        {pending ? "Guardando..." : "Agregar servicio"}
      </button>
    </form>
  );
}
