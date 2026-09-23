import Link from "next/link";
import { requireStaffSelf } from "@/lib/dashboard/require-staff-access";
import { signOut } from "@/lib/actions/auth";

export default async function StaffHomePage() {
  const { business, staff } = await requireStaffSelf();

  return (
    <main className="mx-auto min-h-screen max-w-2xl px-4 py-10 sm:px-6 sm:py-12">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted">
          Hola, {staff.full_name} · {business.name}
        </p>
        <form action={signOut}>
          <button
            type="submit"
            className="text-sm font-medium text-muted underline"
          >
            Cerrar sesión
          </button>
        </form>
      </div>

      <h1 className="text-2xl font-bold">Tu panel</h1>

      <div className="mt-8 flex flex-col gap-3">
        <Link
          href="/staff/turnos"
          className="rounded-lg border border-border bg-surface px-4 py-3 text-sm font-medium transition-colors hover:border-border-strong hover:text-accent"
        >
          Tus turnos →
        </Link>
        <Link
          href="/staff/horarios"
          className="rounded-lg border border-border bg-surface px-4 py-3 text-sm font-medium transition-colors hover:border-border-strong hover:text-accent"
        >
          Tus horarios →
        </Link>
      </div>
    </main>
  );
}
