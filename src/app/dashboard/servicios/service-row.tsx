"use client";

import { useState, useTransition } from "react";
import { deleteService, toggleServiceActive } from "@/lib/actions/services";
import { formatPrice } from "@/lib/format";
import type { Service } from "@/types/database";

export function ServiceRow({ service }: { service: Service }) {
  const [isPending, startTransition] = useTransition();
  const [confirmingDelete, setConfirmingDelete] = useState(false);

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
