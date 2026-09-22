"use client";

import { useActionState } from "react";
import { updateBusiness, type BusinessFormState } from "@/lib/actions/business";
import { LogoField } from "@/components/logo-field";
import type { Business } from "@/types/database";

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
      <h1 className="text-2xl font-bold">Editar negocio</h1>
      <p className="mt-1 text-sm text-muted">
        Tu página pública sigue en <code>/{business.slug}</code>, eso no
        cambia aunque edites el nombre.
      </p>

      <form action={formAction} className="mt-6 flex flex-col gap-4">
        <LogoField currentUrl={business.logo_url} />

        <div className="flex flex-col gap-1">
          <label htmlFor="name" className="text-sm font-medium">
            Nombre del negocio
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            defaultValue={business.name}
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
            defaultValue={business.address ?? ""}
            className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted/50 focus:border-accent focus:ring-1 focus:ring-accent/30"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="phone" className="text-sm font-medium">
            Teléfono (opcional)
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            defaultValue={business.phone ?? ""}
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
            defaultValue={business.description ?? ""}
            className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted/50 focus:border-accent focus:ring-1 focus:ring-accent/30"
          />
        </div>

        {state.error && (
          <p className="text-sm text-red-400" role="alert">
            {state.error}
          </p>
        )}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={pending}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground shadow-sm shadow-black/30 transition-colors hover:bg-accent-hover disabled:opacity-50"
          >
            {pending ? "Guardando..." : "Guardar cambios"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="text-sm text-muted underline decoration-muted/40 underline-offset-2 transition-colors hover:text-accent"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
