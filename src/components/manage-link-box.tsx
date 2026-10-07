"use client";

import { useState } from "react";
import { useOrigin } from "@/lib/use-origin";

/**
 * Se muestra una sola vez, justo después de reservar como invitado (sin
 * cuenta): es la única forma que tiene esa persona de volver a encontrar
 * su turno para cancelarlo o reprogramarlo, así que la invitamos a
 * guardar el link.
 */
export function ManageLinkBox({ token }: { token: string }) {
  const origin = useOrigin();
  const [copied, setCopied] = useState(false);
  const manageUrl = origin ? `${origin}/mi-turno/${token}` : `/mi-turno/${token}`;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(manageUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // el navegador bloqueó el portapapeles; el link sigue visible para
      // copiarlo a mano
    }
  }

  return (
    <div className="mb-10 mt-4 rounded-xl border border-accent/30 bg-accent-soft px-4 py-4">
      <p className="text-sm font-medium text-foreground">
        Guardá este link para cancelar o reprogramar tu turno más adelante:
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <code className="break-all text-sm text-accent">{manageUrl}</code>
        <button
          type="button"
          onClick={handleCopy}
          className="btn btn-secondary btn-sm shrink-0"
        >
          {copied ? "¡Copiado!" : "Copiar"}
        </button>
      </div>
    </div>
  );
}
