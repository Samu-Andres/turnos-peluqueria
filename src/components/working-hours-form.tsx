"use client";

import { useActionState, useState } from "react";
import { Copy } from "lucide-react";
import { DAY_LABELS } from "@/lib/dashboard/days";
import type { WorkingHoursFormState } from "@/lib/actions/working-hours";
import type { WorkingHours } from "@/types/database";
import { submitWithoutReset } from "@/lib/submit-without-reset";

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
// Se muestran de lunes a domingo, como se piensa una semana de trabajo.
const DISPLAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

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

  const saved = state !== initialState && !state.error && !pending;

  return (
    <form onSubmit={submitWithoutReset(formAction)} className="mt-6 flex flex-col gap-4">
      <ul className="card divide-y divide-border">
        {DISPLAY_ORDER.map((day) => {
          const label = DAY_LABELS[day];
          const current = days[day];
          return (
            <li
              key={day}
              className="flex flex-wrap items-center gap-x-4 gap-y-3 px-4 py-3.5"
            >
              <label className="flex min-h-11 w-36 cursor-pointer items-center gap-3 text-sm font-semibold">
                <input
                  type="checkbox"
                  name={`day_${day}_enabled`}
                  checked={current.enabled}
                  onChange={(e) => updateDay(day, { enabled: e.target.checked })}
                  className="peer sr-only"
                />
                <span
                  aria-hidden
                  className="relative h-6 w-10 shrink-0 rounded-full bg-border-strong transition-colors after:absolute after:left-0.5 after:top-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow-sm after:transition-transform peer-checked:bg-accent peer-checked:after:translate-x-4 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent"
                />
                {label}
              </label>

              {current.enabled ? (
                <div className="flex items-center gap-2">
                  <input
                    type="time"
                    name={`day_${day}_start`}
                    aria-label={`${label}: desde`}
                    value={current.start}
                    onChange={(e) => updateDay(day, { start: e.target.value })}
                    className="input !w-auto !min-h-10 !px-2.5 tabular-nums"
                  />
                  <span className="text-sm text-muted">a</span>
                  <input
                    type="time"
                    name={`day_${day}_end`}
                    aria-label={`${label}: hasta`}
                    value={current.end}
                    onChange={(e) => updateDay(day, { end: e.target.value })}
                    className="input !w-auto !min-h-10 !px-2.5 tabular-nums"
                  />
                </div>
              ) : (
                <span className="text-sm text-muted">No trabaja</span>
              )}

              {day === 1 && current.enabled && (
                <button
                  type="button"
                  onClick={copyMondayToWeekdays}
                  className="action sm:ml-auto"
                >
                  <Copy aria-hidden className="mr-1.5 h-3.5 w-3.5" />
                  Copiar a martes–viernes
                </button>
              )}
            </li>
          );
        })}
      </ul>

      {state.error && (
        <p className="form-error" role="alert">
          {state.error}
        </p>
      )}

      {saved && (
        <p className="alert-success" role="status">
          Horarios guardados. Ya se ven en la página de reservas.
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="btn btn-primary sm:self-start"
      >
        {pending ? "Guardando..." : "Guardar horarios"}
      </button>
    </form>
  );
}
