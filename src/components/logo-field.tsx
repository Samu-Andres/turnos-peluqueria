"use client";

import { useState } from "react";

export function LogoField({ currentUrl }: { currentUrl?: string | null }) {
  const [preview, setPreview] = useState<string | null>(currentUrl ?? null);

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor="logo" className="text-sm font-medium">
        Logo {currentUrl ? "" : "(opcional)"}
      </label>
      <div className="flex items-center gap-3">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-surface">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="px-1 text-center text-[10px] leading-tight text-muted">
              Sin logo
            </span>
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
          className="block flex-1 text-sm text-muted file:mr-3 file:rounded-lg file:border file:border-border file:bg-surface file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-foreground file:transition-colors hover:file:border-accent"
        />
      </div>
      <p className="text-xs text-muted">
        PNG, JPG, WEBP o SVG. Hasta 3 MB.
        {currentUrl ? " Dejalo vacío para mantener el logo actual." : ""}
      </p>
    </div>
  );
}
