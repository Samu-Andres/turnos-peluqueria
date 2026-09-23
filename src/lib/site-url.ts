import { headers } from "next/headers";

/**
 * Origin absoluto del sitio (con protocolo), para armar links que se
 * mandan por mail (invitaciones, recuperar contraseña) y que Supabase
 * no puede completar solo. Si está seteada NEXT_PUBLIC_SITE_URL se usa
 * esa (recomendado en producción); si no, se arma a partir de los
 * headers del request actual (anda bien en desarrollo local).
 */
export async function getSiteOrigin(): Promise<string> {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  }
  const headersList = await headers();
  const host =
    headersList.get("x-forwarded-host") ?? headersList.get("host") ?? "localhost:3000";
  const proto = headersList.get("x-forwarded-proto") ?? "http";
  return `${proto}://${host}`;
}
