"use server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin, AuthError } from "@/lib/auth";
import { recordAudit } from "@/lib/audit";
import {
  adminLeaderHighlightSchema,
  adminLeaderSchema,
  fieldErrors,
  formText,
} from "@/lib/validation";
/**
 * Leadership administration: the profiles on /leadership and the dated
 * highlights that make up each person's record.
 *
 * The founders' record is the part of this site most likely to go out of date
 * and the part nobody but the business can correct — a new award, a granted
 * patent, a role that changed. Seeding it from published sources got it
 * started; this is what keeps it true without a deploy.
 */
function fail(error, fallback) {
  if (error instanceof AuthError) return { status: "error", message: error.message };
  console.error("[admin/leadership]", error);
  return { status: "error", message: fallback };
}
const bool = (formData, key) =>
  formData.get(key) === "on" || formData.get(key) === "true";
function revalidateLeadership() {
  revalidatePath("/leadership");
  revalidatePath("/admin/leadership");
}
// ------------------------------------------------------------------ leaders
export async function saveLeaderAction(_prev, formData) {
  try {
    const admin = await requireAdmin();
    const parsed = adminLeaderSchema.safeParse({
      name: formText(formData, "name"),
      role: formText(formData, "role"),
      credential: formText(formData, "credential"),
      bio: formText(formData, "bio"),
      longBio: formText(formData, "longBio"),
      quote: formText(formData, "quote"),
      imageUrl: formText(formData, "imageUrl"),
      source: formText(formData, "source"),
      sourceUrl: formText(formData, "sourceUrl"),
      isFounder: bool(formData, "isFounder"),
      position: formData.get("position") || 0,
      isActive: bool(formData, "isActive"),
    });
    if (!parsed.success) {
      return {
        status: "error",
        message: "Please check the highlighted fields.",
        errors: fieldErrors(parsed.error),
      };
    }
    const input = parsed.data;
    const data = {
      name: input.name,
      role: input.role,
      credential: input.credential || null,
      bio: input.bio || null,
      longBio: input.longBio || null,
      quote: input.quote || null,
      imageUrl: input.imageUrl || null,
      source: input.source || null,
      sourceUrl: input.sourceUrl || null,
      isFounder: input.isFounder,
      position: input.position,
      isActive: input.isActive,
    };
    const id = String(formData.get("id") ?? "");
    const record = id
      ? await prisma.leader.update({ where: { id }, data })
      : await prisma.leader.create({ data });
    // The page features exactly one founder. Promoting someone demotes whoever
    // held it, so the page cannot land in a state where it silently picks one
    // of two by position.
    if (record.isFounder) {
      await prisma.leader.updateMany({
        where: { id: { not: record.id }, isFounder: true },
        data: { isFounder: false },
      });
    }
    await recordAudit({
      actorId: admin.id,
      action: id ? "leader.updated" : "leader.created",
      entity: "Leader",
      entityId: record.id,
      meta: { name: record.name, role: record.role },
    });
    revalidateLeadership();
    return { status: "success", message: id ? "Profile updated." : "Profile added." };
  } catch (error) {
    return fail(error, "Could not save that profile.");
  }
}
export async function deleteLeaderAction(id) {
  try {
    const admin = await requireAdmin();
    const record = await prisma.leader.findUnique({
      where: { id },
      select: { name: true, role: true },
    });
    // Highlights cascade with the profile; that is the intent here, since a
    // record with no one attached has nowhere to render.
    await prisma.leader.delete({ where: { id } });
    await recordAudit({
      actorId: admin.id,
      action: "leader.deleted",
      entity: "Leader",
      entityId: id,
      meta: { name: record?.name, role: record?.role },
    });
    revalidateLeadership();
    return { ok: true };
  } catch (error) {
    if (error instanceof AuthError) return { ok: false, error: error.message };
    return { ok: false, error: "Could not delete that profile." };
  }
}
// --------------------------------------------------------------- highlights
export async function saveLeaderHighlightAction(_prev, formData) {
  try {
    const admin = await requireAdmin();
    const parsed = adminLeaderHighlightSchema.safeParse({
      leaderId: formText(formData, "leaderId"),
      kind: formData.get("kind") || "recognition",
      year: formText(formData, "year"),
      title: formText(formData, "title"),
      body: formText(formData, "body"),
      position: formData.get("position") || 0,
    });
    if (!parsed.success) {
      return {
        status: "error",
        message: "Please check the highlighted fields.",
        errors: fieldErrors(parsed.error),
      };
    }
    const input = parsed.data;
    const data = {
      leaderId: input.leaderId,
      kind: input.kind,
      year: input.year || null,
      title: input.title,
      body: input.body || null,
      position: input.position,
    };
    const id = String(formData.get("id") ?? "");
    const record = id
      ? await prisma.leaderHighlight.update({ where: { id }, data })
      : await prisma.leaderHighlight.create({ data });
    await recordAudit({
      actorId: admin.id,
      action: id ? "leaderHighlight.updated" : "leaderHighlight.created",
      entity: "LeaderHighlight",
      entityId: record.id,
      meta: { title: record.title, year: record.year },
    });
    revalidateLeadership();
    return { status: "success", message: id ? "Entry updated." : "Entry added." };
  } catch (error) {
    return fail(error, "Could not save that entry.");
  }
}
export async function deleteLeaderHighlightAction(id) {
  try {
    const admin = await requireAdmin();
    const record = await prisma.leaderHighlight.findUnique({
      where: { id },
      select: { title: true },
    });
    await prisma.leaderHighlight.delete({ where: { id } });
    await recordAudit({
      actorId: admin.id,
      action: "leaderHighlight.deleted",
      entity: "LeaderHighlight",
      entityId: id,
      meta: { title: record?.title },
    });
    revalidateLeadership();
    return { ok: true };
  } catch (error) {
    if (error instanceof AuthError) return { ok: false, error: error.message };
    return { ok: false, error: "Could not delete that entry." };
  }
}
