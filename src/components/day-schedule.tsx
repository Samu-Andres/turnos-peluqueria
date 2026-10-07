"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { LoaderCircle } from "lucide-react";
import { addDaysToDateStr, todayInBusinessTZ } from "@/lib/booking/time";
import { DateStrip } from "@/components/booking-pickers";
import {
  getStaffDaySchedule,
  type StaffDaySchedule,
} from "@/lib/actions/staff-schedule";

const DAYS_AHEAD = 14;

export function DaySchedule({ staffId }: { staffId: string }) {
  const today = useMemo(() => todayInBusinessTZ(), []);
  const [dateStr, setDateStr] = useState(today);
  const [schedule, setSchedule] = useState<StaffDaySchedule | null>(null);
  const [isPending, startTransition] = useTransition();

  const dateOptions = useMemo(
    () => Array.from({ length: DAYS_AHEAD }, (_, i) => addDaysToDateStr(today, i)),
    [today]
  );

  useEffect(() => {
    startTransition(async () => {
      const result = await getStaffDaySchedule(staffId, dateStr);
      setSchedule(result);
    });
  }, [staffId, dateStr]);

  return (
    <div className="mt-3">
      <DateStrip dates={dateOptions} value={dateStr} onChange={setDateStr} />

      <div className="mt-4">
        {isPending && (
          <p className="flex items-center gap-2 text-sm text-muted" role="status">
            <LoaderCircle aria-hidden className="h-4 w-4 animate-spin" />
            Cargando...
          </p>
        )}

        {!isPending && schedule && "error" in schedule && (
          <p className="form-error">{schedule.error}</p>
        )}

        {!isPending && schedule && !("error" in schedule) && !schedule.works && (
          <p className="text-sm text-muted">Ese día no trabaja.</p>
        )}

        {!isPending && schedule && !("error" in schedule) && schedule.works && (
          <div className="field">
            <p className="text-sm text-muted">
              Trabaja de{" "}
              {schedule.workingRanges
                .map((r) => `${r.start} a ${r.end}`)
                .join(", ")}
            </p>

            <p className="mt-3 text-sm font-medium">Libre</p>
            {schedule.freeRanges.length === 0 ? (
              <p className="text-sm text-muted">
                Sin huecos libres ese día.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {schedule.freeRanges.map((r, i) => (
                  <span
                    key={i}
                    className="rounded-lg border border-success-border bg-success-soft px-3 py-1 text-sm font-medium tabular-nums text-success"
                  >
                    {r.start} a {r.end}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {!isPending && schedule && !("error" in schedule) && schedule.bookings.length > 0 && (
          <div className="mt-4">
            <p className="text-sm font-medium">Ocupado</p>
            <ul className="mt-1 flex flex-col gap-2">
              {schedule.bookings.map((b) => (
                <li
                  key={b.id}
                  className="flex flex-col gap-1 rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm"
                >
                  <span>
                    {b.startTime} a {b.endTime} · {b.serviceName} ·{" "}
                    {b.clientName}
                  </span>
                  {b.clientPhone && (
                    <span className="text-xs text-muted">
                      Tel: {b.clientPhone}
                    </span>
                  )}
                  {b.clientAddress && (
                    <span className="text-xs text-muted">
                      A domicilio: {b.clientAddress}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
