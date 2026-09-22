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
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-4 px-4 text-center sm:px-6">
      <h1 className="text-2xl font-bold">Revisá tu email</h1>
      <p className="text-sm text-muted">
        Te mandamos un link de confirmación. Abrilo para activar tu cuenta y
        después iniciá sesión.
      </p>
      <Link href={loginHref} className="text-sm font-medium text-accent underline decoration-accent/40 underline-offset-2 hover:text-accent-hover">
        Volver a iniciar sesión
      </Link>
    </main>
  );
}
