import type { Metadata } from "next";
import Link from "next/link";
import { requireOwnerBusiness } from "@/lib/dashboard/require-owner-business";
import { PhotoGrid } from "./photo-grid";
import { PhotosForm } from "./photos-form";

export const metadata: Metadata = { title: "Fotos" };

export default async function FotosPage() {
  const { supabase, business } = await requireOwnerBusiness();

  const { data: photos } = await supabase
    .from("business_photos")
    .select("*")
    .eq("business_id", business.id)
    .order("created_at", { ascending: true });

  return (
    <main className="page">
      <Link
        href="/dashboard"
        className="back-link"
      >
        ← Volver al panel
      </Link>

      <h1 className="page-title mt-4">Fotos de {business.name}</h1>
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
