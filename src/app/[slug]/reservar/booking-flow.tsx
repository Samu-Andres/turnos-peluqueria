"use client";

import { useActionState, useEffect, useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { Check, Clock, LoaderCircle } from "lucide-react";
import {
  addDaysToDateStr,
  dateChipPartsAR,
  formatDateLongAR,
  todayInBusinessTZ,
} from "@/lib/booking/time";
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
  prefillPhone,
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
  prefillPhone?: string | null;
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

  const staffPerson = staff.find((p) => p.id === staffId) ?? null;

  return (
    <ol className="mt-8 flex flex-col">
      <Step number={1} title="Elegí el servicio" done={Boolean(service)}>
        <div className="flex flex-col gap-2">
          {services.map((s) => (
            <button
              key={s.id}
              type="button"
              aria-pressed={serviceId === s.id}
              onClick={() => setServiceId(s.id)}
              className={`flex min-h-14 items-center justify-between gap-3 px-4 py-3 text-left ${
                serviceId === s.id ? "option-selected" : "option"
              }`}
            >
              <span className="font-semibold">{s.name}</span>
              <span className="flex shrink-0 items-center gap-3 text-muted">
                <span className="inline-flex items-center gap-1">
                  <Clock aria-hidden className="h-3.5 w-3.5" />
                  {s.duration_minutes} min
                </span>
                <span className="font-semibold text-foreground">
                  {formatPrice(s.price)}
                </span>
              </span>
            </button>
          ))}
        </div>
      </Step>

      {serviceId && (
        <Step
          number={2}
          title="Elegí con quién"
          done={Boolean(staffPerson)}
          summary={staff.length === 1 ? staffPerson?.full_name : undefined}
        >
          {staff.length > 1 && (
            <div className="flex flex-wrap gap-2">
              {staff.map((person) => (
                <button
                  key={person.id}
                  type="button"
                  aria-pressed={staffId === person.id}
                  onClick={() => setStaffId(person.id)}
                  className={`flex min-h-11 items-center gap-2.5 py-2 pl-2 pr-4 ${
                    staffId === person.id ? "option-selected" : "option"
                  }`}
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-sunken text-xs font-bold text-muted">
                    {person.full_name.charAt(0).toUpperCase()}
                  </span>
                  {person.full_name}
                </button>
              ))}
            </div>
          )}
        </Step>
      )}

      {serviceId && staffId && (
        <Step number={3} title="Elegí el día" done={Boolean(dateStr)}>
          <div className="-mx-1 flex snap-x gap-2 overflow-x-auto px-1 pb-2">
            {dateOptions.map((d, i) => {
              const parts = dateChipPartsAR(d);
              const selected = dateStr === d;
              return (
                <button
                  key={d}
                  type="button"
                  aria-pressed={selected}
                  aria-label={formatDateLongAR(d)}
                  onClick={() => setDateStr(d)}
                  className={`flex w-16 shrink-0 snap-start flex-col items-center gap-0.5 py-2.5 ${
                    selected ? "option-selected" : "option"
                  }`}
                >
                  <span className="text-xs font-medium capitalize text-muted">
                    {i === 0 ? "Hoy" : parts.weekday}
                  </span>
                  <span className="text-lg font-bold leading-tight">{parts.day}</span>
                  <span className="text-xs capitalize text-muted">{parts.month}</span>
                </button>
              );
            })}
          </div>
        </Step>
      )}

      {serviceId && staffId && dateStr && (
        <Step number={4} title="Elegí el horario" done={Boolean(time)}>
          <p className="-mt-1 mb-3 text-sm capitalize text-muted">
            {formatDateLongAR(dateStr)}
          </p>

          {isPending && (
            <p className="flex items-center gap-2 text-sm text-muted" role="status">
              <LoaderCircle aria-hidden className="h-4 w-4 animate-spin" />
              Buscando horarios...
            </p>
          )}

          {!isPending && slotsError && <p className="form-error">{slotsError}</p>}

          {!isPending && !slotsError && slots && slots.length === 0 && (
            <p className="rounded-xl bg-surface-sunken px-4 py-3 text-sm text-muted">
              No hay horarios libres ese día, probá con otra fecha.
            </p>
          )}

          {!isPending && slots && slots.length > 0 && (
            <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
              {slots.map((slot) => (
                <button
                  key={slot}
                  type="button"
                  aria-pressed={time === slot}
                  onClick={() => setTime(slot)}
                  className={`min-h-11 tabular-nums ${
                    time === slot ? "option-selected" : "option"
                  }`}
                >
                  {slot}
                </button>
              ))}
            </div>
          )}
        </Step>
      )}

      {service && staffId && dateStr && time && boundCreateBooking && (
        <ConfirmStep
          slug={slug}
          service={service}
          staffName={staffPerson?.full_name ?? null}
          staffId={staffId}
          dateStr={dateStr}
          time={time}
          prefillName={prefillName}
          prefillPhone={prefillPhone}
          servesAtHome={servesAtHome}
          action={boundCreateBooking}
        />
      )}
    </ol>
  );
}

