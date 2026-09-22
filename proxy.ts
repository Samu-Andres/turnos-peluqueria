import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// Nota: en Next.js 16 "middleware.ts" pasó a llamarse "proxy.ts" (la función
// exportada también cambió de nombre, de `middleware` a `proxy`). El helper
// interno sigue viviendo en src/lib/supabase/middleware.ts porque describe
// lo que hace (refrescar la sesión de Supabase), no dónde se usa.
export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
