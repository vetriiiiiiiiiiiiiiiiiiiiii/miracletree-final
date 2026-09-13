import { SITE } from "@/lib/constants";
function from() {
  return process.env.MAIL_FROM ?? `${SITE.name} <onboarding@resend.dev>`;
}
/** Where operational copies go — new orders, and anything ops must action. */
export function opsRecipient() {
  return process.env.MAIL_OPS ?? SITE.email ?? null;
}
export function mailConfigured() {
  return Boolean(process.env.RESEND_API_KEY);
}
export async function send(message) {
  if (!mailConfigured()) {
    // Loud in development, harmless in production. The subject and recipient
    // are enough to confirm the trigger fired without dumping personal data
    // into the logs.
    console.info(`[mail:unconfigured] → ${message.to} — ${message.subject}`);
    return { ok: false, error: "RESEND_API_KEY is not set" };
  }
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: from(),
        to: [message.to],
        subject: message.subject,
        text: message.text,
        ...(message.html ? { html: message.html } : {}),
        ...(message.replyTo ? { reply_to: message.replyTo } : {}),
      }),
      // A hung mail API must not hold a checkout response open.
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.error(
        `[mail] ${response.status} sending "${message.subject}"`,
        detail.slice(0, 300),
      );
      return { ok: false, error: `Provider returned ${response.status}` };
    }
    const body = await response.json().catch(() => ({}));
    return { ok: true, id: body.id };
  } catch (error) {
    console.error(`[mail] failed sending "${message.subject}"`, error);
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
/**
 * Fire an email without making the caller wait or care.
 *
 * Used on paths where the work is already done and the email is a courtesy:
 * the order exists whether or not the receipt arrives.
 */
export function sendInBackground(message) {
  void send(message).catch(() => {
    // `send` already logs; this only stops an unhandled rejection.
  });
}
