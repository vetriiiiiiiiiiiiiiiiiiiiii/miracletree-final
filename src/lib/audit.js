import "server-only";
import { prisma } from "./prisma";
import { clientIp } from "./rate-limit";
export async function recordAudit(entry) {
  try {
    const isObjectId =
      typeof entry.entityId === "string" &&
      /^[0-9a-fA-F]{24}$/.test(entry.entityId);

    const metaObj = entry.meta
      ? typeof entry.meta === "object"
        ? { ...entry.meta }
        : { info: entry.meta }
      : {};

    if (!isObjectId && entry.entityId) {
      metaObj.entityKey = entry.entityId;
    }
    if (entry.summary) {
      metaObj.summary = entry.summary;
    }

    const metaString =
      Object.keys(metaObj).length > 0
        ? JSON.stringify(metaObj).slice(0, 4000)
        : null;

    await prisma.auditLog.create({
      data: {
        actorId: entry.actor?.id ?? entry.actorId ?? null,
        action: entry.action,
        entity: entry.entity,
        entityId: isObjectId ? entry.entityId : null,
        meta: metaString,
        ip: await clientIp(),
      },
    });
  } catch {
    // Auditing must never break the operation it is recording.
  }
}
