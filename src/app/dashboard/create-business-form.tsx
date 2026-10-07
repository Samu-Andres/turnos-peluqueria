"use client";

import { useActionState } from "react";
import { createBusiness, type BusinessFormState } from "@/lib/actions/business";
import { LogoField } from "@/components/logo-field";
import { submitWithoutReset } from "@/lib/submit-without-reset";

const initialState: BusinessFormState = { error: null };

export function CreateBusinessForm({
  defaultServesAtHome = false,
}: {
  defaultServesAtHome?: boolean;
}) {
  const [state, formAction, pending] = useActionState(createBusiness, initialState);

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="page-title">Creá tu negocio</h1>
      <p className="mt-1 text-sm text-muted">
        Esto arma la página pública donde tus clientes van a poder reservar
        turnos.
      </p>

      <form onSubmit={submitWithoutReset(formAction)} className="card mt-6 flex flex-col gap-5 p-5 sm:p-6">
        <LogoField />

        <div className="field">
          <label htmlFor="name" className="label">
            Nombre del negocio
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            placeholder="Peluquería Andrea"
            className="input"
          />
        </div>

        <div className="field">
          <label htmlFor="address" className="label">
            Dirección (opcional)
          </label>
          <input
            id="address"
            name="address"
            type="text"
            className="input"
          />
        </div>

        <label className="flex items-start gap-2.5 rounded-xl border border-border bg-surface px-3.5 py-3 text-sm">
          <input
            type="checkbox"
            name="serves_at_home"
            defaultChecked={defaultServesAtHome}
            className="mt-0.5 h-4 w-4 accent-accent"
          />
          <span>
            <span className="font-medium">Atiendo a domicilio</span>
            <span className="block text-xs text-muted">
              Marcalo si trabajás solo/a y vas a la casa de tus clientes (sin
              local fijo). Les vamos a pedir su dirección al reservar.
            </span>
          </span>
        </label>

        <div className="field">
          <label htmlFor="phone" className="label">
            Teléfono (opcional)
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            className="input"
          />
        </div>

        <div className="field">
          <label htmlFor="description" className="label">
            Descripción (opcional)
          </label>
          <textarea
            id="description"
            name="description"
            rows={2}
            placeholder="Contales a tus clientes de qué se trata tu negocio"
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
          {pending ? "Creando..." : "Crear negocio"}
        </button>
      </form>
    </div>
  );
}
