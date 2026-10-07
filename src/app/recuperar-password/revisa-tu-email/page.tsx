import type { Metadata } from "next";
import Link from "next/link";
import { MailCheck } from "lucide-react";

export const metadata: Metadata = { title: "Revisá tu email" };

export default function RecuperarPasswordRevisaTuEmailPage() {
  return (
    <main className="page-narrow">
      <div className="card flex flex-col items-center p-8 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-soft text-accent">
          <MailCheck aria-hidden className="h-7 w-7" />
        </span>
        <h1 className="page-title mt-5">Revisá tu email</h1>
        <p className="mt-2 text-sm text-muted">
          Si ese mail está registrado, te llegó un link para elegir una
          nueva contraseña.
        </p>
        <p className="mt-3 text-xs text-muted">
          ¿No te llegó? Fijate en spam o promociones. Puede tardar unos minutos.
        </p>
        <Link href="/login" className="btn btn-secondary mt-6 w-full">
          Ir a iniciar sesión
        </Link>
      </div>
    </main>
  );
}
