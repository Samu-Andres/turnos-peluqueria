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
      <li className="rounded-lg border border-border bg-surface px-4 py-3 transition-colors hover:border-border-strong">
        <form action={handleSave} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Nombre</label>
            <input
              name="full_name"
              type="text"
              required
              defaultValue={staff.full_name}
              className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted/50 focus:border-accent focus:ring-1 focus:ring-accent/30"
            />
          </div>

          {error && (
            <p className="text-sm text-red-400" role="alert">
              {error}
            </p>
          )}

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={isSaving}
              className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground shadow-sm shadow-black/30 transition-colors hover:bg-accent-hover disabled:opacity-50"
            >
              {isSaving ? "Guardando..." : "Guardar"}
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="text-sm text-muted underline decoration-muted/40 underline-offset-2 transition-colors hover:text-accent"
            >
              Cancelar
            </button>
          </div>
        </form>
      </li>
    );
  }

  return (
    <li className="flex flex-col gap-3 rounded-lg border border-border bg-surface px-4 py-3 transition-colors hover:border-border-strong sm:flex-row sm:items-center sm:justify-between">
      <div className={staff.active ? "" : "opacity-50"}>
        <p className="font-medium">{staff.full_name}</p>
        {staff.email && (
          <p className="text-sm text-muted">{staff.email}</p>
        )}
        {!staff.active && (
          <p className="text-sm text-muted">inactivo</p>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3 sm:shrink-0">
        <Link
          href={`/dashboard/staff/${staff.id}/turnos`}
          className="text-sm font-medium text-muted underline"
        >
          Turnos
        </Link>

        <Link
          href={`/dashboard/staff/${staff.id}/horarios`}
          className="text-sm font-medium text-muted underline"
        >
          Horarios
        </Link>

        <button
          type="button"
          onClick={() => setEditing(true)}
          className="text-sm font-medium text-muted underline"
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
          className="text-sm font-medium text-muted underline disabled:opacity-60"
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
              className="text-sm font-medium text-red-400 underline disabled:opacity-60"
            >
              Confirmar
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={() => setConfirmingDelete(false)}
              className="text-sm text-muted underline"
            >
              Cancelar
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmingDelete(true)}
            className="text-sm text-muted underline"
          >
            Borrar
          </button>
        )}
      </div>
    </li>
  );
}
