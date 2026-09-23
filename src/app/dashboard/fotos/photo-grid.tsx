"use client";

import { useState, useTransition } from "react";
import { deleteBusinessPhoto } from "@/lib/actions/business-photos";
import type { BusinessPhoto } from "@/types/database";

function PhotoTile({ photo }: { photo: BusinessPhoto }) {
  const [isPending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);

  return (
    <div className="flex flex-col gap-2">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={photo.url}
        alt=""
        className="h-28 w-full rounded-lg border border-border object-cover"
      />

      {confirming ? (
        <div className="flex items-center gap-2 text-xs">
          <button
            type="button"
            disabled={isPending}
            onClick={() => startTransition(() => deleteBusinessPhoto(photo.id))}
            className="font-medium text-red-400 underline disabled:opacity-60"
          >
            Confirmar
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={() => setConfirming(false)}
            className="text-muted underline"
          >
            Cancelar
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="self-start text-xs text-muted underline decoration-muted/40 underline-offset-2 hover:text-accent"
        >
          Borrar
        </button>
      )}
    </div>
  );
}

export function PhotoGrid({ photos }: { photos: BusinessPhoto[] }) {
  if (photos.length === 0) {
    return (
      <p className="mt-6 text-sm text-muted">Todavía no subiste ninguna foto.</p>
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
