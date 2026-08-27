"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin, AuthError } from "@/lib/auth";
import { recordAudit } from "@/lib/audit";
import {
  adminAccoladeSchema,
  adminCreditSchema,
  adminMilestoneSchema,
  fieldErrors,
  formText,
} from "@/lib/validation";
import type { FormState } from "@/app/actions/marketing";

/**
 * Our Story administration: the timeline, the awards shelf, and the credits.
 *
 * These three were seeded and then only editable through Prisma Studio, which
 * is not something to hand to the person who actually knows whether an award
 * year is right. Everything the page renders is a row, and every row is
 * editable here.
 *
 * `/about` is revalidated after each write because the page is statically
 * rendered — without it a correction would not appear until the next deploy.
 */

function fail(error: unknown, fallback: string): FormState {
  if (error instanceof AuthError) return { status: "error", message: error.message };
  console.error("[admin/story]", error);
  return { status: "error", message: fallback };
}

const bool = (formData: FormData, key: string) =>
  formData.get(key) === "on" || formData.get(key) === "true";

/** Both the story page and this screen read these rows, so refresh the pair. */
function revalidateStory() {
  revalidatePath("/about");
  revalidatePath("/admin/story");
}

// ---------------------------------------------------------------- milestones

export async function saveMilestoneAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  try {
    const admin = await requireAdmin();

    const parsed = adminMilestoneSchema.safeParse({
      year: formText(formData, "year"),
      title: formText(formData, "title"),
      body: formText(formData, "body"),
      source: formText(formData, "source"),
      sourceUrl: formText(formData, "sourceUrl"),
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
      year: input.year,
      title: input.title,
      body: input.body || null,
      source: input.source || null,
      sourceUrl: input.sourceUrl || null,
      position: input.position,
      isActive: input.isActive,
    };

    const id = String(formData.get("id") ?? "");
    const record = id
      ? await prisma.milestone.update({ where: { id }, data })
      : await prisma.milestone.create({ data });

    await recordAudit({
      actorId: admin.id,
      action: id ? "milestone.updated" : "milestone.created",
      entity: "Milestone",
      entityId: record.id,
      meta: { year: record.year, title: record.title },
    });

    revalidateStory();
    return { status: "success", message: id ? "Milestone updated." : "Milestone added." };
  } catch (error) {
    return fail(error, "Could not save that milestone.");
  }
}

export async function deleteMilestoneAction(
  id: string,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const admin = await requireAdmin();
    const record = await prisma.milestone.findUnique({
      where: { id },
      select: { year: true, title: true },
    });

    await prisma.milestone.delete({ where: { id } });
    await recordAudit({
      actorId: admin.id,
      action: "milestone.deleted",
      entity: "Milestone",
      entityId: id,
      meta: { year: record?.year, title: record?.title },
    });

    revalidateStory();
    return { ok: true };
  } catch (error) {
    if (error instanceof AuthError) return { ok: false, error: error.message };
    return { ok: false, error: "Could not delete that milestone." };
  }
}

// ---------------------------------------------------------------- accolades

export async function saveAccoladeAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  try {
    const admin = await requireAdmin();

    const parsed = adminAccoladeSchema.safeParse({
      kind: formData.get("kind") || "award",
      title: formText(formData, "title"),
      issuer: formText(formData, "issuer"),
      year: formText(formData, "year"),
      body: formText(formData, "body"),
      source: formText(formData, "source"),
      sourceUrl: formText(formData, "sourceUrl"),
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

    // An award a reader cannot trace is a liability on a food brand's page, so
    // a named source has to come with somewhere to go and check it.
    if (input.source && !input.sourceUrl) {
      return {
        status: "error",
        message: "Add a link for that source.",
        errors: { sourceUrl: "A cited claim needs somewhere a reader can verify it." },
      };
    }

    const data = {
      kind: input.kind,
      title: input.title,
      issuer: input.issuer || null,
      year: input.year || null,
      body: input.body || null,
      source: input.source || null,
      sourceUrl: input.sourceUrl || null,
      position: input.position,
      isActive: input.isActive,
    };

    const id = String(formData.get("id") ?? "");
    const record = id
      ? await prisma.accolade.update({ where: { id }, data })
      : await prisma.accolade.create({ data });

    await recordAudit({
      actorId: admin.id,
      action: id ? "accolade.updated" : "accolade.created",
      entity: "Accolade",
      entityId: record.id,
      meta: { title: record.title, kind: record.kind },
    });

    revalidateStory();
    return { status: "success", message: id ? "Recognition updated." : "Recognition added." };
  } catch (error) {
    return fail(error, "Could not save that recognition.");
  }
}

export async function deleteAccoladeAction(
  id: string,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const admin = await requireAdmin();
    const record = await prisma.accolade.findUnique({
      where: { id },
      select: { title: true },
    });

    await prisma.accolade.delete({ where: { id } });
    await recordAudit({
      actorId: admin.id,
      action: "accolade.deleted",
      entity: "Accolade",
      entityId: id,
      meta: { title: record?.title },
    });

    revalidateStory();
    return { ok: true };
  } catch (error) {
    if (error instanceof AuthError) return { ok: false, error: error.message };
    return { ok: false, error: "Could not delete that recognition." };
  }
}

// ---------------------------------------------------------------- credits

export async function saveCreditAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  try {
    const admin = await requireAdmin();

    const parsed = adminCreditSchema.safeParse({
      name: formText(formData, "name"),
      role: formText(formData, "role"),
      body: formText(formData, "body"),
      group: formData.get("group") || "team",
      url: formText(formData, "url"),
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
      body: input.body || null,
      group: input.group,
      url: input.url || null,
      position: input.position,
      isActive: input.isActive,
    };

    const id = String(formData.get("id") ?? "");
    const record = id
      ? await prisma.credit.update({ where: { id }, data })
      : await prisma.credit.create({ data });

    await recordAudit({
      actorId: admin.id,
      action: id ? "credit.updated" : "credit.created",
      entity: "Credit",
      entityId: record.id,
      meta: { name: record.name, group: record.group },
    });

    revalidateStory();
    return { status: "success", message: id ? "Credit updated." : "Credit added." };
  } catch (error) {
    return fail(error, "Could not save that credit.");
  }
}

export async function deleteCreditAction(
  id: string,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const admin = await requireAdmin();
    const record = await prisma.credit.findUnique({
      where: { id },
      select: { name: true },
    });

    await prisma.credit.delete({ where: { id } });
    await recordAudit({
      actorId: admin.id,
      action: "credit.deleted",
      entity: "Credit",
      entityId: id,
      meta: { name: record?.name },
    });

    revalidateStory();
    return { ok: true };
  } catch (error) {
    if (error instanceof AuthError) return { ok: false, error: error.message };
    return { ok: false, error: "Could not delete that credit." };
  }
}
