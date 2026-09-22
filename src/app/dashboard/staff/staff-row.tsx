"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { deleteStaff, toggleStaffActive } from "@/lib/actions/staff";
import type { Staff } from "@/types/database";

export function StaffRow({ staff }: { staff: Staff }) {
  const [isPending, startTransition] = useTransition();
  const [confirmingDelete, setConfirmingDelete] = useState(false);

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
          href={`/dashboard/staff/${staff.id}/horarios`}
          className="text-sm font-medium text-neutral-600 underline"
        >
          Horarios
        </Link>

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
