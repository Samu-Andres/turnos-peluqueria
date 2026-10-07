"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { CalendarClock } from "lucide-react";
import { DateStrip, SlotGrid } from "@/components/booking-pickers";
import {
  addDaysToDateStr,
  formatDateLongAR,
  todayInBusinessTZ,
} from "@/lib/booking/time";
import { getAvailableSlots } from "@/lib/actions/booking-flow";
import type { RescheduleFormState } from "@/lib/actions/reschedule";
import { submitWithoutReset } from "@/lib/submit-without-reset";

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
    <div className="mt-6 flex flex-col gap-8">
      <div className="card flex items-start gap-3 p-4">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface-sunken text-muted">
          <CalendarClock aria-hidden className="h-5 w-5" />
        </span>
        <div>
          <p className="text-xs font-medium text-muted">Turno actual</p>
          <p className="text-sm font-semibold first-letter:uppercase">{summary}</p>
        </div>
      </div>

      <section>
        <h2 className="mb-3 font-semibold">Elegí el nuevo día</h2>
        <DateStrip
          dates={dateOptions}
          value={dateStr}
          onChange={(d) => {
            setDateStr(d);
            setTime(null);
          }}
        />
      </section>

      {dateStr && (
        <section>
          <h2 className="font-semibold">Elegí el nuevo horario</h2>
          <p className="mb-3 text-sm text-muted first-letter:uppercase">
            {formatDateLongAR(dateStr)}
          </p>
          <SlotGrid
            slots={slots}
            value={time}
            onChange={setTime}
            loading={isLoadingSlots}
            error={slotsError}
          />
        </section>
      )}

      <form onSubmit={submitWithoutReset(handleSubmit)} className="flex flex-col gap-3 border-t border-border pt-6">
        <input type="hidden" name="date" value={dateStr ?? ""} />
        <input type="hidden" name="time" value={time ?? ""} />

        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}

        <div className="flex flex-col-reverse gap-3 sm:flex-row">
          <Link href={backHref} className="btn btn-secondary">
            Volver sin cambiar
          </Link>
          <button
            type="submit"
            disabled={isSaving || !dateStr || !time}
            className="btn btn-primary sm:flex-1"
          >
            {isSaving
              ? "Guardando..."
              : time
                ? `Pasar el turno a las ${time}`
                : "Elegí día y horario"}
          </button>
        </div>
      </form>
    </div>
  );
}
