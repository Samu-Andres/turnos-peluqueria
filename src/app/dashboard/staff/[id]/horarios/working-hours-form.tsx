"use client";

import { useActionState, useState } from "react";
import { DAY_LABELS } from "@/lib/dashboard/days";
import type { WorkingHoursFormState } from "@/lib/actions/working-hours";
import type { WorkingHours } from "@/types/database";

const initialState: WorkingHoursFormState = { error: null };

type BoundAction = (
  prevState: WorkingHoursFormState,
  formData: FormData
) => Promise<WorkingHoursFormState>;

type DayState = {
  enabled: boolean;
  start: string;
  end: string;
};

const DEFAULT_START = "09:00";
const DEFAULT_END = "18:00";
// Lunes a viernes (0 = domingo, 6 = sábado, igual que schema.sql).
const WEEKDAYS = [1, 2, 3, 4, 5];

function buildInitialDays(initialHours: WorkingHours[]): DayState[] {
  const byDay = new Map(initialHours.map((hours) => [hours.day_of_week, hours]));
  return DAY_LABELS.map((_, day) => {
    const existing = byDay.get(day);
    return {
      enabled: Boolean(existing),
      start: existing?.start_time.slice(0, 5) ?? DEFAULT_START,
      end: existing?.end_time.slice(0, 5) ?? DEFAULT_END,
    };
  });
}

export function WorkingHoursForm({
  action,
  initialHours,
}: {
  action: BoundAction;
  initialHours: WorkingHours[];
}) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const [days, setDays] = useState<DayState[]>(() => buildInitialDays(initialHours));

  function updateDay(day: number, patch: Partial<DayState>) {
    setDays((prev) => prev.map((d, i) => (i === day ? { ...d, ...patch } : d)));
  }

  function copyMondayToWeekdays() {
    setDays((prev) => {
      const monday = prev[1];
      return prev.map((d, i) => (WEEKDAYS.includes(i) ? { ...monday } : d));
    });
  }

  return (
    <form action={formAction} className="mt-6 flex flex-col gap-3">
      {DAY_LABELS.map((label, day) => (
        <div
          key={day}
          className="flex flex-wrap items-center gap-3 rounded-md border border-neutral-200 px-4 py-3"
        >
          <label className="flex w-32 items-center gap-2 text-sm font-medium">
            <input
              type="checkbox"
              name={`day_${day}_enabled`}
              checked={days[day].enabled}
              onChange={(e) => updateDay(day, { enabled: e.target.checked })}
              className="h-4 w-4"
            />
            {label}
          </label>

          <input
            type="time"
            name={`day_${day}_start`}
            value={days[day].start}
            onChange={(e) => updateDay(day, { start: e.target.value })}
            className="rounded-md border border-neutral-300 px-2 py-1 text-sm"
          />
          <span className="text-sm text-neutral-400">a</span>
          <input
            type="time"
            name={`day_${day}_end`}
            value={days[day].end}
            onChange={(e) => updateDay(day, { end: e.target.value })}
            className="rounded-md border border-neutral-300 px-2 py-1 text-sm"
          />

          {day === 1 && (
            <button
              type="button"
              onClick={copyMondayToWeekdays}
              className="ml-auto text-sm font-medium text-neutral-600 underline"
            >
              Copiar a Martes–Viernes
            </button>
          )}
        </div>
      ))}

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
