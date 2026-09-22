"use client";

import { useState, useTransition } from "react";
import { cancelBooking } from "@/lib/actions/my-bookings";

export function CancelBookingButton({ bookingId }: { bookingId: string }) {
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
              await cancelBooking(bookingId);
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
