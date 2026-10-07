import Link from "next/link";
import { SearchX } from "lucide-react";

export default function NotFound() {
  return (
    <main className="page-narrow">
      <div className="card flex flex-col items-center p-8 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-sunken text-muted">
          <SearchX aria-hidden className="h-7 w-7" />
        </span>
        <h1 className="page-title mt-5">No encontramos esta página</h1>
        <p className="mt-2 text-sm text-muted">
          Puede que el link esté mal escrito o que la peluquería ya no esté
          en Turnos Peluquería.
        </p>
        <Link href="/" className="btn btn-primary mt-6 w-full">
          Ver peluquerías
        </Link>
      </div>
    </main>
  );
}
