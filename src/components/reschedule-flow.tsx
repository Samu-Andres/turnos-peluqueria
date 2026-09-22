"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import {
  addDaysToDateStr,
  formatDateLongAR,
  todayInBusinessTZ,
} from "@/lib/booking/time";
import { getAvailableSlots } from "@/lib/actions/booking-flow";
import type { RescheduleFormState } from "@/lib/actions/reschedule";

const DAYS_AHEAD = 14;

export function RescheduleFlow({
  bookingId,
  staffId,
  serviceId,
  summary,
  backHref,
  action,
}: {
  bookingId: string;
  staffId: string;
  serviceId: string;
  summary: string;
  backHref: string;
  action: (
    prevState: RescheduleFormState,
    formData: FormData
  ) => Promise<RescheduleFormState>;
}) {
  const today = useMemo(() => todayInBusinessTZ(), []);
  const dateOptions = useMemo(
    () => Array.from({ length: DAYS_AHEAD }, (_, i) => addDaysToDateStr(today, i)),
    [today]
  );

  const [dateStr, setDateStr] = useState<string | null>(null);
  const [time, setTime] = useState<string | null>(null);
  const [slots, setSlots] = useState<string[] | null>(null);
  const [slotsError, setSlotsError] = useState<string | null>(null);
  const [isLoadingSlots, startLoadingSlots] = useTransition();

  const [error, setError] = useState<string | null>(null);
  const [isSaving, startSaving] = useTransition();

  useEffect(() => {
    if (!dateStr) return;

    startLoadingSlots(async () => {
      const result = await getAvailableSlots(staffId, serviceId, dateStr, bookingId);
      if (result.error) {
        setSlotsError(result.error);
        setSlots([]);
      } else {
        setSlotsError(null);
        setSlots(result.slots ?? []);
      }
    });
  }, [staffId, serviceId, bookingId, dateStr]);

  function handleSubmit(formData: FormData) {
    startSaving(async () => {
      const result = await action({ error: null }, formData);
      if (result?.error) {
        setError(result.error);
      }
    });
  }

  return (
    <div className="mt-8 flex flex-col gap-6">
      <p className="text-sm text-neutral-500">{summary}</p>

      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
          Nuevo día
        </h2>
        <div className="mt-3 flex gap-2 overflow-x-auto pb-2">
          {dateOptions.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => {
                setDateStr(d);
                setTime(null);
              }}
              className={`shrink-0 whitespace-nowrap rounded-md border px-3 py-2 text-xs font-medium capitalize ${
                dateStr === d
                  ? "border-neutral-900 bg-neutral-900 text-white"
                  : "border-neutral-300"
              }`}
            >
              {formatDateLongAR(d)}
            </button>
          ))}
        </div>
      </div>

      {dateStr && (
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
            Nuevo horario
          </h2>

          {isLoadingSlots && (
            <p className="mt-3 text-sm text-neutral-500">Buscando horarios...</p>
          )}

          {!isLoadingSlots && slotsError && (
            <p className="mt-3 text-sm text-red-600">{slotsError}</p>
          )}

          {!isLoadingSlots && !slotsError && slots && slots.length === 0 && (
            <p className="mt-3 text-sm text-neutral-500">
              No hay horarios libres ese día, probá con otra fecha.
            </p>
          )}

          {!isLoadingSlots && slots && slots.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {slots.map((slot) => (
                <button
                  key={slot}
                  type="button"
                  onClick={() => setTime(slot)}
                  className={`rounded-md border px-3 py-2 text-sm font-medium ${
                    time === slot
                      ? "border-neutral-900 bg-neutral-900 text-white"
                      : "border-neutral-300"
                  }`}
                >
                  {slot}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {dateStr && time && (
        <form action={handleSubmit} className="flex flex-col gap-3">
          <input type="hidden" name="date" value={dateStr} />
          <input type="hidden" name="time" value={time} />

          {error && (
            <p className="text-sm text-red-600" role="alert">
              {error}
            </p>
          )}

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={isSaving}
              className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              {isSaving ? "Guardando..." : "Confirmar nuevo horario"}
            </button>
            <Link
              href={backHref}
              className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-semibold text-neutral-900"
            >
              Cancelar
            </Link>
          </div>
        </form>
      )}
    </div>
  );
}
