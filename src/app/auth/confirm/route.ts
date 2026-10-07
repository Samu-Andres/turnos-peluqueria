import { type EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Ruta a la que apuntan los links que manda Supabase por mail (confirmar
 * cuenta, invitación de staff, recuperar contraseña). Acepta los dos
 * formatos que puede usar Supabase:
 * - token_hash + type: si el template del mail apunta directo acá.
 * - code: el que usa el template por defecto ({{ .ConfirmationURL }}),
 *   después de que Supabase ya verificó el mail de su lado.
 * Ver: https://supabase.com/docs/guides/auth/server-side/email-based-auth-with-pkce-flow-for-ssr
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const code = searchParams.get("code");
  const next = safeNextPath(searchParams.get("next"));

  const supabase = await createClient();

  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash });
    if (!error) {
      return NextResponse.redirect(new URL(next, request.url));
    }
  }

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(new URL(next, request.url));
    }
    // Supabase solo manda un code si ya verificó el mail. Si no pudimos
    // armar la sesión (típico: abrió el mail en otro navegador o en el
    // celular), la cuenta igual quedó confirmada: solo falta entrar.
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("confirmado", "1");
    loginUrl.searchParams.set("next", next);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.redirect(new URL("/login?error=confirmacion", request.url));
}

function safeNextPath(value: string | null): string {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("://")) {
    return "/";
  }
  return value;
}
