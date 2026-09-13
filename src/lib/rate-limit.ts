import "server-only";
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { prisma } from "./prisma";

/**
 * Database-backed fixed-window rate limiter. Chosen over an in-memory map so the
 * limit survives serverless cold starts and holds across instances.
 */
export async function rateLimit(options: {
  key: string;
  limit: number;
  windowSeconds: number;
}): Promise<{ ok: boolean; remaining: number; retryAfter: number }> {
  const { key, limit, windowSeconds } = options;
  const now = new Date();
  const expiresAt = new Date(now.getTime() + windowSeconds * 1000);

  const existing = await prisma.rateLimit.findUnique({ where: { id: key } });

  if (!existing || existing.expiresAt < now) {
    await prisma.rateLimit.upsert({
      where: { id: key },
      create: { id: key, count: 1, expiresAt },
      update: { count: 1, expiresAt },
    });
    return { ok: true, remaining: limit - 1, retryAfter: 0 };
  }

  if (existing.count >= limit) {
    return {
      ok: false,
      remaining: 0,
      retryAfter: Math.ceil((existing.expiresAt.getTime() - now.getTime()) / 1000),
    };
  }

  const updated = await prisma.rateLimit.update({
    where: { id: key },
    data: { count: { increment: 1 } },
  });

  return { ok: true, remaining: Math.max(0, limit - updated.count), retryAfter: 0 };
}

export async function clientIp(): Promise<string> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return h.get("x-real-ip") ?? "unknown";
}

/** Opportunistically clears expired rows so the table does not grow unbounded. */
export async function pruneRateLimits(): Promise<void> {
  if (Math.random() > 0.02) return;
  await prisma.rateLimit.deleteMany({ where: { expiresAt: { lt: new Date() } } });
}

/**
 * Rate-limits a route handler by client IP.
 *
 * Returns a ready-to-send 429 when the caller is over budget, or null to carry
 * on — so a handler guards itself in two lines:
 *
 *   const limited = await limitRoute({ name: "search", limit: 60, windowSeconds: 60 });
 *   if (limited) return limited;
 *
 * `Retry-After` is set because it is the header clients actually honour, and a
 * limiter that does not say when to come back just invites a tight retry loop.
 */
export async function limitRoute(options: {
  name: string;
  limit: number;
  windowSeconds: number;
  /** Overrides the IP as the bucket key — e.g. an admin's user id. */
  subject?: string;
}): Promise<NextResponse | null> {
  const subject = options.subject ?? (await clientIp());
  const result = await rateLimit({
    key: `${options.name}:${subject}`,
    limit: options.limit,
    windowSeconds: options.windowSeconds,
  });

  void pruneRateLimits();

  if (result.ok) return null;

  return NextResponse.json(
    { error: "Too many requests." },
    {
      status: 429,
      headers: {
        "Retry-After": String(Math.max(1, result.retryAfter)),
        "Cache-Control": "no-store",
      },
    },
  );
}
