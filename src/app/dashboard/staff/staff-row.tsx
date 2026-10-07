"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { deleteStaff, toggleStaffActive, updateStaff } from "@/lib/actions/staff";
import type { Staff } from "@/types/database";
import { submitWithoutReset } from "@/lib/submit-without-reset";

export function StaffRow({
  staff,
  hasHours,
}: {
  staff: Staff;
  hasHours: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, startSaving] = useTransition();

  function handleSave(formData: FormData) {
    startSaving(async () => {
      const result = await updateStaff(staff.id, { error: null }, formData);
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
              name="full_name"
              type="text"
              required
              defaultValue={staff.full_name}
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
      <div className={staff.active ? "" : "opacity-50"}>
        <p className="font-medium">{staff.full_name}</p>
        {staff.email && (
          <p className="text-sm text-muted">{staff.email}</p>
        )}
        {!staff.active && (
          <p className="text-sm text-muted">inactivo</p>
        )}
        {staff.active && !hasHours && (
          <p className="text-sm text-warning">
            Sin horarios cargados: todavía no le pueden reservar.
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3 sm:shrink-0">
        <Link
          href={`/dashboard/staff/${staff.id}/turnos`}
          className="action"
        >
          Turnos
        </Link>

        <Link
          href={`/dashboard/staff/${staff.id}/horarios`}
          className="action"
        >
          Horarios
        </Link>

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
              await toggleStaffActive(staff.id, !staff.active);
            })
          }
          className="action"
        >
          {staff.active ? "Desactivar" : "Activar"}
        </button>

        {confirmingDelete ? (
          <>
            <button
              type="button"
              disabled={isPending}
              onClick={() =>
                startTransition(async () => {
                  await deleteStaff(staff.id);
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
