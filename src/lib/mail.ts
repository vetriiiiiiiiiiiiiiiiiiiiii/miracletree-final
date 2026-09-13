import { SITE } from "@/lib/constants";

/**
 * Transactional email.
 *
 * Two rules shaped this.
 *
 * **No dependency.** Delivery goes over Resend's HTTP API with `fetch`, so
 * there is no SMTP client to install, nothing to keep patched, and it runs
 * unchanged on any Node or edge runtime. Swapping provider means rewriting one
 * function below.
 *
 * **Sending never fails the thing that triggered it.** An order is placed, then
 * an email is attempted. If the provider is down, misconfigured, or simply not
 * set up yet, `send` records the failure and returns — it does not throw. A
 * shopper losing their order because a mail API had a bad minute would be a far
 * worse bug than a missing receipt, and every caller here is on a path where
 * the real work is already committed to the database.
 *
 * With no `RESEND_API_KEY` set, mail is logged to the server console instead.
 * That keeps local development working and makes the unconfigured state loud
 * rather than silent.
 */

export type MailMessage = {
  to: string;
  subject: string;
  /** Plain text. Always sent — some clients prefer it, and it is the fallback. */
  text: string;
  html?: string;
  replyTo?: string;
};

export type MailResult = { ok: true; id?: string } | { ok: false; error: string };

function from(): string {
  return process.env.MAIL_FROM ?? `${SITE.name} <onboarding@resend.dev>`;
}

/** Where operational copies go — new orders, and anything ops must action. */
export function opsRecipient(): string | null {
  return process.env.MAIL_OPS ?? SITE.email ?? null;
}

export function mailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

export async function send(message: MailMessage): Promise<MailResult> {
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
      console.error(`[mail] ${response.status} sending "${message.subject}"`, detail.slice(0, 300));
      return { ok: false, error: `Provider returned ${response.status}` };
    }

    const body = (await response.json().catch(() => ({}))) as { id?: string };
    return { ok: true, id: body.id };
  } catch (error) {
    console.error(`[mail] failed sending "${message.subject}"`, error);
    return { ok: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

/**
 * Fire an email without making the caller wait or care.
 *
 * Used on paths where the work is already done and the email is a courtesy:
 * the order exists whether or not the receipt arrives.
 */
export function sendInBackground(message: MailMessage): void {
  void send(message).catch(() => {
    // `send` already logs; this only stops an unhandled rejection.
  });
}
