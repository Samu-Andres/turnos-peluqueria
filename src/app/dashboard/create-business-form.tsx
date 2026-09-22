"use client";

import { useActionState } from "react";
import { createBusiness, type BusinessFormState } from "@/lib/actions/business";
import { LogoField } from "@/components/logo-field";

const initialState: BusinessFormState = { error: null };

export function CreateBusinessForm({
  defaultServesAtHome = false,
}: {
  defaultServesAtHome?: boolean;
}) {
  const [state, formAction, pending] = useActionState(createBusiness, initialState);

  return (
    <div className="mx-auto max-w-sm">
      <h1 className="text-2xl font-bold">Creá tu negocio</h1>
      <p className="mt-1 text-sm text-muted">
        Esto arma la página pública donde tus clientes van a poder reservar
        turnos.
      </p>

      <form action={formAction} className="mt-6 flex flex-col gap-4">
        <LogoField />

        <div className="flex flex-col gap-1">
          <label htmlFor="name" className="text-sm font-medium">
            Nombre del negocio
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            placeholder="Peluquería Andrea"
            className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted/50 focus:border-accent focus:ring-1 focus:ring-accent/30"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="address" className="text-sm font-medium">
            Dirección (opcional)
          </label>
          <input
            id="address"
            name="address"
            type="text"
            className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted/50 focus:border-accent focus:ring-1 focus:ring-accent/30"
          />
        </div>

        <label className="flex items-start gap-2 rounded-lg border border-border bg-surface px-3 py-2.5 text-sm">
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

        <div className="flex flex-col gap-1">
          <label htmlFor="phone" className="text-sm font-medium">
            Teléfono (opcional)
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted/50 focus:border-accent focus:ring-1 focus:ring-accent/30"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="description" className="text-sm font-medium">
            Descripción (opcional)
          </label>
          <textarea
            id="description"
            name="description"
            rows={2}
            placeholder="Contales a tus clientes de qué se trata tu negocio"
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
          {pending ? "Creando..." : "Crear negocio"}
        </button>
      </form>
    </div>
  );
}
