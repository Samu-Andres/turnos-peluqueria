"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSiteOrigin } from "@/lib/site-url";
import type { ProfileRole } from "@/types/database";

export type AuthFormState = {
  error: string | null;
};

function homeForRole(role: ProfileRole | null | undefined): string {
  if (role === "owner") return "/dashboard";
  if (role === "staff") return "/staff";
  return "/";
}

function readRole(value: FormDataEntryValue | null): ProfileRole {
  return value === "owner" ? "owner" : "client";
}

function readBusinessType(value: FormDataEntryValue | null): "local" | "domicilio" {
  return value === "domicilio" ? "domicilio" : "local";
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
  const businessType = readBusinessType(formData.get("business_type"));
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

  // A un/a dueño/a le preguntamos, ya en el signup, si tiene local o
  // trabaja a domicilio. Esa elección todavía no se puede guardar en
  // ningún lado (el negocio ni existe), así que viaja como query param
  // hasta /dashboard, donde el formulario de "crear negocio" la usa para
  // dejar "Atiendo a domicilio" tildado de entrada.
  const ownerNext =
    role === "owner" ? `/dashboard?tipo=${businessType}` : "/";
  const effectiveNext = next ?? ownerNext;

  // Si el proyecto de Supabase tiene "Confirm email" activado, signUp no
  // devuelve sesión hasta que el usuario confirma desde el mail. El "next"
  // no sobrevive ese viaje por mail de forma confiable, así que lo
  // llevamos como query param hasta la pantalla de "revisá tu email", que
  // a su vez se lo pasa al login: ahí sí se termina de respetar.
  if (!data.session) {
    const query = `?next=${encodeURIComponent(effectiveNext)}`;
    redirect(`/signup/revisa-tu-email${query}`);
  }

  redirect(effectiveNext);
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

  redirect(homeForRole(profile?.role));
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}


/**
 * Pide el mail de recuperación de contraseña. Por seguridad, siempre
 * termina en la misma pantalla de "revisá tu email" exista o no ese
 * mail registrado (así no se puede usar este form para averiguar qué
 * emails están dados de alta).
 */
export async function requestPasswordReset(
  _prevState: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const email = String(formData.get("email") ?? "").trim();

  if (!email) {
    return { error: "Poné tu email." };
  }

  const supabase = await createClient();
  const origin = await getSiteOrigin();

  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/confirm?next=${encodeURIComponent("/reset-password")}`,
  });

  redirect("/recuperar-password/revisa-tu-email");
}

/**
 * Define la nueva contraseña. Solo funciona si hay una sesión de
 * recuperación activa (la crea /auth/confirm al verificar el link que
 * mandó requestPasswordReset).
 */
export async function updatePassword(
  _prevState: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const password = String(formData.get("password") ?? "");

  if (password.length < 6) {
    return { error: "La contraseña tiene que tener al menos 6 caracteres." };
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      error:
        "El link expiró o no es válido. Pedí uno nuevo desde 'Olvidé mi contraseña'.",
    };
  }

  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    return { error: error.message };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  redirect(homeForRole(profile?.role));
}
