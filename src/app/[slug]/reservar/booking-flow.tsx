"use client";

import { useActionState, useEffect, useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { addDaysToDateStr, formatDateLongAR, todayInBusinessTZ } from "@/lib/booking/time";
import { formatPrice } from "@/lib/format";
import {
  createBooking,
  getAvailableSlots,
  type BookingFormState,
} from "@/lib/actions/booking-flow";
import type { Service, Staff } from "@/types/database";

const initialBookingState: BookingFormState = { error: null };
const DAYS_AHEAD = 14;

type BoundBookingAction = (
  prevState: BookingFormState,
  formData: FormData
) => Promise<BookingFormState>;

export function BookingFlow({
  slug,
  businessId,
  services,
  staff,
  initialServiceId,
  initialStaffId,
  initialDateStr,
  initialTime,
  isLoggedIn,
}: {
  slug: string;
  businessId: string;
  services: Service[];
  staff: Staff[];
  initialServiceId?: string;
  initialStaffId?: string;
  initialDateStr?: string;
  initialTime?: string;
  isLoggedIn: boolean;
}) {
  const [serviceId, setServiceId] = useState<string | null>(() =>
    initialServiceId && services.some((s) => s.id === initialServiceId)
      ? initialServiceId
      : null
  );
  const [staffId, setStaffId] = useState<string | null>(() => {
    if (initialStaffId && staff.some((p) => p.id === initialStaffId)) {
      return initialStaffId;
    }
    return staff.length === 1 ? staff[0].id : null;
  });
  const [dateStr, setDateStr] = useState<string | null>(initialDateStr ?? null);
  const [time, setTime] = useState<string | null>(initialTime ?? null);
  const [slots, setSlots] = useState<string[] | null>(null);
  const [slotsError, setSlotsError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const restoreTimeRef = useRef(initialTime ?? null);

  const service = services.find((s) => s.id === serviceId) ?? null;

  const dateOptions = useMemo(() => {
    const today = todayInBusinessTZ();
    return Array.from({ length: DAYS_AHEAD }, (_, i) => addDaysToDateStr(today, i));
  }, []);

  useEffect(() => {
    if (!staffId || !serviceId || !dateStr) {
      return;
    }

    startTransition(async () => {
      const result = await getAvailableSlots(staffId, serviceId, dateStr);

      if (result.error) {
        setSlotsError(result.error);
        setSlots([]);
        setTime(null);
        restoreTimeRef.current = null;
        return;
      }

      setSlotsError(null);
      const availableSlots = result.slots ?? [];
      setSlots(availableSlots);

      const toRestore = restoreTimeRef.current;
      restoreTimeRef.current = null;
      setTime(toRestore && availableSlots.includes(toRestore) ? toRestore : null);
    });
  }, [staffId, serviceId, dateStr]);

  const boundCreateBooking: BoundBookingAction | null = useMemo(() => {
    if (!serviceId || !staffId) return null;
    return createBooking.bind(null, businessId, serviceId, staffId);
  }, [businessId, serviceId, staffId]);

  return (
    <div className="mt-8 flex flex-col gap-8">
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
          1. Elegí el servicio
        </h2>
        <div className="mt-3 flex flex-col gap-2">
          {services.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setServiceId(s.id)}
              className={`flex items-center justify-between rounded-md border px-4 py-3 text-left text-sm ${
                serviceId === s.id
                  ? "border-neutral-900 bg-neutral-900 text-white"
                  : "border-neutral-300"
              }`}
            >
              <span className="font-medium">{s.name}</span>
              <span
                className={serviceId === s.id ? "text-neutral-300" : "text-neutral-500"}
              >
                {s.duration_minutes} min · {formatPrice(s.price)}
              </span>
            </button>
          ))}
        </div>
      </section>

      {serviceId && (
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
            2. Elegí con quién
          </h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {staff.map((person) => (
              <button
                key={person.id}
                type="button"
                onClick={() => setStaffId(person.id)}
                className={`rounded-md border px-4 py-2 text-sm font-medium ${
                  staffId === person.id
                    ? "border-neutral-900 bg-neutral-900 text-white"
                    : "border-neutral-300"
                }`}
              >
                {person.full_name}
              </button>
            ))}
          </div>
        </section>
      )}

      {serviceId && staffId && (
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
            3. Elegí el día
          </h2>
          <div className="mt-3 flex gap-2 overflow-x-auto pb-2">
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
        </section>
      )}

      {serviceId && staffId && dateStr && (
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
            4. Elegí el horario
          </h2>

          {isPending && (
            <p className="mt-3 text-sm text-neutral-500">Buscando horarios...</p>
          )}

          {!isPending && slotsError && (
            <p className="mt-3 text-sm text-red-600">{slotsError}</p>
          )}

          {!isPending && !slotsError && slots && slots.length === 0 && (
            <p className="mt-3 text-sm text-neutral-500">
              No hay horarios libres ese día, probá con otra fecha.
            </p>
          )}

          {!isPending && slots && slots.length > 0 && (
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
        </section>
      )}

      {service && staffId && dateStr && time && boundCreateBooking && (
        <ConfirmStep
          slug={slug}
          service={service}
          staffId={staffId}
          dateStr={dateStr}
          time={time}
          isLoggedIn={isLoggedIn}
          action={boundCreateBooking}
        />
      )}
    </div>
  );
}

function ConfirmStep({
  slug,
  service,
  staffId,
  dateStr,
  time,
  isLoggedIn,
  action,
}: {
  slug: string;
  service: Service;
  staffId: string;
  dateStr: string;
  time: string;
  isLoggedIn: boolean;
  action: BoundBookingAction;
}) {
  const [state, formAction, pending] = useActionState(action, initialBookingState);

  const nextUrl = `/${slug}/reservar?service=${service.id}&staff=${staffId}&date=${dateStr}&time=${time}`;

  return (
    <section className="rounded-md border border-neutral-200 p-4">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
        5. Confirmá
      </h2>

      <dl className="mt-3 flex flex-col gap-1 text-sm">
        <div className="flex justify-between">
          <dt className="text-neutral-500">Servicio</dt>
          <dd className="font-medium">{service.name}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-neutral-500">Fecha</dt>
          <dd className="font-medium capitalize">{formatDateLongAR(dateStr)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-neutral-500">Horario</dt>
          <dd className="font-medium">{time}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-neutral-500">Precio</dt>
          <dd className="font-medium">{formatPrice(service.price)}</dd>
        </div>
      </dl>

      {isLoggedIn ? (
        <form action={formAction} className="mt-4 flex flex-col gap-3">
          <input type="hidden" name="date" value={dateStr} />
          <input type="hidden" name="time" value={time} />

          <div className="flex flex-col gap-1">
            <label htmlFor="notes" className="text-sm font-medium">
              Notas para la peluquería (opcional)
            </label>
            <textarea
              id="notes"
              name="notes"
              rows={2}
              className="rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-900"
            />
          </div>

          {state.error && (
            <p className="text-sm text-red-600" role="alert">
              {state.error}
            </p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {pending ? "Reservando..." : "Confirmar turno"}
          </button>
        </form>
      ) : (
        <div className="mt-4">
          <p className="text-sm text-neutral-500">
            Necesitás una cuenta para confirmar el turno.
          </p>
          <div className="mt-3 flex gap-3">
            <Link
              href={`/login?next=${encodeURIComponent(nextUrl)}`}
              className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-semibold text-white"
            >
              Iniciar sesión
            </Link>
            <Link
              href={`/signup?next=${encodeURIComponent(nextUrl)}`}
              className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-semibold text-neutral-900"
            >
              Crear cuenta
            </Link>
          </div>
        </div>
      )}
    </section>
  );
}
