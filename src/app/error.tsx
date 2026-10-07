"use client";

import { useEffect } from "react";
import Link from "next/link";
import { RotateCcw, TriangleAlert } from "lucide-react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="page-narrow">
      <div className="card flex flex-col items-center p-8 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-danger-soft text-danger">
          <TriangleAlert aria-hidden className="h-7 w-7" />
        </span>
        <h1 className="page-title mt-5">Algo salió mal</h1>
        <p className="mt-2 text-sm text-muted">
          Tuvimos un problema para cargar esta página. Probá de nuevo en
          unos segundos.
        </p>
        <div className="mt-6 flex w-full flex-col gap-2">
          <button type="button" onClick={reset} className="btn btn-primary">
            <RotateCcw aria-hidden className="h-4 w-4" />
            Reintentar
          </button>
          <Link href="/" className="btn btn-secondary">
            Ir al inicio
          </Link>
        </div>
      </div>
    </main>
  );
}
