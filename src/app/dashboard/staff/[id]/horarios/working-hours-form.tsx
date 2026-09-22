"use client";

import { useActionState } from "react";
import { DAY_LABELS } from "@/lib/dashboard/days";
import type { WorkingHoursFormState } from "@/lib/actions/working-hours";
import type { WorkingHours } from "@/types/database";

const initialState: WorkingHoursFormState = { error: null };

type BoundAction = (
  prevState: WorkingHoursFormState,
  formData: FormData
) => Promise<WorkingHoursFormState>;

export function WorkingHoursForm({
  action,
  initialHours,
}: {
  action: BoundAction;
  initialHours: WorkingHours[];
}) {
  const [state, formAction, pending] = useActionState(action, initialState);

  const byDay = new Map(initialHours.map((hours) => [hours.day_of_week, hours]));

  return (
    <form action={formAction} className="mt-6 flex flex-col gap-3">
      {DAY_LABELS.map((label, day) => {
        const existing = byDay.get(day);
        return (
          <div
            key={day}
            className="flex flex-wrap items-center gap-3 rounded-md border border-neutral-200 px-4 py-3"
          >
            <label className="flex w-32 items-center gap-2 text-sm font-medium">
              <input
                type="checkbox"
                name={`day_${day}_enabled`}
                defaultChecked={Boolean(existing)}
                className="h-4 w-4"
              />
              {label}
            </label>
            <input
              type="time"
              name={`day_${day}_start`}
              defaultValue={existing?.start_time?.slice(0, 5)}
              className="rounded-md border border-neutral-300 px-2 py-1 text-sm"
            />
            <span className="text-sm text-neutral-400">a</span>
            <input
              type="time"
              name={`day_${day}_end`}
              defaultValue={existing?.end_time?.slice(0, 5)}
              className="rounded-md border border-neutral-300 px-2 py-1 text-sm"
            />
          </div>
        );
      })}

      {state.error && (
        <p className="text-sm text-red-600" role="alert">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="mt-2 self-start rounded-md bg-neutral-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
      >
        {pending ? "Guardando..." : "Guardar horarios"}
      </button>
    </form>
  );
}