/**
 * Un paso del flujo: número (o tilde cuando ya está elegido) con una
 * línea vertical que conecta con el siguiente.
 */
function Step({
  number,
  title,
  done,
  summary,
  last = false,
  children,
}: {
  number: number;
  title: string;
  done: boolean;
  summary?: string | null;
  last?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <li className="relative flex gap-4 pb-8">
      {!last && (
        <span aria-hidden className="absolute bottom-0 left-4 top-10 w-px bg-border" />
      )}
      <span
        className={`relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
          done
            ? "bg-accent text-accent-foreground"
            : "border border-border-strong bg-surface text-muted"
        }`}
      >
        {done ? <Check aria-hidden className="h-4 w-4" strokeWidth={3} /> : number}
      </span>
      <div className="min-w-0 flex-1 pt-1">
        <h2 className="mb-3 font-semibold">
          {title}
          {summary && <span className="font-normal text-muted"> · {summary}</span>}
        </h2>
        {children}
      </div>
    </li>
  );
}

function ConfirmStep({
  slug,
  service,
  staffName,
  staffId,
  dateStr,
  time,
  prefillName,
  prefillPhone,
  servesAtHome,
  action,
}: {
  slug: string;
  service: Service;
  staffName: string | null;
  staffId: string;
  dateStr: string;
  time: string;
  prefillName?: string | null;
  prefillPhone?: string | null;
  servesAtHome: boolean;
  action: BoundBookingAction;
}) {
  const [state, formAction, pending] = useActionState(action, initialBookingState);

  const nextUrl = `/${slug}/reservar?service=${service.id}&staff=${staffId}&date=${dateStr}&time=${time}`;

  return (
    <Step number={5} title="Confirmá tu turno" done={false} last>
      <div className="card overflow-hidden">
        <dl className="grid grid-cols-2 gap-x-4 gap-y-3 border-b border-border bg-surface-sunken/60 px-5 py-4 text-sm">
          <div>
            <dt className="text-xs text-muted">Servicio</dt>
            <dd className="font-semibold">{service.name}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted">Precio</dt>
            <dd className="font-semibold">{formatPrice(service.price)}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted">Día</dt>
            <dd className="font-semibold capitalize">{formatDateLongAR(dateStr)}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted">Horario</dt>
            <dd className="font-semibold tabular-nums">
              {time} hs{staffName ? ` · con ${staffName}` : ""}
            </dd>
          </div>
        </dl>

        <div className="px-5 py-5">
      <form action={formAction} className="flex flex-col gap-4">
        <input type="hidden" name="date" value={dateStr} />
        <input type="hidden" name="time" value={time} />

        <div className="field">
          <label htmlFor="client_name" className="label">
            Nombre y apellido
          </label>
          <input
            id="client_name"
            name="client_name"
            type="text"
            required
            defaultValue={prefillName ?? undefined}
            placeholder="Tu nombre completo"
            className="input"
          />
        </div>

        <div className="field">
          <label htmlFor="client_phone" className="label">
            Teléfono
          </label>
          <input
            id="client_phone"
            name="client_phone"
            type="tel"
            required
            defaultValue={prefillPhone ?? undefined}
            placeholder="Para que te puedan contactar"
            className="input"
          />
        </div>

        {servesAtHome && (
          <div className="field">
            <label htmlFor="client_address" className="label">
              Tu dirección
            </label>
            <input
              id="client_address"
              name="client_address"
              type="text"
              required
              placeholder="Calle, número, piso/depto, barrio"
              className="input"
            />
            <p className="text-xs text-muted">
              Este negocio atiende a domicilio: necesitamos tu dirección
              para ir a cortarte el pelo.
            </p>
          </div>
        )}

        <div className="field">
          <label htmlFor="notes" className="label">
            Notas para la peluquería (opcional)
          </label>
          <textarea
            id="notes"
            name="notes"
            rows={2}
            className="input"
          />
        </div>

        {state.error && (
          <p className="form-error" role="alert">
            {state.error}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="btn btn-primary mt-1 w-full"
        >
          {pending ? "Reservando..." : `Confirmar turno de las ${time}`}
        </button>
      </form>

        {!prefillName && (
          <p className="mt-4 text-center text-xs text-muted">
            No hace falta cuenta para reservar. Si querés llevar un registro
            de tus turnos,{" "}
            <Link
              href={`/login?next=${encodeURIComponent(nextUrl)}`}
              className="link"
            >
              iniciá sesión
            </Link>{" "}
            o{" "}
            <Link
              href={`/signup?next=${encodeURIComponent(nextUrl)}`}
              className="link"
            >
              creá una cuenta
            </Link>{" "}
            (podés hacerlo antes o después de reservar).
          </p>
        )}
        </div>
      </div>
    </Step>
  );
}
