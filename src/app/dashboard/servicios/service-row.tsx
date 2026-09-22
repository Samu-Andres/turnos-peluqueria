"use client";

import { useState, useTransition } from "react";
import {
  deleteService,
  toggleServiceActive,
  updateService,
} from "@/lib/actions/services";
import { formatPrice } from "@/lib/format";
import type { Service } from "@/types/database";

export function ServiceRow({ service }: { service: Service }) {
  const [isPending, startTransition] = useTransition();
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, startSaving] = useTransition();

  function handleSave(formData: FormData) {
    startSaving(async () => {
      const result = await updateService(service.id, { error: null }, formData);
      if (result.error) {
        setError(result.error);
      } else {
        setError(null);
        setEditing(false);
      }
    });
  }

  if (editing) {
    return (
      <li className="rounded-md border border-neutral-200 px-4 py-3">
        <form action={handleSave} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Nombre</label>
            <input
              name="name"
              type="text"
              required
              defaultValue={service.name}
              className="rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-900"
            />
          </div>

          <div className="flex gap-4">
            <div className="flex flex-1 flex-col gap-1">
              <label className="text-sm font-medium">Duración (min)</label>
              <input
                name="duration_minutes"
                type="number"
                min={1}
                step={5}
                required
                defaultValue={service.duration_minutes}
                className="rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-900"
              />
            </div>
            <div className="flex flex-1 flex-col gap-1">
              <label className="text-sm font-medium">Precio</label>
              <input
                name="price"
                type="number"
                min={0}
                step={0.01}
                required
                defaultValue={service.price}
                className="rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-900"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Descripción (opcional)</label>
            <textarea
              name="description"
              rows={2}
              defaultValue={service.description ?? ""}
              className="rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-900"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600" role="alert">
              {error}
            </p>
          )}

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={isSaving}
              className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              {isSaving ? "Guardando..." : "Guardar"}
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="text-sm text-neutral-500 underline"
            >
              Cancelar
            </button>
          </div>
        </form>
      </li>
    );
  }

  return (
    <li className="flex items-center justify-between gap-4 rounded-md border border-neutral-200 px-4 py-3">
      <div className={service.active ? "" : "opacity-50"}>
        <p className="font-medium">{service.name}</p>
        <p className="text-sm text-neutral-500">
          {service.duration_minutes} min · {formatPrice(service.price)}
          {!service.active && " · inactivo"}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-3">
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="text-sm font-medium text-neutral-600 underline"
        >
          Editar
        </button>

        <button
          type="button"
          disabled={isPending}
          onClick={() =>
            startTransition(async () => {
              await toggleServiceActive(service.id, !service.active);
            })
          }
          className="text-sm font-medium text-neutral-600 underline disabled:opacity-60"
        >
          {service.active ? "Desactivar" : "Activar"}
        </button>

        {confirmingDelete ? (
          <>
            <button
              type="button"
              disabled={isPending}
              onClick={() =>
                startTransition(async () => {
                  await deleteService(service.id);
                })
              }
              className="text-sm font-medium text-red-600 underline disabled:opacity-60"
            >
              Confirmar
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={() => setConfirmingDelete(false)}
              className="text-sm text-neutral-400 underline"
            >
              Cancelar
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmingDelete(true)}
            className="text-sm text-neutral-400 underline"
          >
            Borrar
          </button>
        )}
      </div>
    </li>
  );
}
