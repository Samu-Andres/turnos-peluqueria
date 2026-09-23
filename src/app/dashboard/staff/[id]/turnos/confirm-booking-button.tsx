"use client";

import { useTransition } from "react";
import { confirmBooking } from "@/lib/actions/staff-schedule";

export function ConfirmBookingButton({ bookingId }: { bookingId: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          await confirmBooking(bookingId);
        })
      }
      className="text-sm font-medium text-emerald-400 underline disabled:opacity-60"
    >
      Confirmar turno
    </button>
  );
}
