"use server";

import { redirect } from "next/navigation";
import { randomBytes, createHash } from "node:crypto";
import { prisma } from "@/lib/prisma";
import {
  createSession,
  destroySession,
  getCurrentUser,
  hashPassword,
  verifyPassword,
} from "@/lib/auth";
import { ensureCart } from "@/lib/cart";
import {
  fieldErrors,
  forgotPasswordSchema,
  loginSchema,
  profileSchema,
  registerSchema,
  resetPasswordSchema,
} from "@/lib/validation";
import { clientIp, pruneRateLimits, rateLimit } from "@/lib/rate-limit";
import { recordAudit } from "@/lib/audit";
import type { Role } from "@/lib/constants";

export type AuthState =
  | { status: "idle" }
  | { status: "success"; message?: string }
  | { status: "error"; message: string; errors?: Record<string, string> };

/** Only same-origin, path-relative destinations are honoured after sign-in. */
function safeNext(value: FormDataEntryValue | null, fallback: string): string {
  const next = typeof value === "string" ? value : "";
  if (!next.startsWith("/") || next.startsWith("//")) return fallback;
  return next;
}

export async function registerAction(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  await pruneRateLimits();

  const parsed = registerSchema.safeParse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    email: formData.get("email"),
    password: formData.get("password"),
    marketingOptIn: formData.get("marketingOptIn") === "on",
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Please check the highlighted fields.",
      errors: fieldErrors(parsed.error),
    };
  }

  const limit = await rateLimit({
    key: `register:${await clientIp()}`,
    limit: 6,
    windowSeconds: 3600,
  });
  if (!limit.ok) {
    return { status: "error", message: "Too many sign-ups from this network. Try later." };
  }

  const existing = await prisma.user.findUnique({
    where: { email: parsed.data.email },
    select: { id: true },
  });
  if (existing) {
    return {
      status: "error",
      message: "An account already exists with that email.",
      errors: { email: "Try signing in instead." },
    };
  }

  const user = await prisma.user.create({
    data: {
      email: parsed.data.email,
      passwordHash: await hashPassword(parsed.data.password),
      firstName: parsed.data.firstName,
      lastName: parsed.data.lastName || null,
      marketingOptIn: parsed.data.marketingOptIn,
      // New accounts are always customers. Elevation happens only in admin.
      role: "customer",
    },
    select: { id: true, email: true, role: true },
  });

  if (parsed.data.marketingOptIn) {
    await prisma.newsletterSubscriber.upsert({
      where: { email: parsed.data.email },
      create: { email: parsed.data.email, source: "registration", isActive: true },
      update: { isActive: true },
    });
  }

  await createSession({ sub: user.id, email: user.email, role: user.role as Role });
  // Claims the anonymous cart the visitor was already filling.
  await ensureCart();
  await recordAudit({ actorId: user.id, action: "auth.register", entity: "User", entityId: user.id });

  redirect(safeNext(formData.get("next"), "/account"));
}

export async function loginAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { status: "error", message: "Enter your email and password." };
  }

  // Throttled per address *and* per account, so neither a single IP nor a
  // distributed attempt on one account gets unlimited guesses.
  const ip = await clientIp();
  const [byIp, byAccount] = await Promise.all([
    rateLimit({ key: `login-ip:${ip}`, limit: 15, windowSeconds: 900 }),
    rateLimit({ key: `login-acct:${parsed.data.email}`, limit: 8, windowSeconds: 900 }),
  ]);

  if (!byIp.ok || !byAccount.ok) {
    return {
      status: "error",
      message: "Too many attempts. Please wait a few minutes and try again.",
    };
  }

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email },
    select: { id: true, email: true, role: true, passwordHash: true },
  });

  // The same message for both branches, so the form cannot be used to discover
  // which addresses have accounts.
  const invalid: AuthState = {
    status: "error",
    message: "That email and password don't match.",
  };

  if (!user) {
    // Burn comparable time on a dummy hash to avoid a timing oracle.
    await verifyPassword(parsed.data.password, DUMMY_HASH);
    return invalid;
  }

  if (!(await verifyPassword(parsed.data.password, user.passwordHash))) {
    await recordAudit({ action: "auth.login_failed", entity: "User", entityId: user.id });
    return invalid;
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  await createSession({ sub: user.id, email: user.email, role: user.role as Role });
  await ensureCart();
  await recordAudit({ actorId: user.id, action: "auth.login", entity: "User", entityId: user.id });

  const fallback = user.role === "admin" || user.role === "staff" ? "/admin" : "/account";
  redirect(safeNext(formData.get("next"), fallback));
}

