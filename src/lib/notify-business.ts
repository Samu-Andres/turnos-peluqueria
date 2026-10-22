import { createAdminClient } from "@/lib/supabase/admin";
import { formatDateTimeLongAR, formatTimeAR } from "@/lib/booking/time";

export type BookingEvent = "new" | "rescheduled" | "cancelled";

type BookingLookup = { id: string } | { token: string };

const SUBJECTS: Record<BookingEvent, string> = {
  new: "Nuevo turno",
  rescheduled: "Un cliente cambió su turno",
  cancelled: "Un cliente canceló su turno",
};

const INTROS: Record<BookingEvent, string> = {
  new: "Te reservaron un turno nuevo. Confirmalo desde la agenda para que el cliente sepa que lo esperás.",
  rescheduled: "Un cliente cambió el horario de su turno. Volvió a quedar pendiente: confirmalo desde la agenda.",
  cancelled: "Un cliente canceló su turno. Ese horario volvió a quedar libre para reservar.",
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Le avisa por mail al negocio (al dueño y, si tiene cuenta, a la persona
 * del staff asignada) que un cliente reservó, cambió o canceló un turno.
 * Usa la API de Brevo (BREVO_API_KEY + BREVO_SENDER_EMAIL); si no están
 * configuradas, no hace nada. Nunca tira error: se llama desde after(),
 * cuando el cliente ya tiene su respuesta, y un mail que falla no puede
 * romper una reserva.
 */
export async function notifyBusiness(
  lookup: BookingLookup,
  event: BookingEvent,
  siteOrigin: string
): Promise<void> {
  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.BREVO_SENDER_EMAIL;
  if (!apiKey || !senderEmail) {
    return;
  }

  try {
    const admin = createAdminClient();

    const query = admin.from("bookings").select("*");
    const { data: booking } = await ("id" in lookup
      ? query.eq("id", lookup.id)
      : query.eq("manage_token", lookup.token)
    ).maybeSingle();

    // Los turnos que carga el propio negocio no necesitan aviso.
    if (!booking || booking.source === "manual") {
      return;
    }

    const [{ data: business }, { data: staff }, { data: service }] = await Promise.all([
      admin.from("businesses").select("name, owner_id").eq("id", booking.business_id).maybeSingle(),
      admin.from("staff").select("full_name, email, user_id").eq("id", booking.staff_id).maybeSingle(),
      admin.from("services").select("name").eq("id", booking.service_id).maybeSingle(),
    ]);
    if (!business) {
      return;
    }

    // El dueño va a la agenda general; la persona del staff con cuenta, a
    // su propio panel (no puede entrar al del dueño).
    const { data: ownerData } = await admin.auth.admin.getUserById(business.owner_id);
    const ownerEmail = ownerData.user?.email?.toLowerCase();
    const recipients: { email: string; href: string }[] = [];
    if (ownerEmail) {
      recipients.push({ email: ownerEmail, href: `${siteOrigin}/dashboard/agenda` });
    }
    const staffEmail = staff?.user_id ? staff.email?.toLowerCase() : null;
    if (staffEmail && staffEmail !== ownerEmail) {
      recipients.push({ email: staffEmail, href: `${siteOrigin}/staff/turnos` });
    }
    if (recipients.length === 0) {
      return;
    }

    const when = `${formatDateTimeLongAR(booking.start_at)}, ${formatTimeAR(booking.start_at)} hs`;
    const whenLabel = when.charAt(0).toUpperCase() + when.slice(1);
    const rows: [string, string][] = [
      ["Cliente", booking.client_name ?? "Sin nombre"],
      ["Servicio", service?.name ?? "Servicio"],
      ["Cuándo", whenLabel],
    ];
    if (staff?.full_name) rows.push(["Con", staff.full_name]);
    if (booking.client_phone) rows.push(["Teléfono", booking.client_phone]);
    if (booking.client_address) rows.push(["A domicilio", booking.client_address]);
    if (booking.notes) rows.push(["Notas", booking.notes]);

    const subject = `${SUBJECTS[event]}: ${booking.client_name ?? "cliente"} · ${whenLabel}`;
    const htmlFor = (href: string) => `
<div style="background:#faf7f2;padding:24px 16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1c1917;">
  <div style="max-width:480px;margin:0 auto;background:#ffffff;border:1px solid #e8e0d4;border-radius:16px;padding:28px;">
    <p style="margin:0;font-size:13px;color:#6b6158;">${escapeHtml(business.name)}</p>
    <h1 style="margin:6px 0 12px;font-size:20px;">${SUBJECTS[event]}</h1>
    <p style="margin:0 0 20px;font-size:15px;line-height:1.5;color:#4a423b;">${INTROS[event]}</p>
    <table style="width:100%;border-collapse:collapse;font-size:15px;">
      ${rows
        .map(
          ([label, value]) =>
            `<tr><td style="padding:6px 12px 6px 0;color:#6b6158;white-space:nowrap;vertical-align:top;">${label}</td><td style="padding:6px 0;font-weight:600;">${escapeHtml(value)}</td></tr>`
        )
        .join("")}
    </table>
    <a href="${href}" style="display:inline-block;margin-top:22px;background:#0a0a0a;color:#a3e635;border:1px solid #a3e635;text-decoration:none;font-weight:600;font-size:15px;padding:12px 20px;border-radius:12px;">Abrir la agenda</a>
  </div>
</div>`;

    await Promise.all(
      recipients.map(async ({ email, href }) => {
        const response = await fetch("https://api.brevo.com/v3/smtp/email", {
          method: "POST",
          headers: {
            "api-key": apiKey,
            "content-type": "application/json",
            accept: "application/json",
          },
          body: JSON.stringify({
            sender: { name: "Turnos Peluquería", email: senderEmail },
            to: [{ email }],
            subject,
            htmlContent: htmlFor(href),
          }),
          signal: AbortSignal.timeout(8000),
        });
        if (!response.ok) {
          console.error("notifyBusiness: Brevo respondió", response.status, await response.text());
        }
      })
    );
  } catch (error) {
    console.error("notifyBusiness:", error);
  }
}
