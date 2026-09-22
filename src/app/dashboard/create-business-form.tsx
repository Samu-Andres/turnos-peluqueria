"use client";

import { useActionState } from "react";
import { createBusiness, type BusinessFormState } from "@/lib/actions/business";

const initialState: BusinessFormState = { error: null };

export function CreateBusinessForm() {
  const [state, formAction, pending] = useActionState(createBusiness, initialState);

  return (
    <div className="mx-auto max-w-sm">
      <h1 className="text-2xl font-bold">Creá tu negocio</h1>
      <p className="mt-1 text-sm text-neutral-500">
        Esto arma la página pública donde tus clientes van a poder reservar
        turnos.
      </p>

      <form action={formAction} className="mt-6 flex flex-col gap-4">
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
            className="rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-900"
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
            className="rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-900"
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
          {pending ? "Creando..." : "Crear negocio"}
        </button>
      </form>
    </div>
  );
}
