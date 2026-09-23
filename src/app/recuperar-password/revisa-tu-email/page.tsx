import Link from "next/link";

export default function RecuperarPasswordRevisaTuEmailPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-4 px-4 text-center sm:px-6">
      <h1 className="text-2xl font-bold">Revisá tu email</h1>
      <p className="text-sm text-muted">
        Si ese mail está registrado, te llegó un link para elegir una nueva
        contraseña.
      </p>
      <Link
        href="/login"
        className="text-sm font-medium text-accent underline decoration-accent/40 underline-offset-2 hover:text-accent-hover"
      >
        Volver a iniciar sesión
      </Link>
    </main>
  );
}
