"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { CalendarOff, Trash2 } from "lucide-react";
import { addTimeOff, deleteTimeOff, type TimeOffFormState } from "@/lib/actions/time-off";
import { formatDateLongAR, todayInBusinessTZ } from "@/lib/booking/time";
import { submitWithoutReset } from "@/lib/submit-without-reset";
import type { TimeOff } from "@/types/database";

const initialState: TimeOffFormState = { error: null };

function rangeLabel(entry: TimeOff): string {
  const start = formatDateLongAR(entry.start_date);
  return entry.start_date === entry.end_date
    ? start
    : `del ${start} al ${formatDateLongAR(entry.end_date)}`;
}

/**
 * Días libres y vacaciones de una persona del staff: lista de los que
 * vienen y form para agregar uno o un rango. Lo usan tanto el dueño
 * (/dashboard/staff/[id]/horarios) como la propia persona (/staff/horarios).
 */
export function TimeOffManager({
  staffId,
  entries,
}: {
  staffId: string;
  entries: TimeOff[];
}) {
  const [state, formAction, pending] = useActionState(
    addTimeOff.bind(null, staffId),
    initialState
  );
  const formRef = useRef<HTMLFormElement>(null);
  const [startDate, setStartDate] = useState("");
  const today = todayInBusinessTZ();

  useEffect(() => {
    if (state !== initialState && !state.error) {
      formRef.current?.reset();
    }
  }, [state]);

  return (
    <section className="mt-12 border-t border-border pt-8">
      <h2 className="section-title">Días libres y vacaciones</h2>
      <p className="page-subtitle">
        Esos días no se ofrecen turnos online. Sirve para un franco, un
        feriado, un trámite o las vacaciones.
      </p>

      {entries.length > 0 ? (
        <ul className="card mt-5 divide-y divide-border">
          {entries.map((entry) => (
            <TimeOffRow key={entry.id} entry={entry} staffId={staffId} />
          ))}
        </ul>
      ) : (
        <p className="mt-5 rounded-xl bg-surface-sunken px-4 py-3 text-sm text-muted">
          No hay días libres cargados.
        </p>
      )}

      <form
        ref={formRef}
        onSubmit={submitWithoutReset(formAction)}
        className="card mt-5 flex flex-col gap-4 p-5"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="field">
            <label htmlFor="start_date" className="label">
              Desde
            </label>
            <input
              id="start_date"
              name="start_date"
              type="date"
              required
              min={today}
              onChange={(e) => setStartDate(e.target.value)}
              className="input"
            />
          </div>
          <div className="field">
            <label htmlFor="end_date" className="label">
              Hasta (opcional)
            </label>
            <input
              id="end_date"
              name="end_date"
              type="date"
              min={startDate || today}
              className="input"
            />
            <p className="hint">Dejalo vacío si es un solo día.</p>
          </div>
        </div>
        <div className="field">
          <label htmlFor="reason" className="label">
            Motivo (opcional)
          </label>
          <input
            id="reason"
            name="reason"
            type="text"
            maxLength={60}
            placeholder="Ej: Vacaciones, feriado, trámite"
            className="input"
          />
          <p className="hint">Lo ven los clientes como &quot;cerrado&quot;, sin el motivo.</p>
        </div>

        {state.error && (
          <p className="form-error" role="alert">
            {state.error}
          </p>
        )}
        {state.notice && (
          <p className="alert-warning" role="status">
            {state.notice}
          </p>
        )}

        <button type="submit" disabled={pending} className="btn btn-primary sm:self-start">
          <CalendarOff aria-hidden className="h-4 w-4" />
          {pending ? "Guardando..." : "Marcar días libres"}
        </button>
      </form>
    </section>
  );
}

function TimeOffRow({ entry, staffId }: { entry: TimeOff; staffId: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <li className="flex items-center justify-between gap-3 px-4 py-3">
      <div className="min-w-0">
        <p className="text-sm font-semibold first-letter:uppercase">{rangeLabel(entry)}</p>
        {entry.reason && <p className="text-sm text-muted">{entry.reason}</p>}
      </div>
      <button
        type="button"
        disabled={isPending}
        onClick={() => startTransition(() => deleteTimeOff(entry.id, staffId))}
        aria-label={`Quitar ${rangeLabel(entry)}`}
        title="Quitar"
        className="action-danger shrink-0"
      >
        <Trash2 aria-hidden className="h-4 w-4" />
      </button>
    </li>
  );
}
