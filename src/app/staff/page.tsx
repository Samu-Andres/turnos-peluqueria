import type { Metadata } from "next";
import Link from "next/link";
import { CalendarDays, ChevronRight, Clock } from "lucide-react";
import { requireStaffSelf } from "@/lib/dashboard/require-staff-access";

export const metadata: Metadata = { title: "Mi agenda" };

export default async function StaffHomePage() {
  const { business, staff } = await requireStaffSelf();

  const tiles = [
    {
      href: "/staff/turnos",
      icon: CalendarDays,
      title: "Tus turnos",
      text: "Confirmá, reprogramá o marcá como completados.",
    },
    {
      href: "/staff/horarios",
      icon: Clock,
      title: "Tus horarios",
      text: "Los días y horas en que te pueden reservar.",
    },
  ];

  return (
    <main className="page">
      <p className="eyebrow">{business.name}</p>
      <h1 className="page-title mt-2">Hola, {staff.full_name}</h1>
      <p className="page-subtitle">Desde acá manejás tu agenda.</p>

      <nav aria-label="Tu agenda" className="mt-8 grid gap-3 sm:grid-cols-2">
        {tiles.map(({ href, icon: Icon, title, text }) => (
          <Link key={href} href={href} className="card-interactive group flex items-center gap-4 p-5">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent">
              <Icon aria-hidden className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-semibold">{title}</p>
              <p className="mt-0.5 text-sm text-muted">{text}</p>
            </div>
            <ChevronRight
              aria-hidden
              className="h-5 w-5 shrink-0 text-muted transition-colors group-hover:text-accent"
            />
          </Link>
        ))}
      </nav>
    </main>
  );
}
