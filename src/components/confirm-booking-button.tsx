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
      className="action !text-success hover:!bg-success-soft"
    >
      Confirmar turno
    </button>
  );
}
