"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { deleteStaff, toggleStaffActive, updateStaff } from "@/lib/actions/staff";
import type { Staff } from "@/types/database";

export function StaffRow({ staff }: { staff: Staff }) {
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
      <li className="rounded-md border border-neutral-200 px-4 py-3">
        <form action={handleSave} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Nombre</label>
            <input
              name="full_name"
              type="text"
              required
              defaultValue={staff.full_name}
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
      <div className={staff.active ? "" : "opacity-50"}>
        <p className="font-medium">{staff.full_name}</p>
        {!staff.active && (
          <p className="text-sm text-neutral-500">inactivo</p>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-3">
        <Link
          href={`/dashboard/staff/${staff.id}/turnos`}
          className="text-sm font-medium text-neutral-600 underline"
        >
          Turnos
        </Link>

        <Link
          href={`/dashboard/staff/${staff.id}/horarios`}
          className="text-sm font-medium text-neutral-600 underline"
        >
          Horarios
        </Link>

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
              await toggleStaffActive(staff.id, !staff.active);
            })
          }
          className="text-sm font-medium text-neutral-600 underline disabled:opacity-60"
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
