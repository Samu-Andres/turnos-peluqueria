/**
 * Índice de día de semana igual a JS Date#getDay(): 0 = domingo, 6 = sábado.
 * Coincide con el check constraint de working_hours en supabase/schema.sql.
 */
export const DAY_LABELS = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
] as const;
