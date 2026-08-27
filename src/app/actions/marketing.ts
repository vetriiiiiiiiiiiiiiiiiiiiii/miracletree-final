"use server";

import { prisma } from "@/lib/prisma";
import { contactSchema, fieldErrors, newsletterSchema } from "@/lib/validation";
import { clientIp, pruneRateLimits, rateLimit } from "@/lib/rate-limit";
import { recordAudit } from "@/lib/audit";

export type FormState =
  | { status: "idle" }
  | { status: "success"; message: string }
  | { status: "error"; message: string; errors?: Record<string, string> };

export async function subscribeAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await pruneRateLimits();

  const parsed = newsletterSchema.safeParse({
    email: formData.get("email"),
    source: formData.get("source") ?? "site",
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Check the email address and try again.",
      errors: fieldErrors(parsed.error),
    };
  }

  const limit = await rateLimit({
    key: `newsletter:${await clientIp()}`,
    limit: 5,
    windowSeconds: 3600,
  });
  if (!limit.ok) {
    return { status: "error", message: "Too many sign-ups from this network. Try later." };
  }

  // Upsert rather than create, so re-subscribing after unsubscribing works and
  // an existing address never leaks through a duplicate-key error.
  await prisma.newsletterSubscriber.upsert({
    where: { email: parsed.data.email },
    create: { email: parsed.data.email, source: parsed.data.source, isActive: true },
    update: { isActive: true },
  });

  return { status: "success", message: "You're on the list. Watch for the next harvest note." };
}

export async function contactAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = contactSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    topic: formData.get("topic"),
    message: formData.get("message"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Please check the highlighted fields.",
      errors: fieldErrors(parsed.error),
    };
  }

  const limit = await rateLimit({
    key: `contact:${await clientIp()}`,
    limit: 5,
    windowSeconds: 3600,
  });
  if (!limit.ok) {
    return { status: "error", message: "Too many messages. Please try again later." };
  }

  // Enquiries are recorded in the audit log so nothing is lost before an email
  // integration is configured; admin can read them under Settings → Activity.
  await recordAudit({
    action: "contact.submitted",
    entity: "Contact",
    meta: parsed.data,
  });

  return {
    status: "success",
    message: "Thank you — we'll be in touch within one working day.",
  };
}
