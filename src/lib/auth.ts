import "server-only";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { cache } from "react";
import { prisma } from "./prisma";
import {
  SESSION_COOKIE_NAME,
  SESSION_TTL_SECONDS,
  signSessionToken,
  readSessionToken,
  type SessionPayload,
} from "./session";

export { SESSION_COOKIE_NAME, readSessionToken };
export type { SessionPayload };

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 12);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export async function createSession(payload: SessionPayload): Promise<void> {
  const token = await signSessionToken(payload);
  const store = await cookies();
  store.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function destroySession(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE_NAME);
}

export const getSession = cache(async (): Promise<SessionPayload | null> => {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  return readSessionToken(token);
});

/**
 * Loads the user fresh from the database. Always prefer this over the JWT claims
 * for authorization decisions — a role revoked in admin must take effect at once,
 * and an already-issued token would still carry the old one.
 */
export const getCurrentUser = cache(async () => {
  const session = await getSession();
  if (!session) return null;
  return prisma.user.findUnique({
    where: { id: session.sub },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      phone: true,
      role: true,
      marketingOptIn: true,
      createdAt: true,
    },
  });
});

export class AuthError extends Error {
  constructor(
    message: string,
    readonly status: 401 | 403 = 401,
  ) {
    super(message);
    this.name = "AuthError";
  }
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) throw new AuthError("Sign in to continue.", 401);
  return user;
}

export async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user) throw new AuthError("Sign in to continue.", 401);
  if (user.role !== "admin" && user.role !== "staff") {
    throw new AuthError("You do not have access to this area.", 403);
  }
  return user;
}

/** Destructive operations are restricted to full admins, never staff. */
export async function requireFullAdmin() {
  const user = await requireAdmin();
  if (user.role !== "admin") {
    throw new AuthError("This action requires an administrator account.", 403);
  }
  return user;
}
