"use client";

import { useActionState } from "react";
import { updateBusiness, type BusinessFormState } from "@/lib/actions/business";
import { LogoField } from "@/components/logo-field";
import type { Business } from "@/types/database";
import { submitWithoutReset } from "@/lib/submit-without-reset";

const initialState: BusinessFormState = { error: null };

export function EditBusinessForm({
  business,
  onCancel,
}: {
  business: Business;
  onCancel: () => void;
}) {
  const [state, formAction, pending] = useActionState(updateBusiness, initialState);

  return (
    <div>
      <h1 className="page-title">Editar negocio</h1>
      <p className="mt-1 text-sm text-muted">
        Tu página pública sigue en <code>/{business.slug}</code>, eso no
        cambia aunque edites el nombre.
      </p>

      <form onSubmit={submitWithoutReset(formAction)} className="card mt-6 flex flex-col gap-5 p-5 sm:p-6">
        <LogoField currentUrl={business.logo_url} />

        <div className="field">
          <label htmlFor="name" className="label">
            Nombre del negocio
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            defaultValue={business.name}
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
            defaultValue={business.address ?? ""}
            className="input"
          />
        </div>

        <label className="flex items-start gap-2.5 rounded-xl border border-border bg-surface px-3.5 py-3 text-sm">
          <input
            type="checkbox"
            name="serves_at_home"
            defaultChecked={business.serves_at_home}
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
            defaultValue={business.phone ?? ""}
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
            defaultValue={business.description ?? ""}
            className="input"
          />
        </div>

        {state.error && (
          <p className="form-error" role="alert">
            {state.error}
          </p>
        )}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={pending}
            className="btn btn-primary"
          >
            {pending ? "Guardando..." : "Guardar cambios"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="btn btn-secondary"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
