export type MinuteInterval = {
  startMinutes: number;
  endMinutes: number;
};

/**
 * Calcula los horarios de inicio disponibles (en minutos desde
 * medianoche) para un servicio de `durationMinutes`, dado los rangos en
 * los que el staff trabaja ese día y los rangos que ya tiene ocupados.
 *
 * Es una función pura (sin fechas reales, sin Supabase) a propósito, para
 * poder probarla y razonarla sin depender de timezones.
 */
export function computeAvailableSlots({
  workingIntervals,
  busyIntervals,
  durationMinutes,
  stepMinutes = 15,
  earliestStartMinutes = 0,
}: {
  workingIntervals: MinuteInterval[];
  busyIntervals: MinuteInterval[];
  durationMinutes: number;
  stepMinutes?: number;
  earliestStartMinutes?: number;
}): number[] {
  const slots: number[] = [];

  for (const working of workingIntervals) {
    const rangeStart = Math.max(working.startMinutes, earliestStartMinutes);
    let candidate = Math.ceil(rangeStart / stepMinutes) * stepMinutes;

    while (candidate + durationMinutes <= working.endMinutes) {
      const candidateEnd = candidate + durationMinutes;

      const overlapsBusy = busyIntervals.some(
        (busy) => candidate < busy.endMinutes && candidateEnd > busy.startMinutes
      );

      if (!overlapsBusy) {
        slots.push(candidate);
      }

      candidate += stepMinutes;
    }
  }

  return [...new Set(slots)].sort((a, b) => a - b);
}
