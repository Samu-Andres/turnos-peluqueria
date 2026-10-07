import Link from "next/link";

export default function RecuperarPasswordRevisaTuEmailPage() {
  return (
    <main className="page-narrow text-center">
      <h1 className="page-title">Revisá tu email</h1>
      <p className="text-sm text-muted">
        Si ese mail está registrado, te llegó un link para elegir una nueva
        contraseña.
      </p>
      <Link
        href="/login"
        className="link text-sm"
      >
        Volver a iniciar sesión
      </Link>
    </main>
  );
}
