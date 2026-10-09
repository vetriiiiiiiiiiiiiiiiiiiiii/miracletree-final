import { SITE } from "@/lib/constants";
import { createTransport, sendViaSmtp } from "@/lib/mail-transport";
import { enqueueMail } from "@/lib/mail-queue";

function from() {
  return process.env.MAIL_FROM ?? `${SITE.name} <onboarding@resend.dev>`;
}
/** Where operational copies go — new orders, and anything ops must action. */
export function opsRecipient() {
  return process.env.MAIL_OPS ?? SITE.email ?? null;
}
export function mailConfigured() {
  return Boolean(process.env.RESEND_API_KEY || process.env.SMTP_HOST);
}

const transport = createTransport();

export async function send(message) {
  if (transport) {
    return sendViaSmtp(message, transport);
  }

  if (!process.env.RESEND_API_KEY) {
    // Loud in development, harmless in production. The subject and recipient
    // are enough to confirm the trigger fired without dumping personal data
    // into the logs.
    console.info(`[mail:unconfigured] → ${message.to} — ${message.subject}`);
    return { ok: false, error: "Neither SMTP_HOST nor RESEND_API_KEY is set" };
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
 * Fire an email by enqueueing it to the database for the worker to process.
 *
 * Used on paths where the work is already done and the email is a courtesy:
 * the order exists whether or not the receipt arrives.
 */
export function sendInBackground(message) {
  void enqueueMail(message).catch((error) => {
    console.error("[mail] failed to enqueue", error);
  });
}
