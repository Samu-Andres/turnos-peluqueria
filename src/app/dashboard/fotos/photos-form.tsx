"use client";

import { useRef, useState, useTransition, type FormEvent } from "react";
import { addBusinessPhotos } from "@/lib/actions/business-photos";
import { compressImage } from "@/lib/compress-image";

/**
 * Sube las fotos de a una, ya achicadas en el navegador: así cada pedido
 * queda muy por debajo del límite de las acciones del servidor aunque
 * elijan varias fotos del celular juntas.
 */
export function PhotosForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const input = event.currentTarget.elements.namedItem("photos") as HTMLInputElement;
    const files = Array.from(input.files ?? []);
    if (files.length === 0) {
      setError("Elegí al menos una foto.");
      return;
    }

    setError(null);
    startTransition(async () => {
      for (const [index, original] of files.entries()) {
        setProgress(
          files.length > 1
            ? `Subiendo ${index + 1} de ${files.length}...`
            : "Subiendo..."
        );
        const file = await compressImage(original, { maxSide: 1600 });
        const formData = new FormData();
        formData.append("photos", file);
        const result = await addBusinessPhotos({ error: null }, formData);
        if (result.error) {
          setError(
            index > 0
              ? `Se subieron ${index} de ${files.length}. ${result.error}`
              : result.error
          );
          setProgress(null);
          return;
        }
      }
      setProgress(null);
      formRef.current?.reset();
    });
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="mt-4 flex flex-col gap-4">
      <div className="field">
        <label htmlFor="photos" className="label">
          Elegí las fotos
        </label>
        <p className="hint">
          PNG, JPG o WEBP. Podés elegir varias a la vez, también directo desde
          el celular.
        </p>
        <input
          id="photos"
          name="photos"
          type="file"
          accept="image/png,image/jpeg,image/webp"
          multiple
          required
          disabled={isPending}
          className="w-full cursor-pointer rounded-xl border border-dashed border-border-strong bg-surface p-3 text-sm text-muted transition-colors hover:border-accent file:mr-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-accent-soft file:px-3.5 file:py-2 file:text-sm file:font-semibold file:text-accent"
        />
      </div>

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="btn btn-primary sm:self-start"
      >
        {isPending ? progress ?? "Subiendo..." : "Subir fotos"}
      </button>
    </form>
  );
}
