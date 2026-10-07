"use client";

import { LoaderCircle } from "lucide-react";
import {
  dateChipPartsAR,
  formatDateLongAR,
  todayInBusinessTZ,
} from "@/lib/booking/time";

/**
 * Tira horizontal de días (tipo calendario: "vie / 25 / sep"). La usan
 * la reserva, la reprogramación y la agenda de cada persona del staff,
 * así se ven y se comportan igual en todos lados.
 */
export function DateStrip({
  dates,
  value,
  onChange,
  label = "Elegí el día",
}: {
  dates: string[];
  value: string | null;
  onChange: (dateStr: string) => void;
  label?: string;
}) {
  const today = todayInBusinessTZ();

  return (
    <div
      role="group"
      aria-label={label}
      className="-mx-1 flex snap-x gap-2 overflow-x-auto px-1 pb-2"
    >
      {dates.map((d) => {
        const parts = dateChipPartsAR(d);
        const selected = value === d;
        return (
          <button
            key={d}
            type="button"
            aria-pressed={selected}
            aria-label={formatDateLongAR(d)}
            onClick={() => onChange(d)}
            className={`flex w-16 shrink-0 snap-start flex-col items-center gap-0.5 py-2.5 ${
              selected ? "option-selected" : "option"
            }`}
          >
            <span className="text-xs font-medium capitalize text-muted">
              {d === today ? "Hoy" : parts.weekday}
            </span>
            <span className="text-lg font-bold leading-tight">{parts.day}</span>
            <span className="text-xs capitalize text-muted">{parts.month}</span>
          </button>
        );
      })}
    </div>
  );
}

/**
 * Grilla de horarios libres, con sus estados de carga, error y "no hay
 * horarios".
 */
export function SlotGrid({
  slots,
  value,
  onChange,
  loading,
  error,
}: {
  slots: string[] | null;
  value: string | null;
  onChange: (time: string) => void;
  loading: boolean;
  error: string | null;
}) {
  if (loading) {
    return (
      <p className="flex items-center gap-2 text-sm text-muted" role="status">
        <LoaderCircle aria-hidden className="h-4 w-4 animate-spin" />
        Buscando horarios...
      </p>
    );
  }

  if (error) {
    return <p className="form-error">{error}</p>;
  }

  if (!slots) {
    return null;
  }

  if (slots.length === 0) {
    return (
      <p className="rounded-xl bg-surface-sunken px-4 py-3 text-sm text-muted">
        No hay horarios libres ese día, probá con otra fecha.
      </p>
    );
  }

  return (
    <div role="group" aria-label="Horarios libres" className="grid grid-cols-4 gap-2 sm:grid-cols-6">
      {slots.map((slot) => (
        <button
          key={slot}
          type="button"
          aria-pressed={value === slot}
          onClick={() => onChange(slot)}
          className={`min-h-11 tabular-nums ${
            value === slot ? "option-selected" : "option"
          }`}
        >
          {slot}
        </button>
      ))}
    </div>
  );
}
