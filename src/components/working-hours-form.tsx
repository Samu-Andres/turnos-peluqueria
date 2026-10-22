"use client";

import { useActionState, useState } from "react";
import { Copy, Plus, X } from "lucide-react";
import { DAY_LABELS } from "@/lib/dashboard/days";
import type { WorkingHoursFormState } from "@/lib/actions/working-hours";
import type { WorkingHours } from "@/types/database";
import { submitWithoutReset } from "@/lib/submit-without-reset";

const initialState: WorkingHoursFormState = { error: null };

type BoundAction = (
  prevState: WorkingHoursFormState,
  formData: FormData
) => Promise<WorkingHoursFormState>;

type Range = {
  start: string;
  end: string;
};

type DayState = {
  enabled: boolean;
  // Una o más franjas: más de una es horario cortado (ej. 9–13 y 16–20).
  ranges: Range[];
};

const DEFAULT_RANGE: Range = { start: "09:00", end: "18:00" };
// Al sumar una franja sugerimos la tarde, el caso típico de horario cortado.
const SECOND_RANGE: Range = { start: "16:00", end: "20:00" };
const MAX_RANGES_PER_DAY = 3;
// Lunes a viernes (0 = domingo, 6 = sábado, igual que schema.sql).
const WEEKDAYS = [1, 2, 3, 4, 5];
// Se muestran de lunes a domingo, como se piensa una semana de trabajo.
const DISPLAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

function buildInitialDays(initialHours: WorkingHours[]): DayState[] {
  return DAY_LABELS.map((_, day) => {
    const ranges = initialHours
      .filter((hours) => hours.day_of_week === day)
      .map((hours) => ({
        start: hours.start_time.slice(0, 5),
        end: hours.end_time.slice(0, 5),
      }))
      .sort((x, y) => x.start.localeCompare(y.start));
    return ranges.length > 0
      ? { enabled: true, ranges }
      : { enabled: false, ranges: [{ ...DEFAULT_RANGE }] };
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

  function updateRange(day: number, index: number, patch: Partial<Range>) {
    setDays((prev) =>
      prev.map((d, i) =>
        i === day
          ? {
              ...d,
              ranges: d.ranges.map((r, j) => (j === index ? { ...r, ...patch } : r)),
            }
          : d
      )
    );
  }

  function addRange(day: number) {
    setDays((prev) =>
      prev.map((d, i) => {
        if (i !== day || d.ranges.length >= MAX_RANGES_PER_DAY) return d;
        // Si la primera franja es de corrido (9–18), al sumar la segunda la
        // cortamos al mediodía para que no se pisen.
        const first = d.ranges[0];
        const ranges =
          d.ranges.length === 1 && first.end > "13:00"
            ? [{ start: first.start, end: "13:00" }, { ...SECOND_RANGE }]
            : [...d.ranges, { ...SECOND_RANGE }];
        return { ...d, ranges };
      })
    );
  }

  function removeRange(day: number, index: number) {
    setDays((prev) =>
      prev.map((d, i) =>
        i === day ? { ...d, ranges: d.ranges.filter((_, j) => j !== index) } : d
      )
    );
  }

  function copyMondayToWeekdays() {
    setDays((prev) => {
      const monday = prev[1];
      return prev.map((d, i) =>
        WEEKDAYS.includes(i)
          ? { enabled: monday.enabled, ranges: monday.ranges.map((r) => ({ ...r })) }
          : d
      );
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
              className="flex flex-wrap items-start gap-x-4 gap-y-3 px-4 py-3.5"
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
                <div className="flex flex-col gap-2">
                  {current.ranges.map((range, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <input
                        type="time"
                        name={`day_${day}_start_${index}`}
                        aria-label={`${label}, franja ${index + 1}: desde`}
                        value={range.start}
                        onChange={(e) => updateRange(day, index, { start: e.target.value })}
                        className="input !w-auto !min-h-10 !px-2.5 tabular-nums"
                      />
                      <span className="text-sm text-muted">a</span>
                      <input
                        type="time"
                        name={`day_${day}_end_${index}`}
                        aria-label={`${label}, franja ${index + 1}: hasta`}
                        value={range.end}
                        onChange={(e) => updateRange(day, index, { end: e.target.value })}
                        className="input !w-auto !min-h-10 !px-2.5 tabular-nums"
                      />
                      {current.ranges.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeRange(day, index)}
                          aria-label={`Quitar franja ${range.start} a ${range.end} del ${label.toLowerCase()}`}
                          title="Quitar franja"
                          className="action !px-2"
                        >
                          <X aria-hidden className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  {current.ranges.length < MAX_RANGES_PER_DAY && (
                    <button
                      type="button"
                      onClick={() => addRange(day)}
                      className="action self-start !px-0 text-accent hover:!bg-transparent hover:!text-accent-hover"
                    >
                      <Plus aria-hidden className="mr-1 h-3.5 w-3.5" />
                      Agregar franja (horario cortado)
                    </button>
                  )}
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
