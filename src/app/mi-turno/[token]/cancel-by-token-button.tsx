"use client";

import { useState, useTransition } from "react";
import { cancelBookingByToken } from "@/lib/actions/guest-booking";

export function CancelByTokenButton({ token }: { token: string }) {
  const [isPending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);

  if (confirming) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium">¿Seguro que querés cancelarlo?</span>
        <button
          type="button"
          disabled={isPending}
          onClick={() =>
            startTransition(async () => {
              await cancelBookingByToken(token);
            })
          }
          className="btn btn-danger btn-sm"
        >
          Sí, cancelar
        </button>
        <button
          type="button"
          disabled={isPending}
          onClick={() => setConfirming(false)}
          className="btn btn-secondary btn-sm"
        >
          No
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setConfirming(true)}
      className="btn btn-danger"
    >
      Cancelar turno
    </button>
  );
}
