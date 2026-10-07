"use client";

import { ImageIcon, Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
import { deleteBusinessPhoto } from "@/lib/actions/business-photos";
import type { BusinessPhoto } from "@/types/database";

function PhotoTile({ photo }: { photo: BusinessPhoto }) {
  const [isPending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);

  return (
    <div className="group relative overflow-hidden rounded-xl border border-border bg-surface-sunken">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={photo.url} alt="" loading="lazy" className="aspect-square w-full object-cover" />

      <div className="absolute inset-x-0 bottom-0 flex justify-end gap-1.5 bg-gradient-to-t from-black/60 to-transparent p-2 pt-8">
        {confirming ? (
          <>
            <button
              type="button"
              disabled={isPending}
              onClick={() => setConfirming(false)}
              className="btn btn-secondary btn-sm"
            >
              No
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={() => startTransition(() => deleteBusinessPhoto(photo.id))}
              className="btn btn-sm bg-danger text-white hover:bg-danger/90"
            >
              {isPending ? "Borrando..." : "Sí, borrar"}
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            aria-label="Borrar foto"
            title="Borrar foto"
            className="btn btn-secondary btn-sm !min-h-9 !px-2.5"
          >
            <Trash2 aria-hidden className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}

export function PhotoGrid({ photos }: { photos: BusinessPhoto[] }) {
  if (photos.length === 0) {
    return (
      <div className="mt-6 flex flex-col items-center rounded-2xl border border-dashed border-border-strong p-8 text-center">
        <ImageIcon aria-hidden className="h-8 w-8 text-muted" />
        <p className="mt-3 font-semibold">Todavía no subiste fotos</p>
        <p className="mt-1 text-sm text-muted">
          Los negocios con fotos generan más confianza al reservar.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
      {photos.map((photo) => (
        <PhotoTile key={photo.id} photo={photo} />
      ))}
    </div>
  );
}
