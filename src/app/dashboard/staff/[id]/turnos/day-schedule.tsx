"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import {
  addDaysToDateStr,
  formatDateLongAR,
  todayInBusinessTZ,
} from "@/lib/booking/time";
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
      <div className="flex gap-2 overflow-x-auto pb-2">
        {dateOptions.map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => setDateStr(d)}
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

      <div className="mt-4">
        {isPending && <p className="text-sm text-neutral-500">Cargando...</p>}

        {!isPending && schedule && "error" in schedule && (
          <p className="text-sm text-red-600">{schedule.error}</p>
        )}

        {!isPending && schedule && !("error" in schedule) && !schedule.works && (
          <p className="text-sm text-neutral-500">Ese día no trabaja.</p>
        )}

        {!isPending && schedule && !("error" in schedule) && schedule.works && (
          <div className="flex flex-col gap-1">
            <p className="text-sm text-neutral-500">
              Trabaja de{" "}
              {schedule.workingRanges
                .map((r) => `${r.start} a ${r.end}`)
                .join(", ")}
            </p>

            <p className="mt-3 text-sm font-medium">Libre</p>
            {schedule.freeRanges.length === 0 ? (
              <p className="text-sm text-neutral-500">
                Sin huecos libres ese día.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {schedule.freeRanges.map((r, i) => (
                  <span
                    key={i}
                    className="rounded-md border border-green-200 bg-green-50 px-3 py-1 text-sm text-green-800"
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
                  className="flex items-center justify-between rounded-md border border-neutral-200 px-3 py-2 text-sm"
                >
                  <span>
                    {b.startTime} a {b.endTime} · {b.serviceName} ·{" "}
                    {b.clientName}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
