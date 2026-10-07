import type { BookingStatus } from "@/types/database";

export const STATUS_LABELS: Record<BookingStatus, string> = {
  pending: "Pendiente",
  confirmed: "Confirmado",
  cancelled: "Cancelado",
  completed: "Completado",
};

export const STATUS_BADGE_CLASSES: Record<BookingStatus, string> = {
  pending: "border-accent/40 bg-accent/10 text-accent",
  confirmed: "border-success-border bg-success-soft text-success",
  cancelled: "border-danger-border bg-danger-soft text-danger",
  completed: "border-border bg-surface-hover text-muted",
};

export function statusBadgeClass(status: BookingStatus): string {
  return `shrink-0 rounded-full border px-2.5 py-1 text-xs font-semibold ${STATUS_BADGE_CLASSES[status]}`;
}
