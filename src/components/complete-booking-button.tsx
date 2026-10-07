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
      className="action"
    >
      Marcar como completado
    </button>
  );
}
