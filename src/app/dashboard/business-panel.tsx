"use client";

import { useState } from "react";
import Link from "next/link";
import {
  BellRing,
  CalendarCheck,
  CalendarDays,
  Check,
  ChevronRight,
  Copy,
  ExternalLink,
  ImageIcon,
  Pencil,
  Scissors,
  Star,
  TriangleAlert,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { EditBusinessForm } from "./edit-business-form";
import { formatPrice } from "@/lib/format";
import { useOrigin } from "@/lib/use-origin";
import type { BusinessMetrics } from "@/lib/dashboard/metrics";
import type { Business } from "@/types/database";

export function BusinessPanel({
  business,
  metrics,
  setupSteps,
  agenda,
}: {
  business: Business;
  metrics: BusinessMetrics;
  setupSteps: string[];
  agenda: { pendingCount: number; todayCount: number };
}) {
  const [editing, setEditing] = useState(false);
  const [copied, setCopied] = useState(false);
  const origin = useOrigin();
  const publicUrl = origin ? `${origin}/${business.slug}` : `/${business.slug}`;

  async function handleCopyUrl() {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // el navegador bloqueó el portapapeles; no rompemos nada por esto
    }
  }

  if (editing) {
    return (
      <EditBusinessForm business={business} onCancel={() => setEditing(false)} />
    );
  }

  const tiles = [
    {
      href: "/dashboard/agenda",
      icon: CalendarDays,
      title: "Agenda",
      text:
        agenda.todayCount > 0
          ? `${agenda.todayCount} ${agenda.todayCount === 1 ? "turno queda" : "turnos quedan"} hoy.`
          : "Los turnos de todo el staff.",
      badge: agenda.pendingCount,
    },
    {
      href: "/dashboard/staff",
      icon: Users,
      title: "Staff y horarios",
      text: "Quién atiende y cuándo trabaja.",
    },
    {
      href: "/dashboard/servicios",
      icon: Scissors,
      title: "Servicios",
      text: "Qué ofrecés, cuánto dura y cuánto sale.",
    },
    {
      href: "/dashboard/fotos",
      icon: ImageIcon,
      title: "Fotos",
      text: "Mostrá el local y tus trabajos.",
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <section className="card p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-center gap-4">
            {business.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={business.logo_url}
                alt=""
                className="h-14 w-14 shrink-0 rounded-xl border border-border object-cover"
              />
            ) : (
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-xl font-bold text-accent">
                {business.name.charAt(0).toUpperCase()}
              </span>
            )}
            <div className="min-w-0">
              <h1 className="page-title truncate">{business.name}</h1>
              {(business.address || business.phone) && (
                <p className="truncate text-sm text-muted">
                  {[business.address, business.phone].filter(Boolean).join(" · ")}
                </p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="btn btn-secondary btn-sm shrink-0"
          >
            <Pencil aria-hidden className="h-3.5 w-3.5" />
            Editar
          </button>
        </div>

        {business.description && (
          <p className="mt-4 text-sm text-muted">{business.description}</p>
        )}

        <div className="mt-5 flex flex-col gap-2 rounded-xl bg-surface-sunken p-3 sm:flex-row sm:items-center">
          <p className="min-w-0 flex-1 truncate text-sm">
            <span className="text-muted">Tu página: </span>
            <span className="font-medium">{publicUrl}</span>
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleCopyUrl}
              className="btn btn-secondary btn-sm flex-1 sm:flex-none"
            >
              {copied ? (
                <Check aria-hidden className="h-3.5 w-3.5" />
              ) : (
                <Copy aria-hidden className="h-3.5 w-3.5" />
              )}
              {copied ? "¡Copiado!" : "Copiar link"}
            </button>
            <Link
              href={`/${business.slug}`}
              target="_blank"
              className="btn btn-secondary btn-sm flex-1 sm:flex-none"
            >
              <ExternalLink aria-hidden className="h-3.5 w-3.5" />
              Ver
            </Link>
          </div>
        </div>
      </section>

      {agenda.pendingCount > 0 && (
        <Link
          href="/dashboard/agenda"
          className="alert-warning flex items-center gap-3 transition-colors hover:border-warning"
        >
          <BellRing aria-hidden className="h-5 w-5 shrink-0" />
          <span className="flex-1">
            <span className="font-semibold">
              Tenés {agenda.pendingCount}{" "}
              {agenda.pendingCount === 1 ? "turno" : "turnos"} sin confirmar.
            </span>{" "}
            Confirmalos para que el cliente sepa que lo esperan.
          </span>
          <ChevronRight aria-hidden className="h-4 w-4 shrink-0" />
        </Link>
      )}

      {setupSteps.length > 0 && (
        <section className="alert-warning flex gap-3">
          <TriangleAlert aria-hidden className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <p className="font-semibold">
              Tus clientes todavía no pueden reservar. Te falta:
            </p>
            <ul className="mt-1 list-inside list-disc">
              {setupSteps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ul>
          </div>
        </section>
      )}

      <section>
        <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
          Este mes
        </h2>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Stat icon={CalendarCheck} label="Turnos confirmados" value={String(metrics.bookingsThisMonth)} />
          <Stat icon={Star} label="Servicio más pedido" value={metrics.topServiceName ?? "—"} />
          <Stat icon={Wallet} label="Facturación estimada" value={formatPrice(metrics.estimatedRevenue)} />
        </div>
      </section>

      <nav aria-label="Administrar negocio" className="grid gap-3 sm:grid-cols-2">
        {tiles.map(({ href, icon: Icon, title, text, badge }) => (
          <Link key={href} href={href} className="card-interactive group flex flex-col gap-3 p-5">
            <span className="flex items-center justify-between">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-soft text-accent">
                <Icon aria-hidden className="h-5 w-5" />
              </span>
              {badge ? (
                <span className="rounded-full bg-warning-soft px-2.5 py-1 text-xs font-bold text-warning">
                  {badge} sin confirmar
                </span>
              ) : null}
            </span>
            <div>
              <p className="flex items-center gap-1 font-semibold">
                {title}
                <ChevronRight
                  aria-hidden
                  className="h-4 w-4 text-muted transition-colors group-hover:text-accent"
                />
              </p>
              <p className="mt-0.5 text-sm text-muted">{text}</p>
            </div>
          </Link>
        ))}
      </nav>
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="card flex items-center gap-3 p-4">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface-sunken text-muted">
        <Icon aria-hidden className="h-5 w-5" />
      </span>
      <div className="min-w-0">
        <p className="line-clamp-2 break-words text-base font-bold leading-snug" title={value}>
          {value}
        </p>
        <p className="text-xs text-muted">{label}</p>
      </div>
    </div>
  );
}
