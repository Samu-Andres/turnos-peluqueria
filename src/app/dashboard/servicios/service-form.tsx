"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Check, Plus } from "lucide-react";
import { createService, type ServiceFormState } from "@/lib/actions/services";
import { submitWithoutReset } from "@/lib/submit-without-reset";

const initialState: ServiceFormState = { error: null };

// Los servicios más comunes, para no tener que escribirlos. Si el que
// busca no está, "Otro servicio" deja escribir el nombre a mano.
const PRESETS = ["Corte de pelo", "Corte de pelo + barba", "Perfilado", "Barba sola"];
const CUSTOM = "__custom__";

export function ServiceForm({ existingNames = [] }: { existingNames?: string[] }) {
  const [state, formAction, pending] = useActionState(
    createService,
    initialState
  );
  const formRef = useRef<HTMLFormElement>(null);
  const [choice, setChoice] = useState<string | null>(null);

  const [handledState, setHandledState] = useState(state);

  const taken = new Set(existingNames.map((n) => n.trim().toLowerCase()));

  // Alta exitosa (estado nuevo y sin error): volvemos a la elección de
  // servicio. Se ajusta durante el render, como recomienda React, en vez
  // de en un efecto.
  if (state !== handledState) {
    setHandledState(state);
    if (!state.error) {
      setChoice(null);
    }
  }

  useEffect(() => {
    if (state !== initialState && !state.error) {
      formRef.current?.reset();
    }
  }, [state]);

  return (
    <form
      ref={formRef}
      onSubmit={submitWithoutReset(formAction)}
      className="mt-4 flex flex-col gap-5"
    >
      <fieldset className="flex flex-col gap-2">
        <legend className="label mb-2">¿Qué servicio querés agregar?</legend>
        <div className="grid grid-cols-2 gap-2">
          {PRESETS.map((preset) => {
            const alreadyAdded = taken.has(preset.toLowerCase());
            const selected = choice === preset;
            return (
              <button
                key={preset}
                type="button"
                disabled={alreadyAdded}
                aria-pressed={selected}
                onClick={() => setChoice(preset)}
                className={`flex min-h-12 items-center justify-between gap-2 px-3.5 py-2 text-left disabled:cursor-not-allowed disabled:opacity-50 ${
                  selected ? "option-selected" : "option"
                }`}
              >
                <span>{preset}</span>
                {alreadyAdded && (
                  <span className="flex shrink-0 items-center gap-1 text-xs text-muted">
                    <Check aria-hidden className="h-3.5 w-3.5" />
                    Ya está
                  </span>
                )}
              </button>
            );
          })}
          <button
            type="button"
            aria-pressed={choice === CUSTOM}
            onClick={() => setChoice(CUSTOM)}
            className={`col-span-2 flex min-h-12 items-center justify-center gap-2 border-dashed px-3.5 py-2 ${
              choice === CUSTOM ? "option-selected" : "option"
            }`}
          >
            <Plus aria-hidden className="h-4 w-4" />
            Otro servicio
          </button>
        </div>
      </fieldset>

      {choice === CUSTOM ? (
        <div className="field">
          <label htmlFor="name" className="label">
            Nombre del servicio
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            autoFocus
            placeholder="Ej: Color, Lavado, Corte infantil"
            className="input"
          />
        </div>
      ) : (
        choice && <input type="hidden" name="name" value={choice} />
      )}

      {choice && (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div className="field">
              <label htmlFor="duration_minutes" className="label">
                Duración
              </label>
              <div className="relative">
                <input
                  id="duration_minutes"
                  name="duration_minutes"
                  type="number"
                  inputMode="numeric"
                  min={1}
                  step={1}
                  required
                  placeholder="30"
                  className="input pr-12"
                />
                <span className="pointer-events-none absolute inset-y-0 right-3.5 flex items-center text-sm text-muted">
                  min
                </span>
              </div>
              <p className="hint">Lo que te lleva de verdad.</p>
            </div>

            <div className="field">
              <label htmlFor="price" className="label">
                Precio
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-sm text-muted">
                  $
                </span>
                <input
                  id="price"
                  name="price"
                  type="number"
                  inputMode="decimal"
                  min={0}
                  step="any"
                  required
                  placeholder="8000"
                  className="input pl-8"
                />
              </div>
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
              placeholder="Ej: incluye lavado y peinado"
              className="input"
            />
          </div>
        </>
      )}

      {state.error && (
        <p className="form-error" role="alert">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending || !choice}
        className="btn btn-primary"
      >
        {pending ? "Guardando..." : "Agregar servicio"}
      </button>
    </form>
  );
}
