import nodemailer from "nodemailer";
import { SITE } from "@/lib/constants";

function from() {
  return process.env.MAIL_FROM ?? `${SITE.name} <onboarding@resend.dev>`;
}

export function createTransport() {
  if (process.env.SMTP_HOST) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT ?? 587),
      secure: process.env.SMTP_SECURE === "true",
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
  }
  return null;
}

export async function sendViaSmtp(message, transport) {
  try {
    const info = await transport.sendMail({
      from: from(),
      to: message.to,
      subject: message.subject,
      text: message.text,
      html: message.html,
      replyTo: message.replyTo,
    });
    return { ok: true, id: info.messageId };
  } catch (error) {
    console.error(`[mail:smtp] failed sending "${message.subject}"`, error);
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
