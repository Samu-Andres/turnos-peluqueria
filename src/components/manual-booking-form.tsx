"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { Clock } from "lucide-react";
import { SlotGrid } from "@/components/booking-pickers";
import { getAvailableSlots } from "@/lib/actions/booking-flow";
import type { ManualBookingFormState } from "@/lib/actions/manual-booking";
import { formatDateLongAR, todayInBusinessTZ } from "@/lib/booking/time";
import { formatPrice } from "@/lib/format";
import { submitWithoutReset } from "@/lib/submit-without-reset";

const initialState: ManualBookingFormState = { error: null };

type StaffOption = { id: string; full_name: string };
type ServiceOption = { id: string; name: string; duration_minutes: number; price: number };

/**
 * Cargar un turno a mano (WhatsApp, teléfono, alguien que vino al local).
 * Sugiere los horarios libres de ese día, pero deja escribir cualquier
 * hora: el barbero puede querer meter a alguien fuera de su horario.
 */
export function ManualBookingForm({
  staffOptions,
  services,
  backHref,
  action,
}: {
  staffOptions: StaffOption[];
  services: ServiceOption[];
  backHref: string;
  action: (
    prevState: ManualBookingFormState,
    formData: FormData
  ) => Promise<ManualBookingFormState>;
}) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const [staffId, setStaffId] = useState(staffOptions.length === 1 ? staffOptions[0].id : "");
  const [serviceId, setServiceId] = useState(services.length === 1 ? services[0].id : "");
  const [dateStr, setDateStr] = useState(() => todayInBusinessTZ());
  const [time, setTime] = useState("");
  const [slots, setSlots] = useState<string[] | null>(null);
  const [slotsError, setSlotsError] = useState<string | null>(null);
  const [loadingSlots, startLoadingSlots] = useTransition();

  useEffect(() => {
    if (!staffId || !serviceId || !dateStr) return;
    startLoadingSlots(async () => {
      const result = await getAvailableSlots(staffId, serviceId, dateStr);
      setSlotsError(result.error ?? null);
      setSlots(result.slots ?? []);
    });
  }, [staffId, serviceId, dateStr]);

  const ready = Boolean(staffId && serviceId && dateStr);

  return (
    <form onSubmit={submitWithoutReset(formAction)} className="mt-6 flex flex-col gap-8">
      {staffOptions.length > 1 && (
        <fieldset>
          <legend className="label mb-3">¿Con quién?</legend>
          <input type="hidden" name="staff_id" value={staffId} />
          <div className="flex flex-wrap gap-2">
            {staffOptions.map((person) => (
              <button
                key={person.id}
                type="button"
                aria-pressed={staffId === person.id}
                onClick={() => setStaffId(person.id)}
                className={`min-h-11 px-4 ${staffId === person.id ? "option-selected" : "option"}`}
              >
                {person.full_name}
              </button>
            ))}
          </div>
        </fieldset>
      )}
      {staffOptions.length === 1 && <input type="hidden" name="staff_id" value={staffId} />}

      <fieldset>
        <legend className="label mb-3">Servicio</legend>
        <input type="hidden" name="service_id" value={serviceId} />
        <div className="flex flex-col gap-2">
          {services.map((service) => (
            <button
              key={service.id}
              type="button"
              aria-pressed={serviceId === service.id}
              onClick={() => setServiceId(service.id)}
              className={`flex min-h-12 items-center justify-between gap-3 px-4 text-left ${
                serviceId === service.id ? "option-selected" : "option"
              }`}
            >
              <span className="font-semibold">{service.name}</span>
              <span className="flex shrink-0 items-center gap-3 text-muted">
                <span className="inline-flex items-center gap-1">
                  <Clock aria-hidden className="h-3.5 w-3.5" />
                  {service.duration_minutes} min
                </span>
                <span className="font-semibold text-foreground">{formatPrice(service.price)}</span>
              </span>
            </button>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="field">
          <label htmlFor="date" className="label">
            Día
          </label>
          <input
            id="date"
            name="date"
            type="date"
            required
            value={dateStr}
            onChange={(e) => {
              setDateStr(e.target.value);
              setTime("");
            }}
            className="input"
          />
          {dateStr && <p className="hint first-letter:uppercase">{formatDateLongAR(dateStr)}</p>}
        </div>
        <div className="field">
          <label htmlFor="time" className="label">
            Horario
          </label>
          <input
            id="time"
            name="time"
            type="time"
            required
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="input tabular-nums"
          />
          <p className="hint">Elegí uno libre de abajo o escribí cualquier hora.</p>
        </div>
      </div>

      {ready && (
        <div>
          <p className="label mb-3">Horarios libres ese día</p>
          <SlotGrid
            slots={slots}
            value={time}
            onChange={setTime}
            loading={loadingSlots}
            error={slotsError}
          />
        </div>
      )}

      <fieldset className="grid gap-4 sm:grid-cols-2">
        <legend className="label mb-3">Cliente</legend>
        <div className="field">
          <label htmlFor="client_name" className="label">
            Nombre
          </label>
          <input
            id="client_name"
            name="client_name"
            type="text"
            required
            autoComplete="off"
            placeholder="Ej: Juan Pérez"
            className="input"
          />
        </div>
        <div className="field">
          <label htmlFor="client_phone" className="label">
            Teléfono (opcional)
          </label>
          <input
            id="client_phone"
            name="client_phone"
            type="tel"
            autoComplete="off"
            placeholder="Para avisarle si hay cambios"
            className="input"
          />
        </div>
        <div className="field sm:col-span-2">
          <label htmlFor="notes" className="label">
            Notas (opcional)
          </label>
          <input
            id="notes"
            name="notes"
            type="text"
            placeholder="Ej: pidió por WhatsApp, viene con el hijo"
            className="input"
          />
        </div>
      </fieldset>

      {state.error && (
        <p className="alert-danger" role="alert">
          {state.error}
        </p>
      )}

      <div className="flex flex-col-reverse gap-3 border-t border-border pt-6 sm:flex-row">
        <Link href={backHref} className="btn btn-secondary">
          Cancelar
        </Link>
        <button
          type="submit"
          disabled={pending || !staffId || !serviceId}
          className="btn btn-primary sm:flex-1"
        >
          {pending ? "Guardando..." : time ? `Guardar turno de las ${time}` : "Guardar turno"}
        </button>
      </div>
    </form>
  );
}
