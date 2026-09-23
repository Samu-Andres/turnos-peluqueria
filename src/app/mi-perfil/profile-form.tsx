"use client";

import { useActionState } from "react";
import { updateProfile, type ProfileFormState } from "@/lib/actions/profile";
import type { Profile } from "@/types/database";

const initialState: ProfileFormState = { error: null };

export function ProfileForm({ profile }: { profile: Profile | null }) {
  const [state, formAction, pending] = useActionState(updateProfile, initialState);
  const justSaved = state !== initialState && !state.error;

  return (
    <form action={formAction} className="mt-6 flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="full_name" className="text-sm font-medium">
          Nombre completo
        </label>
        <input
          id="full_name"
          name="full_name"
          type="text"
          required
          defaultValue={profile?.full_name ?? ""}
          className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted/50 focus:border-accent focus:ring-1 focus:ring-accent/30"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="phone" className="text-sm font-medium">
          Teléfono
        </label>
        <input
          id="phone"
          name="phone"
          type="tel"
          defaultValue={profile?.phone ?? ""}
          placeholder="Para precargarlo al reservar un turno"
          className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted/50 focus:border-accent focus:ring-1 focus:ring-accent/30"
        />
      </div>

      {state.error && (
        <p className="text-sm text-red-400" role="alert">
          {state.error}
        </p>
      )}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground shadow-sm shadow-black/30 transition-colors hover:bg-accent-hover disabled:opacity-50"
        >
          {pending ? "Guardando..." : "Guardar cambios"}
        </button>
        {justSaved && (
          <span className="text-sm text-emerald-400">¡Guardado!</span>
        )}
      </div>
    </form>
  );
}
