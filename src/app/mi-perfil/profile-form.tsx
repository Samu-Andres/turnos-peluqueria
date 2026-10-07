"use client";

import { useActionState } from "react";
import { updateProfile, type ProfileFormState } from "@/lib/actions/profile";
import type { Profile } from "@/types/database";
import { submitWithoutReset } from "@/lib/submit-without-reset";

const initialState: ProfileFormState = { error: null };

export function ProfileForm({ profile }: { profile: Profile | null }) {
  const [state, formAction, pending] = useActionState(updateProfile, initialState);
  const justSaved = state !== initialState && !state.error;

  return (
    <form onSubmit={submitWithoutReset(formAction)} className="card mt-6 flex flex-col gap-5 p-5 sm:p-6">
      <div className="field">
        <label htmlFor="full_name" className="label">
          Nombre completo
        </label>
        <input
          id="full_name"
          name="full_name"
          type="text"
          required
          defaultValue={profile?.full_name ?? ""}
          className="input"
        />
      </div>

      <div className="field">
        <label htmlFor="phone" className="label">
          Teléfono
        </label>
        <input
          id="phone"
          name="phone"
          type="tel"
          defaultValue={profile?.phone ?? ""}
          placeholder="Para precargarlo al reservar un turno"
          className="input"
        />
      </div>

      {state.error && (
        <p className="form-error" role="alert">
          {state.error}
        </p>
      )}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="btn btn-primary"
        >
          {pending ? "Guardando..." : "Guardar cambios"}
        </button>
        {justSaved && (
          <span className="text-sm text-success">¡Guardado!</span>
        )}
      </div>
    </form>
  );
}
