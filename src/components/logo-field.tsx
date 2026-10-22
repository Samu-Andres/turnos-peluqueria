"use client";

import { useState } from "react";
import { ImagePlus } from "lucide-react";
import { compressImage } from "@/lib/compress-image";

export function LogoField({ currentUrl }: { currentUrl?: string | null }) {
  const [preview, setPreview] = useState<string | null>(currentUrl ?? null);

  return (
    <div className="field">
      <label htmlFor="logo" className="label">
        Logo {currentUrl ? "" : "(opcional)"}
      </label>
      <div className="flex items-center gap-3">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-dashed border-border-strong bg-surface-sunken text-muted">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="" className="h-full w-full object-cover" />
          ) : (
            <ImagePlus aria-hidden className="h-6 w-6" />
          )}
        </div>
        <input
          id="logo"
          name="logo"
          type="file"
          accept="image/png,image/jpeg,image/webp,image/svg+xml"
          onChange={async (e) => {
            const input = e.currentTarget;
            const file = input.files?.[0];
            if (!file) return;
            setPreview(URL.createObjectURL(file));

            // Un logo no necesita más de 512px: lo achicamos acá para que
            // la foto del celular no supere el límite de subida del server.
            const compressed = await compressImage(file, { maxSide: 512 });
            if (compressed !== file && typeof DataTransfer !== "undefined") {
              const transfer = new DataTransfer();
              transfer.items.add(compressed);
              input.files = transfer.files;
            }
          }}
          className="block min-w-0 flex-1 cursor-pointer text-sm text-muted file:mr-3 file:min-h-10 file:cursor-pointer file:rounded-lg file:border-0 file:bg-accent-soft file:px-3.5 file:text-sm file:font-semibold file:text-accent"
        />
      </div>
      <p className="hint">
        PNG, JPG, WEBP o SVG. Hasta 3 MB.
        {currentUrl ? " Dejalo vacío para mantener el logo actual." : ""}
      </p>
    </div>
  );
}
