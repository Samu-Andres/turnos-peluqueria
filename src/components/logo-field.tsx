"use client";

import { useState } from "react";
import { ImagePlus } from "lucide-react";

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
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              setPreview(URL.createObjectURL(file));
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
