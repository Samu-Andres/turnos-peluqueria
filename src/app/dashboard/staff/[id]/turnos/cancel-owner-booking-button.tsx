"use client";

import { useState, useTransition } from "react";
import { ownerCancelBooking } from "@/lib/actions/staff-schedule";

export function CancelOwnerBookingButton({ bookingId }: { bookingId: string }) {
  const [isPending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);

  if (confirming) {
    return (
      <div className="flex items-center gap-3">
        <button
          type="button"
          disabled={isPending}
          onClick={() =>
            startTransition(async () => {
              await ownerCancelBooking(bookingId);
            })
          }
          className="text-sm font-medium text-red-600 underline disabled:opacity-60"
        >
          Confirmar cancelación
        </button>
        <button
          type="button"
          disabled={isPending}
          onClick={() => setConfirming(false)}
          className="text-sm text-neutral-400 underline"
        >
          Volver
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setConfirming(true)}
      className="text-sm text-neutral-500 underline"
    >
      Cancelar turno
    </button>
  );
}
