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
          className="action-danger"
        >
          Confirmar cancelación
        </button>
        <button
          type="button"
          disabled={isPending}
          onClick={() => setConfirming(false)}
          className="action"
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
      className="action-danger"
    >
      Cancelar turno
    </button>
  );
}
