"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin, AuthError } from "@/lib/auth";
import { recordAudit } from "@/lib/audit";
import { fieldErrors, formText } from "@/lib/validation";
/**
 * Gallery administration: the groups on /gallery and the photographs in each.
 *
 * Files themselves are uploaded through /api/admin/upload (re-encoded, EXIF
 * stripped, recorded in Media); these actions attach the resulting URLs to a
 * group and manage order, captions and visibility.
 */
function fail(error, fallback) {
  if (error instanceof AuthError)
    return { status: "error", message: error.message };
  console.error("[admin/gallery]", error);
  return { status: "error", message: fallback };
}
const bool = (formData, key) =>
  formData.get(key) === "on" || formData.get(key) === "true";
function revalidateGallery() {
  revalidatePath("/gallery");
  revalidatePath("/admin/gallery");
}
const slugify = (value) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
const groupSchema = z.object({
  title: z.string().trim().min(1, "Give the group a title.").max(120),
  slug: z
    .string()
    .trim()
    .max(80)
    .regex(/^[a-z0-9-]*$/, "Lowercase letters, numbers and hyphens only.")
    .optional()
    .or(z.literal("")),
  lede: z.string().trim().max(600).optional().or(z.literal("")),
  position: z.coerce.number().int().min(0).max(9999),
  isActive: z.boolean(),
});
const photoSchema = z.object({
  groupId: z.string().trim().min(1, "Choose a group."),
  alt: z
    .string()
    .trim()
    .min(1, "Describe the photo — screen readers read this out.")
    .max(300),
  caption: z.string().trim().max(400).optional().or(z.literal("")),
  isActive: z.boolean(),
});
// ------------------------------------------------------------------- groups
export async function saveGalleryGroupAction(_prev, formData) {
  try {
    const admin = await requireAdmin();
    const parsed = groupSchema.safeParse({
      title: formText(formData, "title"),
      slug: formText(formData, "slug"),
      lede: formText(formData, "lede"),
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
    const id = String(formData.get("id") ?? "");
    const slug = input.slug || slugify(input.title);
    // The slug is the page anchor (/gallery#slug), so it must be unique.
    const clash = await prisma.galleryGroup.findFirst({
      where: { slug, ...(id ? { NOT: { id } } : {}) },
      select: { id: true },
    });
    if (clash) {
      return {
        status: "error",
        message: "Another group already uses that slug.",
        errors: { slug: "Choose a different slug." },
      };
    }
    const data = {
      title: input.title,
      slug,
      lede: input.lede || null,
      position: input.position,
      isActive: input.isActive,
    };
    const record = id
      ? await prisma.galleryGroup.update({ where: { id }, data })
      : await prisma.galleryGroup.create({ data });
    await recordAudit({
      actorId: admin.id,
      action: id ? "galleryGroup.updated" : "galleryGroup.created",
      entity: "GalleryGroup",
      entityId: record.id,
      meta: { title: record.title },
    });
    revalidateGallery();
    return { status: "success", message: id ? "Group updated." : "Group added." };
  } catch (error) {
    return fail(error, "Could not save that group.");
  }
}
export async function deleteGalleryGroupAction(id) {
  try {
    const admin = await requireAdmin();
    const record = await prisma.galleryGroup.findUnique({
      where: { id },
      select: { title: true },
    });
    await prisma.galleryPhoto.deleteMany({ where: { groupId: id } });
    await prisma.galleryGroup.delete({ where: { id } });
    await recordAudit({
      actorId: admin.id,
      action: "galleryGroup.deleted",
      entity: "GalleryGroup",
      entityId: id,
      meta: { title: record?.title },
    });
    revalidateGallery();
    return { ok: true };
  } catch (error) {
    if (error instanceof AuthError) return { ok: false, error: error.message };
    return { ok: false, error: "Could not delete that group." };
  }
}
// ------------------------------------------------------------------- photos
/** Attaches freshly uploaded images to the end of a group. */
export async function addGalleryPhotosAction({ groupId, photos }) {
  try {
    const admin = await requireAdmin();
    const group = await prisma.galleryGroup.findUnique({
      where: { id: groupId },
      select: { id: true, title: true },
    });
    if (!group) return { ok: false, error: "That group no longer exists." };
    const last = await prisma.galleryPhoto.findFirst({
      where: { groupId },
      orderBy: { position: "desc" },
      select: { position: true },
    });
    let position = (last?.position ?? -1) + 1;
    for (const photo of photos ?? []) {
      if (typeof photo?.url !== "string" || !photo.url.startsWith("/uploads/")) continue;
      await prisma.galleryPhoto.create({
        data: {
          groupId,
          url: photo.url,
          // A placeholder that is at least true; the admin is prompted to
          // replace it with a real description.
          alt: `Photograph — ${group.title}`,
          width: Number(photo.width) || 1600,
          height: Number(photo.height) || 1200,
          position: position++,
        },
      });
    }
    await recordAudit({
      actorId: admin.id,
      action: "galleryPhoto.added",
      entity: "GalleryGroup",
      entityId: groupId,
      meta: { count: photos?.length ?? 0 },
    });
    revalidateGallery();
    return { ok: true };
  } catch (error) {
    if (error instanceof AuthError) return { ok: false, error: error.message };
    console.error("[admin/gallery]", error);
    return { ok: false, error: "Could not add those photos." };
  }
}
export async function saveGalleryPhotoAction(_prev, formData) {
  try {
    const admin = await requireAdmin();
    const id = String(formData.get("id") ?? "");
    const parsed = photoSchema.safeParse({
      groupId: formText(formData, "groupId"),
      alt: formText(formData, "alt"),
      caption: formText(formData, "caption"),
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
    const current = await prisma.galleryPhoto.findUnique({
      where: { id },
      select: { groupId: true },
    });
    if (!current) return { status: "error", message: "That photo no longer exists." };
    const data = {
      alt: input.alt,
      caption: input.caption || null,
      isActive: input.isActive,
    };
    // Moving to another group puts the photo at the end of that group.
    if (input.groupId !== current.groupId) {
      const last = await prisma.galleryPhoto.findFirst({
        where: { groupId: input.groupId },
        orderBy: { position: "desc" },
        select: { position: true },
      });
      data.groupId = input.groupId;
      data.position = (last?.position ?? -1) + 1;
    }
    await prisma.galleryPhoto.update({ where: { id }, data });
    await recordAudit({
      actorId: admin.id,
      action: "galleryPhoto.updated",
      entity: "GalleryPhoto",
      entityId: id,
      meta: { alt: input.alt },
    });
    revalidateGallery();
    return { status: "success", message: "Photo updated." };
  } catch (error) {
    return fail(error, "Could not save that photo.");
  }
}
export async function deleteGalleryPhotoAction(id) {
  try {
    const admin = await requireAdmin();
    await prisma.galleryPhoto.delete({ where: { id } });
    await recordAudit({
      actorId: admin.id,
      action: "galleryPhoto.deleted",
      entity: "GalleryPhoto",
      entityId: id,
    });
    revalidateGallery();
    return { ok: true };
  } catch (error) {
    if (error instanceof AuthError) return { ok: false, error: error.message };
    return { ok: false, error: "Could not delete that photo." };
  }
}
export async function reorderGalleryPhotosAction(groupId, orderedIds) {
  try {
    await requireAdmin();
    if (!Array.isArray(orderedIds)) return { ok: false, error: "Bad order." };
    await prisma.$transaction(
      orderedIds.map((id, position) =>
        prisma.galleryPhoto.updateMany({
          where: { id, groupId },
          data: { position },
        }),
      ),
    );
    revalidateGallery();
    return { ok: true };
  } catch (error) {
    if (error instanceof AuthError) return { ok: false, error: error.message };
    return { ok: false, error: "Could not save the new order." };
  }
}
