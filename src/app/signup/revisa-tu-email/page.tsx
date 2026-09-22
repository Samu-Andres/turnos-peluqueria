import Link from "next/link";

export default function RevisaTuEmailPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-4 px-6 text-center">
      <h1 className="text-2xl font-bold">Revisá tu email</h1>
      <p className="text-sm text-neutral-500">
        Te mandamos un link de confirmación. Abrilo para activar tu cuenta y
        después iniciá sesión.
      </p>
      <Link href="/login" className="text-sm font-medium text-neutral-900 underline">
        Volver a iniciar sesión
      </Link>
    </main>
  );
}
