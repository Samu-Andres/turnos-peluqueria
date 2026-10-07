"use client";

import { useState, useTransition } from "react";
import {
  deleteService,
  toggleServiceActive,
  updateService,
} from "@/lib/actions/services";
import { formatPrice } from "@/lib/format";
import type { Service } from "@/types/database";
import { submitWithoutReset } from "@/lib/submit-without-reset";

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
      <li className="card px-4 py-4">
        <form onSubmit={submitWithoutReset(handleSave)} className="flex flex-col gap-3">
          <div className="field">
            <label className="label">Nombre</label>
            <input
              name="name"
              type="text"
              required
              defaultValue={service.name}
              className="input"
            />
          </div>

          <div className="flex gap-4">
            <div className="flex flex-1 flex-col gap-1">
              <label className="label">Duración (min)</label>
              <input
                name="duration_minutes"
                type="number"
                min={1}
                step={1}
                inputMode="numeric"
                required
                defaultValue={service.duration_minutes}
                className="input"
              />
            </div>
            <div className="flex flex-1 flex-col gap-1">
              <label className="label">Precio</label>
              <input
                name="price"
                type="number"
                min={0}
                step="any"
                inputMode="decimal"
                required
                defaultValue={service.price}
                className="input"
              />
            </div>
          </div>

          <div className="field">
            <label className="label">Descripción (opcional)</label>
            <textarea
              name="description"
              rows={2}
              defaultValue={service.description ?? ""}
              className="input"
            />
          </div>

          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={isSaving}
              className="btn btn-primary"
            >
              {isSaving ? "Guardando..." : "Guardar"}
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="action"
            >
              Cancelar
            </button>
          </div>
        </form>
      </li>
    );
  }

  return (
    <li className="card flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div className={service.active ? "" : "opacity-50"}>
        <p className="font-medium">{service.name}</p>
        <p className="text-sm text-muted">
          {service.duration_minutes} min · {formatPrice(service.price)}
          {!service.active && " · inactivo"}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3 sm:shrink-0">
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="action"
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
          className="action"
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
              className="action-danger"
            >
              Confirmar
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={() => setConfirmingDelete(false)}
              className="action"
            >
              Cancelar
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmingDelete(true)}
            className="action"
          >
            Borrar
          </button>
        )}
      </div>
    </li>
  );
}
