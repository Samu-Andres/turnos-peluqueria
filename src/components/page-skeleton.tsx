/**
 * Esqueleto genérico mientras carga una página (lo usan los loading.tsx).
 * Bloques grises con la forma aproximada del contenido, sin texto.
 */
export function PageSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <main className="page" aria-busy="true" aria-label="Cargando">
      <div className="h-8 w-48 animate-pulse rounded-lg bg-surface-sunken" />
      <div className="mt-3 h-4 w-72 max-w-full animate-pulse rounded bg-surface-sunken" />
      <div className="mt-8 flex flex-col gap-3">
        {Array.from({ length: rows }, (_, i) => (
          <div key={i} className="card h-20 animate-pulse !bg-surface-sunken/60" />
        ))}
      </div>
    </main>
  );
}
