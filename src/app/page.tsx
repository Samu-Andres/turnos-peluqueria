import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center gap-6 px-6 text-center">
      <h1 className="text-3xl font-bold sm:text-4xl">Turnos Peluquería</h1>
      <p className="max-w-md text-neutral-500">
        Reservá tu turno online en la peluquería que elijas, o si tenés un
        local, administrá tus servicios, tu staff y tus turnos en un solo
        lugar.
      </p>

      <div className="flex gap-3">
        <Link
          href="/signup"
          className="rounded-md bg-neutral-900 px-5 py-2.5 text-sm font-semibold text-white"
        >
          Crear cuenta
        </Link>
        <Link
          href="/login"
          className="rounded-md border border-neutral-300 px-5 py-2.5 text-sm font-semibold text-neutral-900"
        >
          Iniciar sesión
        </Link>
      </div>
    </main>
  );
}
