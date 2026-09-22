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
      <div className="flex flex-col gap-1">
        <label htmlFor="name" className="text-sm font-medium">
          Nombre del servicio
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          placeholder="Corte de pelo"
          className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted/50 focus:border-accent focus:ring-1 focus:ring-accent/30"
        />
      </div>

      <div className="flex gap-4">
        <div className="flex flex-1 flex-col gap-1">
          <label htmlFor="duration_minutes" className="text-sm font-medium">
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
            className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted/50 focus:border-accent focus:ring-1 focus:ring-accent/30"
          />
        </div>

        <div className="flex flex-1 flex-col gap-1">
          <label htmlFor="price" className="text-sm font-medium">
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
            className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted/50 focus:border-accent focus:ring-1 focus:ring-accent/30"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="description" className="text-sm font-medium">
          Descripción (opcional)
        </label>
        <textarea
          id="description"
          name="description"
          rows={2}
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
        {pending ? "Guardando..." : "Agregar servicio"}
      </button>
    </form>
  );
}
