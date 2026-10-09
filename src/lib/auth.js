import "server-only";
import { auth, signIn, signOut } from "@/auth";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { prisma } from "./prisma";
import { signSessionToken, readSessionToken, SESSION_COOKIE_NAME, SESSION_TTL_SECONDS } from "./session";

export const getSession = async () => {
  return await auth();
};

export const getCurrentUser = async () => {
  let userId = null;

  const session = await auth();
  if (session?.user?.id) {
    userId = session.user.id;
  } else {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (token) {
      const payload = await readSessionToken(token);
      if (payload?.sub) {
        userId = payload.sub;
      }
    }
  }

  if (userId) {
    return await prisma.user.findUnique({
      where: { id: userId },
    });
  }

  return null;
};

export const hashPassword = async (password) => {
  return await bcrypt.hash(password, 12);
};

export const verifyPassword = async (password, hash) => {
  return await bcrypt.compare(password, hash);
};

export const createSession = async (payload) => {
  const token = await signSessionToken(payload);
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_TTL_SECONDS,
    path: "/",
  });
};

export const destroySession = async () => {
  const cookieStore = await cookies();
  const opts = { 
    path: "/",
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  };
  cookieStore.delete({ name: SESSION_COOKIE_NAME, ...opts });
  cookieStore.delete({ name: "authjs.session-token", ...opts });
  cookieStore.delete({ name: "__Secure-authjs.session-token", ...opts });
  cookieStore.delete({ name: "next-auth.session-token", ...opts });
  cookieStore.delete({ name: "__Secure-next-auth.session-token", ...opts });
  cookieStore.delete({ name: "authjs.callback-url", ...opts });
  cookieStore.delete({ name: "__Secure-authjs.callback-url", ...opts });
  cookieStore.delete({ name: "authjs.csrf-token", ...opts });
  cookieStore.delete({ name: "__Host-authjs.csrf-token", ...opts });
  cookieStore.delete({ name: "mt_cart", ...opts });
};

export class AuthError extends Error {
  status;
  constructor(message, status = 401) {
    super(message);
    this.status = status;
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

export async function requireFullAdmin() {
  const user = await requireAdmin();
  if (user.role !== "admin") {
    throw new AuthError("This action requires an administrator account.", 403);
  }
  return user;
}
