"use client";

import { useActionState, useEffect, useRef } from "react";
import {
  addBusinessPhotos,
  type BusinessPhotosFormState,
} from "@/lib/actions/business-photos";
import { submitWithoutReset } from "@/lib/submit-without-reset";

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
    <form ref={formRef} onSubmit={submitWithoutReset(formAction)} className="mt-4 flex flex-col gap-4">
      <div className="field">
        <label htmlFor="photos" className="label">
          Elegí las fotos
        </label>
        <p className="hint">PNG, JPG o WEBP. Podés elegir varias a la vez.</p>
        <input
          id="photos"
          name="photos"
          type="file"
          accept="image/png,image/jpeg,image/webp"
          multiple
          required
          className="w-full cursor-pointer rounded-xl border border-dashed border-border-strong bg-surface p-3 text-sm text-muted transition-colors hover:border-accent file:mr-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-accent-soft file:px-3.5 file:py-2 file:text-sm file:font-semibold file:text-accent"
        />
      </div>

      {state.error && (
        <p className="form-error" role="alert">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="btn btn-primary sm:self-start"
      >
        {pending ? "Subiendo..." : "Subir fotos"}
      </button>
    </form>
  );
}
