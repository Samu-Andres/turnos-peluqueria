"use client";

import { useTransition } from "react";
import { markBookingCompleted } from "@/lib/actions/staff-schedule";

export function CompleteBookingButton({ bookingId }: { bookingId: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          await markBookingCompleted(bookingId);
        })
      }
      className="text-sm font-medium text-neutral-600 underline disabled:opacity-60"
    >
      Marcar como completado
    </button>
  );
}
