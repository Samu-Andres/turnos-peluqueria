import type { BookingStatus } from "@/types/database";

export const STATUS_LABELS: Record<BookingStatus, string> = {
  pending: "Pendiente",
  confirmed: "Confirmado",
  cancelled: "Cancelado",
  completed: "Completado",
};

export const STATUS_BADGE_CLASSES: Record<BookingStatus, string> = {
  pending: "border-accent/40 bg-accent/10 text-accent",
  confirmed: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
  cancelled: "border-red-500/30 bg-red-500/10 text-red-400",
  completed: "border-border bg-surface-hover text-muted",
};

export function statusBadgeClass(status: BookingStatus): string {
  return `shrink-0 rounded-full border px-2 py-1 text-xs font-medium ${STATUS_BADGE_CLASSES[status]}`;
}
