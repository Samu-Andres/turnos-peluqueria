import Link from "next/link";

type SearchParams = Promise<{ next?: string }>;

export default async function RevisaTuEmailPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { next } = await searchParams;
  const loginHref = next ? `/login?next=${encodeURIComponent(next)}` : "/login";

  return (
    <main className="page-narrow text-center">
      <h1 className="page-title">Revisá tu email</h1>
      <p className="text-sm text-muted">
        Te mandamos un link de confirmación. Abrilo para activar tu cuenta y
        después iniciá sesión.
      </p>
      <Link href={loginHref} className="link text-sm">
        Volver a iniciar sesión
      </Link>
    </main>
  );
}
