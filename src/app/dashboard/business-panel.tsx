"use client";

import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { EditBusinessForm } from "./edit-business-form";
import { formatPrice } from "@/lib/format";
import type { BusinessMetrics } from "@/lib/dashboard/metrics";
import type { Business } from "@/types/database";

// No hay nada a lo que suscribirse: solo usamos useSyncExternalStore para
// leer window.location.origin de forma segura con SSR (en el server no
// existe window, así que ahí devolvemos null y mostramos la ruta relativa
// hasta que el cliente hidrata con el origin real).
function subscribeNoop() {
  return () => {};
}

function getOrigin() {
  return window.location.origin;
}

function getServerOrigin() {
  return null;
}

export function BusinessPanel({
  business,
  metrics,
}: {
  business: Business;
  metrics: BusinessMetrics;
}) {
  const [editing, setEditing] = useState(false);
  const [copied, setCopied] = useState(false);
  const origin = useSyncExternalStore(subscribeNoop, getOrigin, getServerOrigin);
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

  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          {business.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={business.logo_url}
              alt=""
              className="h-12 w-12 shrink-0 rounded-lg border border-border object-cover"
            />
          ) : null}
          <h1 className="text-2xl font-bold">{business.name}</h1>
        </div>
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="shrink-0 text-sm font-medium text-muted underline decoration-muted/40 underline-offset-2 transition-colors hover:text-accent"
        >
          Editar
        </button>
      </div>
      <div className="mt-1 flex flex-wrap items-center gap-2">
        <p className="text-sm text-muted">
          Tu página pública: <code>{publicUrl}</code>
        </p>
        <button
          type="button"
          onClick={handleCopyUrl}
          className="shrink-0 rounded-md border border-border px-2 py-1 text-xs font-medium text-muted transition-colors hover:border-accent hover:text-accent"
        >
          {copied ? "¡Copiado!" : "Copiar"}
        </button>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        <div className="rounded-lg border border-border bg-surface px-2 py-3 text-center">
          <p className="text-xl font-bold text-accent">{metrics.bookingsThisMonth}</p>
          <p className="mt-1 text-xs text-muted">Turnos este mes</p>
        </div>
        <div className="rounded-lg border border-border bg-surface px-2 py-3 text-center">
          <p className="truncate text-sm font-bold text-accent" title={metrics.topServiceName ?? undefined}>
            {metrics.topServiceName ?? "—"}
          </p>
          <p className="mt-1 text-xs text-muted">Más pedido</p>
        </div>
        <div className="rounded-lg border border-border bg-surface px-2 py-3 text-center">
          <p className="truncate text-sm font-bold text-accent">
            {formatPrice(metrics.estimatedRevenue)}
          </p>
          <p className="mt-1 text-xs text-muted">Facturación estimada</p>
        </div>
      </div>

      {business.description && (
        <p className="mt-3 text-sm">{business.description}</p>
      )}
      {business.address && <p className="mt-4 text-sm">{business.address}</p>}
      {business.phone && <p className="text-sm">{business.phone}</p>}

      <div className="mt-8 flex flex-col gap-3">
        <Link
          href="/dashboard/fotos"
          className="rounded-lg border border-border bg-surface px-4 py-3 text-sm font-medium text-foreground transition-colors hover:border-accent hover:bg-surface-hover"
        >
          Fotos →
        </Link>
        <Link
          href="/dashboard/servicios"
          className="rounded-lg border border-border bg-surface px-4 py-3 text-sm font-medium text-foreground transition-colors hover:border-accent hover:bg-surface-hover"
        >
          Servicios →
        </Link>
        <Link
          href="/dashboard/staff"
          className="rounded-lg border border-border bg-surface px-4 py-3 text-sm font-medium text-foreground transition-colors hover:border-accent hover:bg-surface-hover"
        >
          Staff →
        </Link>
      </div>
    </div>
  );
}
