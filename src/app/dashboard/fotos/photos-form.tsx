"use client";

import { useActionState, useEffect, useRef } from "react";
import {
  addBusinessPhotos,
  type BusinessPhotosFormState,
} from "@/lib/actions/business-photos";

const initialState: BusinessPhotosFormState = { error: null };

export function PhotosForm() {
  const [state, formAction, pending] = useActionState(
    addBusinessPhotos,
    initialState
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state !== initialState && !state.error) {
      formRef.current?.reset();
    }
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="mt-4 flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="photos" className="text-sm font-medium">
          Fotos (podés elegir varias)
        </label>
        <input
          id="photos"
          name="photos"
          type="file"
          accept="image/png,image/jpeg,image/webp"
          multiple
          required
          className="text-sm text-muted file:mr-3 file:rounded-lg file:border file:border-border file:bg-surface file:px-3 file:py-2 file:text-sm file:font-medium file:text-foreground"
        />
      </div>

      {state.error && (
        <p className="text-sm text-red-400" role="alert">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground shadow-sm shadow-black/30 transition-colors hover:bg-accent-hover disabled:opacity-50"
      >
        {pending ? "Subiendo..." : "Subir fotos"}
      </button>
    </form>
  );
}
