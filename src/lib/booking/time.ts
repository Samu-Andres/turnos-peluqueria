/**
 * Helpers de fecha/hora para el flujo de reserva.
 *
 * El negocio opera en horario de Argentina, que desde 2009 es UTC-3 fijo
 * (sin horario de verano). En vez de confiar en la timezone del proceso
 * donde corre el server (en Netlify/Vercel suele ser UTC, en tu Mac es
 * UTC-3, así que el mismo código daría resultados distintos según dónde
 * corra), estos helpers fijan el offset "-03:00" a propósito para que el
 * cálculo de horarios sea siempre el mismo sin importar el despliegue.
 */

export const BUSINESS_TIMEZONE = "America/Argentina/Buenos_Aires";
const BUSINESS_TZ_OFFSET = "-03:00";

/** Convierte "YYYY-MM-DD" + "HH:MM" (hora de Argentina) a un ISO string UTC. */
export function combineDateAndTimeToISO(dateStr: string, timeStr: string): string {
  return new Date(`${dateStr}T${timeStr}:00${BUSINESS_TZ_OFFSET}`).toISOString();
}

/** "YYYY-MM-DD" de hoy, en horario de Argentina. */
export function todayInBusinessTZ(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: BUSINESS_TIMEZONE });
}

/** Minutos desde medianoche de "ahora", en horario de Argentina. */
export function nowMinutesInBusinessTZ(): number {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: BUSINESS_TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date());
  const hour = Number(parts.find((p) => p.type === "hour")?.value ?? "0");
  const minute = Number(parts.find((p) => p.type === "minute")?.value ?? "0");
  return hour * 60 + minute;
}

/** day_of_week (0=domingo..6=sábado, igual que schema.sql) de una fecha calendario. */
export function dayOfWeekOf(dateStr: string): number {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}

/** Suma (o resta) días a una fecha "YYYY-MM-DD". */
export function addDaysToDateStr(dateStr: string, days: number): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

/**
 * Minutos transcurridos desde la medianoche (hora de Argentina) de
 * `referenceDateStr` hasta el instante `iso`. Puede dar negativo o pasar
 * de 1440 si el instante cae en otro día — eso es intencional: así un
 * turno que "se escapa" del día de referencia simplemente no pisa ningún
 * horario de trabajo de ese día en la comparación.
 */
export function isoToMinutesSinceMidnight(iso: string, referenceDateStr: string): number {
  const dayStartMs = new Date(`${referenceDateStr}T00:00:00${BUSINESS_TZ_OFFSET}`).getTime();
  const instantMs = new Date(iso).getTime();
  return Math.round((instantMs - dayStartMs) / 60000);
}

/** "09:00:00" o "09:00" -> minutos desde medianoche. */
export function timeStrToMinutes(timeStr: string): number {
  const [hours, minutes] = timeStr.split(":").map(Number);
  return hours * 60 + minutes;
}

/** Minutos desde medianoche -> "HH:MM". */
export function minutesToTimeLabel(minutes: number): string {
  const hours = Math.floor(minutes / 60).toString().padStart(2, "0");
  const mins = (minutes % 60).toString().padStart(2, "0");
  return `${hours}:${mins}`;
}

/** "2026-09-25" -> "viernes 25 de septiembre". */
export function formatDateLongAR(dateStr: string): string {
  const date = new Date(`${dateStr}T12:00:00${BUSINESS_TZ_OFFSET}`);
  return new Intl.DateTimeFormat("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: BUSINESS_TIMEZONE,
  }).format(date);
}

/** Un timestamptz ISO -> "HH:MM" en hora de Argentina, para mostrar turnos guardados. */
export function formatTimeAR(iso: string): string {
  return new Intl.DateTimeFormat("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: BUSINESS_TIMEZONE,
  }).format(new Date(iso));
}

/** Un timestamptz ISO -> "viernes 25 de septiembre" en hora de Argentina. */
export function formatDateTimeLongAR(iso: string): string {
  return new Intl.DateTimeFormat("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: BUSINESS_TIMEZONE,
  }).format(new Date(iso));
}