/** A real bcrypt hash of an unusable password, used only for timing parity. */
const DUMMY_HASH = "$2b$12$C6UzMDM.H6dfI/f/IKcEeO3G6zGvUgKO6ZQyE3dOoqvxG8VmOZ0.C";

export async function logoutAction(): Promise<void> {
  const user = await getCurrentUser();
  if (user) {
    await recordAudit({ actorId: user.id, action: "auth.logout", entity: "User", entityId: user.id });
  }
  await destroySession();
  redirect("/");
}

export async function forgotPasswordAction(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = forgotPasswordSchema.safeParse({ email: formData.get("email") });

  // The confirmation is identical whether or not the account exists.
  const generic: AuthState = {
    status: "success",
    message:
      "If an account exists for that address, a reset link is on its way. Check your inbox.",
  };

  if (!parsed.success) return generic;

  const limit = await rateLimit({
    key: `reset:${await clientIp()}`,
    limit: 5,
    windowSeconds: 3600,
  });
  if (!limit.ok) return generic;

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email },
    select: { id: true },
  });
  if (!user) return generic;

  const token = randomBytes(32).toString("base64url");
  // Only the hash is stored, so a database leak cannot be replayed as a reset.
  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      tokenHash: createHash("sha256").update(token).digest("hex"),
      expiresAt: new Date(Date.now() + 1000 * 60 * 60),
    },
  });

  await recordAudit({
    actorId: user.id,
    action: "auth.reset_requested",
    entity: "User",
    entityId: user.id,
  });

  // Delivery is intentionally left to the operator's email provider. Until one
  // is wired up, the link is logged server-side rather than shown to the client.
  if (process.env.NODE_ENV !== "production") {
    console.info(
      `[password reset] ${process.env.NEXT_PUBLIC_SITE_URL}/reset-password?token=${token}`,
    );
  }

  return generic;
}

export async function resetPasswordAction(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = resetPasswordSchema.safeParse({
    token: formData.get("token"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Please choose a stronger password.",
      errors: fieldErrors(parsed.error),
    };
  }

  const tokenHash = createHash("sha256").update(parsed.data.token).digest("hex");
  const record = await prisma.passwordResetToken.findUnique({
    where: { tokenHash },
    select: { id: true, userId: true, expiresAt: true, usedAt: true },
  });

  if (!record || record.usedAt || record.expiresAt < new Date()) {
    return { status: "error", message: "That reset link has expired. Request a new one." };
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: record.userId },
      data: { passwordHash: await hashPassword(parsed.data.password) },
    }),
    prisma.passwordResetToken.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    }),
    // Every other outstanding link for this account is invalidated too.
    prisma.passwordResetToken.deleteMany({
      where: { userId: record.userId, usedAt: null },
    }),
  ]);

  await recordAudit({
    actorId: record.userId,
    action: "auth.password_reset",
    entity: "User",
    entityId: record.userId,
  });

  redirect("/login?reset=1");
}

export async function updateProfileAction(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const user = await getCurrentUser();
  if (!user) return { status: "error", message: "Sign in to continue." };

  const parsed = profileSchema.safeParse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    phone: formData.get("phone"),
    marketingOptIn: formData.get("marketingOptIn") === "on",
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Please check the highlighted fields.",
      errors: fieldErrors(parsed.error),
    };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      firstName: parsed.data.firstName,
      lastName: parsed.data.lastName || null,
      phone: parsed.data.phone || null,
      marketingOptIn: parsed.data.marketingOptIn,
    },
  });

  return { status: "success", message: "Your details have been saved." };
}
