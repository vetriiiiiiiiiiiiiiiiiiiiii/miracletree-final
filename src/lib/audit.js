import "server-only";
import { prisma } from "./prisma";
import { clientIp } from "./rate-limit";
export async function recordAudit(entry) {
  try {
    await prisma.auditLog.create({
      data: {
        actorId: entry.actorId ?? null,
        action: entry.action,
        entity: entry.entity,
        entityId: entry.entityId ?? null,
        meta: entry.meta ? JSON.stringify(entry.meta).slice(0, 4000) : null,
        ip: await clientIp(),
      },
    });
  } catch {
    // Auditing must never break the operation it is recording.
  }
}
