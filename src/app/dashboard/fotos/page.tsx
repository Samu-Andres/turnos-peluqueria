import Link from "next/link";
import { requireOwnerBusiness } from "@/lib/dashboard/require-owner-business";
import { PhotoGrid } from "./photo-grid";
import { PhotosForm } from "./photos-form";

export default async function FotosPage() {
  const { supabase, business } = await requireOwnerBusiness();

  const { data: photos } = await supabase
    .from("business_photos")
    .select("*")
    .eq("business_id", business.id)
    .order("created_at", { ascending: true });

  return (
    <main className="mx-auto min-h-screen max-w-2xl px-4 py-10 sm:px-6 sm:py-12">
      <Link
        href="/dashboard"
        className="text-sm text-muted underline decoration-muted/40 underline-offset-2 transition-colors hover:text-accent"
      >
        ← Volver al panel
      </Link>

      <h1 className="mt-4 text-2xl font-bold">Fotos de {business.name}</h1>
      <p className="mt-1 text-sm text-muted">
        Mostralas en tu página pública: el local, tus trabajos, lo que
        quieras que vean antes de reservar.
      </p>

      <PhotoGrid photos={photos ?? []} />

      <div className="mt-8 border-t border-border pt-8">
        <h2 className="text-lg font-semibold">Agregar fotos</h2>
        <PhotosForm />
      </div>
    </main>
  );
}
