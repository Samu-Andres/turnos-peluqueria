"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { ProfileRole } from "@/types/database";

export type AuthFormState = {
  error: string | null;
};

function readRole(value: FormDataEntryValue | null): ProfileRole {
  return value === "owner" ? "owner" : "client";
}

/**
 * Lee el campo "next" del form y lo valida como un path relativo seguro
 * (nunca una URL absoluta ni protocol-relative), para evitar mandar al
 * usuario, después de loguearse, a un sitio que no sea el nuestro.
 */
function safeNextPath(value: FormDataEntryValue | null): string | null {
  if (typeof value !== "string" || value.length === 0) {
    return null;
  }
  if (!value.startsWith("/") || value.startsWith("//")) {
    return null;
  }
  if (value.includes("://")) {
    return null;
  }
  return value;
}

export async function signUp(
  _prevState: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const fullName = String(formData.get("full_name") ?? "").trim();
  const role = readRole(formData.get("role"));
  const next = safeNextPath(formData.get("next"));

  if (!email || !password || !fullName) {
    return { error: "Completá todos los campos." };
  }
  if (password.length < 6) {
    return { error: "La contraseña tiene que tener al menos 6 caracteres." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName, role },
    },
  });

  if (error) {
    return { error: error.message };
  }

  // Si el proyecto de Supabase tiene "Confirm email" activado, signUp no
  // devuelve sesión hasta que el usuario confirma desde el mail. El "next"
  // no sobrevive ese viaje por mail de forma confiable, así que lo
  // llevamos como query param hasta la pantalla de "revisá tu email", que
  // a su vez se lo pasa al login: ahí sí se termina de respetar.
  if (!data.session) {
    const query = next ? `?next=${encodeURIComponent(next)}` : "";
    redirect(`/signup/revisa-tu-email${query}`);
  }

  redirect(next ?? (role === "owner" ? "/dashboard" : "/"));
}

export async function signIn(
  _prevState: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = safeNextPath(formData.get("next"));

  if (!email || !password) {
    return { error: "Completá email y contraseña." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: "Email o contraseña incorrectos." };
  }

  if (next) {
    redirect(next);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", data.user.id)
    .single();

  redirect(profile?.role === "owner" ? "/dashboard" : "/");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
