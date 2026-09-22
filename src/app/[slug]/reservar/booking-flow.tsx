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
  prefillName,
  servesAtHome,
}: {
  slug: string;
  businessId: string;
  services: Service[];
  staff: Staff[];
  initialServiceId?: string;
  initialStaffId?: string;
  initialDateStr?: string;
  initialTime?: string;
  prefillName?: string | null;
  servesAtHome: boolean;
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
    return createBooking.bind(null, businessId, serviceId, staffId, slug);
  }, [businessId, serviceId, staffId, slug]);

  return (
    <div className="mt-8 flex flex-col gap-8">
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
          1. Elegí el servicio
        </h2>
        <div className="mt-3 flex flex-col gap-2">
          {services.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setServiceId(s.id)}
              className={`flex items-center justify-between gap-3 rounded-lg border px-4 py-3 text-left text-sm transition-colors ${
                serviceId === s.id
                  ? "border-accent bg-accent text-accent-foreground"
                  : "border-border bg-surface hover:border-border-strong"
              }`}
            >
              <span className="font-medium">{s.name}</span>
              <span
                className={`shrink-0 ${
                  serviceId === s.id ? "text-accent-foreground/70" : "text-muted"
                }`}
              >
                {s.duration_minutes} min · {formatPrice(s.price)}
              </span>
            </button>
          ))}
        </div>
      </section>

      {serviceId && (
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
            2. Elegí con quién
          </h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {staff.map((person) => (
              <button
                key={person.id}
                type="button"
                onClick={() => setStaffId(person.id)}
                className={`rounded-lg border px-4 py-2 text-sm font-medium ${
                  staffId === person.id
                    ? "border-accent bg-accent text-accent-foreground"
                    : "border-border bg-surface hover:border-border-strong"
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
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
            3. Elegí el día
          </h2>
          <div className="mt-3 flex gap-2 overflow-x-auto pb-2">
            {dateOptions.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDateStr(d)}
                className={`shrink-0 whitespace-nowrap rounded-lg border px-3 py-2 text-xs font-medium capitalize ${
                  dateStr === d
                    ? "border-accent bg-accent text-accent-foreground"
                    : "border-border bg-surface hover:border-border-strong"
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
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
            4. Elegí el horario
          </h2>

          {isPending && (
            <p className="mt-3 text-sm text-muted">Buscando horarios...</p>
          )}

          {!isPending && slotsError && (
            <p className="mt-3 text-sm text-red-400">{slotsError}</p>
          )}

          {!isPending && !slotsError && slots && slots.length === 0 && (
            <p className="mt-3 text-sm text-muted">
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
                  className={`rounded-lg border px-3 py-2 text-sm font-medium ${
                    time === slot
                      ? "border-accent bg-accent text-accent-foreground"
                      : "border-border bg-surface hover:border-border-strong"
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
          prefillName={prefillName}
          servesAtHome={servesAtHome}
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
  prefillName,
  servesAtHome,
  action,
}: {
  slug: string;
  service: Service;
  staffId: string;
  dateStr: string;
  time: string;
  prefillName?: string | null;
  servesAtHome: boolean;
  action: BoundBookingAction;
}) {
  const [state, formAction, pending] = useActionState(action, initialBookingState);

  const nextUrl = `/${slug}/reservar?service=${service.id}&staff=${staffId}&date=${dateStr}&time=${time}`;

  return (
    <section className="rounded-lg border border-border bg-surface p-4">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
        5. Confirmá
      </h2>

      <dl className="mt-3 flex flex-col gap-1 text-sm">
        <div className="flex justify-between">
          <dt className="text-muted">Servicio</dt>
          <dd className="font-medium">{service.name}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-muted">Fecha</dt>
          <dd className="font-medium capitalize">{formatDateLongAR(dateStr)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-muted">Horario</dt>
          <dd className="font-medium">{time}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-muted">Precio</dt>
          <dd className="font-medium">{formatPrice(service.price)}</dd>
        </div>
      </dl>

      <form action={formAction} className="mt-4 flex flex-col gap-3">
        <input type="hidden" name="date" value={dateStr} />
        <input type="hidden" name="time" value={time} />

        <div className="flex flex-col gap-1">
          <label htmlFor="client_name" className="text-sm font-medium">
            Nombre y apellido
          </label>
          <input
            id="client_name"
            name="client_name"
            type="text"
            required
            defaultValue={prefillName ?? undefined}
            placeholder="Tu nombre completo"
            className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted/50 focus:border-accent focus:ring-1 focus:ring-accent/30"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="client_phone" className="text-sm font-medium">
            Teléfono
          </label>
          <input
            id="client_phone"
            name="client_phone"
            type="tel"
            required
            placeholder="Para que te puedan contactar"
            className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted/50 focus:border-accent focus:ring-1 focus:ring-accent/30"
          />
        </div>

        {servesAtHome && (
          <div className="flex flex-col gap-1">
            <label htmlFor="client_address" className="text-sm font-medium">
              Tu dirección
            </label>
            <input
              id="client_address"
              name="client_address"
              type="text"
              required
              placeholder="Calle, número, piso/depto, barrio"
              className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted/50 focus:border-accent focus:ring-1 focus:ring-accent/30"
            />
            <p className="text-xs text-muted">
              Este negocio atiende a domicilio: necesitamos tu dirección
              para ir a cortarte el pelo.
            </p>
          </div>
        )}

        <div className="flex flex-col gap-1">
          <label htmlFor="notes" className="text-sm font-medium">
            Notas para la peluquería (opcional)
          </label>
          <textarea
            id="notes"
            name="notes"
            rows={2}
            className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted/50 focus:border-accent focus:ring-1 focus:ring-accent/30"
          />
        </div>

        {state.error && (
          <p className="text-sm text-red-400" role="alert">
            {state.error}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground shadow-sm shadow-black/30 transition-colors hover:bg-accent-hover disabled:opacity-50"
        >
          {pending ? "Reservando..." : "Confirmar turno"}
        </button>
      </form>

      {!prefillName && (
        <p className="mt-3 text-xs text-muted">
          No hace falta cuenta para reservar. Si querés llevar un registro
          de tus turnos,{" "}
          <Link
            href={`/login?next=${encodeURIComponent(nextUrl)}`}
            className="text-accent underline decoration-accent/40 underline-offset-2 hover:text-accent-hover"
          >
            iniciá sesión
          </Link>{" "}
          o{" "}
          <Link
            href={`/signup?next=${encodeURIComponent(nextUrl)}`}
            className="text-accent underline decoration-accent/40 underline-offset-2 hover:text-accent-hover"
          >
            creá una cuenta
          </Link>{" "}
          (podés hacerlo antes o después de reservar).
        </p>
      )}
    </section>
  );
}
