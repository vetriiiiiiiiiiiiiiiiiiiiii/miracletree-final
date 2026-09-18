"use server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin, requireFullAdmin, AuthError } from "@/lib/auth";
import { recordAudit } from "@/lib/audit";
import { sanitizeHtml } from "@/lib/sanitize";
import { readingMinutes, slugify } from "@/lib/utils";
import {
  adminArticleSchema,
  adminCategorySchema,
  adminCouponSchema,
  adminFaqSchema,
  adminNavItemSchema,
  adminReviewModerationSchema,
  adminSectionSchema,
  adminTestimonialSchema,
  adminUserRoleSchema,
  fieldErrors,
} from "@/lib/validation";
import { rupeesToPaise } from "@/lib/money";
/**
 * Content, promotions, reviews and settings administration.
 *
 * All of it exists so the business can change what the site says without a
 * developer — homepage copy, navigation, FAQs, testimonials, articles, coupons
 * and policies are database rows, not code.
 */
function fail(error, fallback) {
  if (error instanceof AuthError) return { status: "error", message: error.message };
  console.error("[admin/content]", error);
  return { status: "error", message: fallback };
}
const bool = (formData, key) =>
  formData.get(key) === "on" || formData.get(key) === "true";
const parseDate = (value) => (value ? new Date(value) : null);
// ---------------------------------------------------------------- homepage
export async function saveSectionAction(_prev, formData) {
  try {
    const admin = await requireAdmin();
    // The section editor has no Body field, so `body` is absent from the form
    // rather than empty. `formData.get` answers null for an absent field, and
    // null satisfies none of the schema's branches — so every save failed
    // validation and reported "check the highlighted fields" against a field
    // the operator could not see. Absent means "leave it alone", which is not
    // the same as an empty string, so the update below skips it entirely.
    const submittedBody = formData.get("body");
    const parsed = adminSectionSchema.safeParse({
      key: formData.get("key"),
      title: formData.get("title"),
      subtitle: formData.get("subtitle"),
      body: submittedBody ?? "",
      ctaLabel: formData.get("ctaLabel"),
      ctaHref: formData.get("ctaHref"),
      mediaUrl: formData.get("mediaUrl"),
      data: formData.get("data"),
      isActive: bool(formData, "isActive"),
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
    // The JSON blob is operator-authored; reject it rather than store something
    // the homepage will choke on.
    if (input.data) {
      try {
        JSON.parse(input.data);
      } catch {
        return {
          status: "error",
          message: "The extra data field must be valid JSON.",
          errors: { data: "Invalid JSON." },
        };
      }
    }
    await prisma.homepageSection.upsert({
      where: { key: input.key },
      create: {
        key: input.key,
        kind: input.key,
        title: input.title || null,
        subtitle: input.subtitle || null,
        body: submittedBody === null ? null : sanitizeHtml(input.body) || null,
        ctaLabel: input.ctaLabel || null,
        ctaHref: input.ctaHref || null,
        mediaUrl: input.mediaUrl || null,
        data: input.data || null,
        isActive: input.isActive,
        position: input.position,
      },
      update: {
        title: input.title || null,
        subtitle: input.subtitle || null,
        ...(submittedBody === null
          ? {}
          : { body: sanitizeHtml(input.body) || null }),
        ctaLabel: input.ctaLabel || null,
        ctaHref: input.ctaHref || null,
        mediaUrl: input.mediaUrl || null,
        data: input.data || null,
        isActive: input.isActive,
        position: input.position,
      },
    });
    await recordAudit({
      actorId: admin.id,
      action: "section.updated",
      entity: "HomepageSection",
      entityId: input.key,
    });
    revalidatePath("/");
    revalidatePath("/admin/content");
    return { status: "success", message: "Section saved." };
  } catch (error) {
    return fail(error, "Could not save that section.");
  }
}
export async function reorderSectionsAction(orderedKeys) {
  try {
    await requireAdmin();
    await prisma.$transaction(
      orderedKeys.map((key, position) =>
        prisma.homepageSection.updateMany({ where: { key }, data: { position } }),
      ),
    );
    revalidatePath("/");
    revalidatePath("/admin/content");
    return { ok: true };
  } catch (error) {
    if (error instanceof AuthError) return { ok: false, error: error.message };
    return { ok: false, error: "Could not reorder the sections." };
  }
}
export async function toggleSectionAction(key, isActive) {
  try {
    await requireAdmin();
    await prisma.homepageSection.update({ where: { key }, data: { isActive } });
    revalidatePath("/");
    revalidatePath("/admin/content");
    return { ok: true };
  } catch (error) {
    if (error instanceof AuthError) return { ok: false, error: error.message };
    return { ok: false, error: "Could not update that section." };
  }
}
// ---------------------------------------------------------------- navigation
export async function saveNavItemAction(_prev, formData) {
  try {
    await requireAdmin();
    const parsed = adminNavItemSchema.safeParse({
      label: formData.get("label"),
      href: formData.get("href"),
      group: formData.get("group"),
      position: formData.get("position") || 0,
      isActive: bool(formData, "isActive"),
    });
    if (!parsed.success) {
      return {
        status: "error",
        message: "Please check the link fields.",
        errors: fieldErrors(parsed.error),
      };
    }
    const id = String(formData.get("id") ?? "");
    if (id) {
      await prisma.navigationItem.update({ where: { id }, data: parsed.data });
    } else {
      await prisma.navigationItem.create({ data: parsed.data });
    }
    revalidatePath("/", "layout");
    revalidatePath("/admin/content/navigation");
    return { status: "success", message: "Link saved." };
  } catch (error) {
    return fail(error, "Could not save that link.");
  }
}
export async function deleteNavItemAction(id) {
  try {
    await requireAdmin();
    await prisma.navigationItem.delete({ where: { id } });
    revalidatePath("/", "layout");
    revalidatePath("/admin/content/navigation");
    return { ok: true };
  } catch (error) {
    if (error instanceof AuthError) return { ok: false, error: error.message };
    return { ok: false, error: "Could not delete that link." };
  }
}
// ---------------------------------------------------------------- faqs
export async function saveFaqAction(_prev, formData) {
  try {
    await requireAdmin();
    const parsed = adminFaqSchema.safeParse({
      question: formData.get("question"),
      answer: formData.get("answer"),
      category: formData.get("category"),
      productId: formData.get("productId"),
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
    const id = String(formData.get("id") ?? "");
    const data = {
      question: parsed.data.question,
      answer: parsed.data.answer,
      category: parsed.data.category,
      productId: parsed.data.productId || null,
      position: parsed.data.position,
      isActive: parsed.data.isActive,
    };
    if (id) await prisma.faq.update({ where: { id }, data });
    else await prisma.faq.create({ data });
    revalidatePath("/faq");
    revalidatePath("/admin/content/faqs");
    return { status: "success", message: "Question saved." };
  } catch (error) {
    return fail(error, "Could not save that question.");
  }
}
export async function deleteFaqAction(id) {
  try {
    await requireAdmin();
    await prisma.faq.delete({ where: { id } });
    revalidatePath("/faq");
    revalidatePath("/admin/content/faqs");
    return { ok: true };
  } catch (error) {
    if (error instanceof AuthError) return { ok: false, error: error.message };
    return { ok: false, error: "Could not delete that question." };
  }
}
// ---------------------------------------------------------------- testimonials
export async function saveTestimonialAction(_prev, formData) {
  try {
    await requireAdmin();
    const parsed = adminTestimonialSchema.safeParse({
      authorName: formData.get("authorName"),
      location: formData.get("location"),
      body: formData.get("body"),
      rating: formData.get("rating") || 5,
      imageUrl: formData.get("imageUrl"),
      isActive: bool(formData, "isActive"),
      position: formData.get("position") || 0,
    });
    if (!parsed.success) {
      return {
        status: "error",
        message: "Please check the highlighted fields.",
        errors: fieldErrors(parsed.error),
      };
    }
    const id = String(formData.get("id") ?? "");
    const data = {
      authorName: parsed.data.authorName,
      location: parsed.data.location || null,
      body: parsed.data.body,
      rating: parsed.data.rating,
      imageUrl: parsed.data.imageUrl || null,
      isActive: parsed.data.isActive,
      position: parsed.data.position,
    };
    if (id) await prisma.testimonial.update({ where: { id }, data });
    else await prisma.testimonial.create({ data });
    revalidatePath("/");
    revalidatePath("/admin/content/testimonials");
    return { status: "success", message: "Testimonial saved." };
  } catch (error) {
    return fail(error, "Could not save that testimonial.");
  }
}
export async function deleteTestimonialAction(id) {
  try {
    await requireAdmin();
    await prisma.testimonial.delete({ where: { id } });
    revalidatePath("/");
    revalidatePath("/admin/content/testimonials");
    return { ok: true };
  } catch (error) {
    if (error instanceof AuthError) return { ok: false, error: error.message };
    return { ok: false, error: "Could not delete that testimonial." };
  }
}
// ---------------------------------------------------------------- articles
export async function saveArticleAction(_prev, formData) {
  try {
    const admin = await requireAdmin();
    const title = String(formData.get("title") ?? "");
    const parsed = adminArticleSchema.safeParse({
      title,
      slug: String(formData.get("slug") ?? "") || slugify(title),
      excerpt: formData.get("excerpt"),
      content: formData.get("content"),
      heroImageUrl: formData.get("heroImageUrl"),
      authorName: formData.get("authorName") || "Miracle Tree",
      categoryId: formData.get("categoryId"),
      tags: formData.get("tags"),
      status: formData.get("status"),
      seoTitle: formData.get("seoTitle"),
      seoDescription: formData.get("seoDescription"),
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
    const clash = await prisma.article.findFirst({
      where: { slug: input.slug, ...(id ? { NOT: { id } } : {}) },
      select: { id: true },
    });
    if (clash) {
      return {
        status: "error",
        message: "Another article already uses that URL slug.",
        errors: { slug: "Choose a different slug." },
      };
    }
    const content = sanitizeHtml(input.content);
    const data = {
      title: input.title,
      slug: input.slug,
      excerpt: input.excerpt || null,
      content,
      heroImageUrl: input.heroImageUrl || null,
      authorName: input.authorName,
      categoryId: input.categoryId || null,
      tags: input.tags || null,
      status: input.status,
      readingMinutes: readingMinutes(content),
      seoTitle: input.seoTitle || null,
      seoDescription: input.seoDescription || null,
    };
    if (id) {
      const existing = await prisma.article.findUnique({
        where: { id },
        select: { publishedAt: true },
      });
      await prisma.article.update({
        where: { id },
        data: {
          ...data,
          publishedAt:
            input.status === "published" ? (existing?.publishedAt ?? new Date()) : null,
        },
      });
    } else {
      await prisma.article.create({
        data: {
          ...data,
          publishedAt: input.status === "published" ? new Date() : null,
        },
      });
    }
    await recordAudit({
      actorId: admin.id,
      action: id ? "article.updated" : "article.created",
      entity: "Article",
      entityId: id || null,
      meta: { title: input.title, status: input.status },
    });
    revalidatePath("/journal");
    revalidatePath(`/journal/${input.slug}`);
    revalidatePath("/admin/journal");
    return { status: "success", message: "Article saved." };
  } catch (error) {
    return fail(error, "Could not save that article.");
  }
}
export async function deleteArticleAction(id) {
  try {
    const admin = await requireFullAdmin();
    const article = await prisma.article.findUnique({
      where: { id },
      select: { slug: true, title: true },
    });
    await prisma.article.delete({ where: { id } });
    await recordAudit({
      actorId: admin.id,
      action: "article.deleted",
      entity: "Article",
      entityId: id,
      meta: { title: article?.title },
    });
    revalidatePath("/journal");
    revalidatePath("/admin/journal");
    return { ok: true };
  } catch (error) {
    if (error instanceof AuthError) return { ok: false, error: error.message };
    return { ok: false, error: "Could not delete that article." };
  }
}
// ---------------------------------------------------------------- categories
export async function saveCategoryAction(_prev, formData) {
  try {
    await requireAdmin();
    const name = String(formData.get("name") ?? "");
    const parsed = adminCategorySchema.safeParse({
      name,
      slug: String(formData.get("slug") ?? "") || slugify(name),
      description: formData.get("description"),
      imageUrl: formData.get("imageUrl"),
      position: formData.get("position") || 0,
      isActive: bool(formData, "isActive"),
      seoTitle: formData.get("seoTitle"),
      seoDescription: formData.get("seoDescription"),
    });
    if (!parsed.success) {
      return {
        status: "error",
        message: "Please check the highlighted fields.",
        errors: fieldErrors(parsed.error),
      };
    }
    const id = String(formData.get("id") ?? "");
    const data = {
      name: parsed.data.name,
      slug: parsed.data.slug,
      description: parsed.data.description || null,
      imageUrl: parsed.data.imageUrl || null,
      position: parsed.data.position,
      isActive: parsed.data.isActive,
      seoTitle: parsed.data.seoTitle || null,
      seoDescription: parsed.data.seoDescription || null,
    };
    if (id) await prisma.category.update({ where: { id }, data });
    else await prisma.category.create({ data });
    revalidatePath("/shop");
    revalidatePath("/admin/content/categories");
    return { status: "success", message: "Category saved." };
  } catch (error) {
    return fail(error, "Could not save that category.");
  }
}
export async function deleteCategoryAction(id) {
  try {
    await requireFullAdmin();
    // Products would be orphaned rather than deleted, so require the category
    // to be emptied first — it is the safer of the two surprises.
    const count = await prisma.product.count({ where: { categoryId: id } });
    if (count > 0) {
      return {
        ok: false,
        error: `${count} product${count === 1 ? " is" : "s are"} still in this category. Move them first, or hide the category instead of deleting it.`,
      };
    }
    await prisma.category.delete({ where: { id } });
    revalidatePath("/shop");
    revalidatePath("/admin/content/categories");
    return { ok: true };
  } catch (error) {
    if (error instanceof AuthError) return { ok: false, error: error.message };
    return { ok: false, error: "Could not delete that category." };
  }
}
// ---------------------------------------------------------------- coupons
export async function saveCouponAction(_prev, formData) {
  try {
    const admin = await requireAdmin();
    const parsed = adminCouponSchema.safeParse({
      code: formData.get("code"),
      description: formData.get("description"),
      kind: formData.get("kind"),
      value: formData.get("value"),
      minSubtotal: formData.get("minSubtotal") || 0,
      maxDiscount: formData.get("maxDiscount") || null,
      appliesTo: formData.get("appliesTo") || "all",
      appliesToIds: formData.get("appliesToIds"),
      usageLimit: formData.get("usageLimit") || null,
      perUserLimit: formData.get("perUserLimit") || null,
      startsAt: formData.get("startsAt"),
      endsAt: formData.get("endsAt"),
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
    if (input.kind === "percentage" && input.value > 100) {
      return {
        status: "error",
        message: "A percentage discount cannot exceed 100.",
        errors: { value: "Enter a value between 1 and 100." },
      };
    }
    const id = String(formData.get("id") ?? "");
    const clash = await prisma.coupon.findFirst({
      where: { code: input.code, ...(id ? { NOT: { id } } : {}) },
      select: { id: true },
    });
    if (clash) {
      return {
        status: "error",
        message: "That code already exists.",
        errors: { code: "Choose a different code." },
      };
    }
    const data = {
      code: input.code,
      description: input.description || null,
      kind: input.kind,
      // Percentages are stored as-is; fixed amounts convert rupees to paise.
      value:
        input.kind === "percentage"
          ? Math.round(input.value)
          : rupeesToPaise(input.value),
      minSubtotal: rupeesToPaise(input.minSubtotal),
      maxDiscount: input.maxDiscount ? rupeesToPaise(input.maxDiscount) : null,
      appliesTo: input.appliesTo,
      appliesToIds: input.appliesToIds || null,
      usageLimit: input.usageLimit ?? null,
      perUserLimit: input.perUserLimit ?? null,
      startsAt: parseDate(input.startsAt),
      endsAt: parseDate(input.endsAt),
      isActive: input.isActive,
    };
    if (id) await prisma.coupon.update({ where: { id }, data });
    else await prisma.coupon.create({ data });
    await recordAudit({
      actorId: admin.id,
      action: id ? "coupon.updated" : "coupon.created",
      entity: "Coupon",
      entityId: id || null,
      meta: { code: input.code },
    });
    revalidatePath("/admin/promotions");
    return { status: "success", message: "Discount saved." };
  } catch (error) {
    return fail(error, "Could not save that discount.");
  }
}
export async function deleteCouponAction(id) {
  try {
    const admin = await requireAdmin();
    const coupon = await prisma.coupon.findUnique({
      where: { id },
      select: { code: true, usageCount: true },
    });
    // A redeemed coupon is part of the order record; deactivate rather than delete.
    if (coupon && coupon.usageCount > 0) {
      await prisma.coupon.update({ where: { id }, data: { isActive: false } });
      revalidatePath("/admin/promotions");
      return { ok: true };
    }
    await prisma.coupon.delete({ where: { id } });
    await recordAudit({
      actorId: admin.id,
      action: "coupon.deleted",
      entity: "Coupon",
      entityId: id,
      meta: { code: coupon?.code },
    });
    revalidatePath("/admin/promotions");
    return { ok: true };
  } catch (error) {
    if (error instanceof AuthError) return { ok: false, error: error.message };
    return { ok: false, error: "Could not delete that discount." };
  }
}
// ---------------------------------------------------------------- reviews
export async function moderateReviewAction(input) {
  try {
    const admin = await requireAdmin();
    const parsed = adminReviewModerationSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: "Invalid moderation request." };
    const review = await prisma.review.update({
      where: { id: parsed.data.reviewId },
      data: {
        ...(parsed.data.status ? { status: parsed.data.status } : {}),
        ...(parsed.data.isFeatured !== undefined
          ? { isFeatured: parsed.data.isFeatured }
          : {}),
        ...(parsed.data.isVerified !== undefined
          ? { isVerified: parsed.data.isVerified }
          : {}),
      },
      select: { id: true, product: { select: { slug: true } } },
    });
    await recordAudit({
      actorId: admin.id,
      action: "review.moderated",
      entity: "Review",
      entityId: review.id,
      meta: parsed.data,
    });
    revalidatePath("/admin/reviews");
    revalidatePath(`/product/${review.product.slug}`);
    revalidatePath("/");
    return { ok: true };
  } catch (error) {
    if (error instanceof AuthError) return { ok: false, error: error.message };
    return { ok: false, error: "Could not moderate that review." };
  }
}
export async function deleteReviewAction(id) {
  try {
    const admin = await requireFullAdmin();
    const review = await prisma.review.findUnique({
      where: { id },
      select: { product: { select: { slug: true } } },
    });
    await prisma.review.delete({ where: { id } });
    await recordAudit({
      actorId: admin.id,
      action: "review.deleted",
      entity: "Review",
      entityId: id,
    });
    revalidatePath("/admin/reviews");
    if (review) revalidatePath(`/product/${review.product.slug}`);
    return { ok: true };
  } catch (error) {
    if (error instanceof AuthError) return { ok: false, error: error.message };
    return { ok: false, error: "Could not delete that review." };
  }
}
// ---------------------------------------------------------------- customers
export async function setUserRoleAction(input) {
  try {
    const admin = await requireFullAdmin();
    const parsed = adminUserRoleSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: "Invalid role." };
    // Nobody may remove their own admin access — that is how a store ends up
    // with no administrators at all.
    if (parsed.data.userId === admin.id && parsed.data.role !== "admin") {
      return { ok: false, error: "You cannot change your own role." };
    }
    if (parsed.data.role !== "admin") {
      const admins = await prisma.user.count({ where: { role: "admin" } });
      const target = await prisma.user.findUnique({
        where: { id: parsed.data.userId },
        select: { role: true },
      });
      if (target?.role === "admin" && admins <= 1) {
        return { ok: false, error: "This is the only administrator account." };
      }
    }
    await prisma.user.update({
      where: { id: parsed.data.userId },
      data: { role: parsed.data.role },
    });
    await recordAudit({
      actorId: admin.id,
      action: "user.role_changed",
      entity: "User",
      entityId: parsed.data.userId,
      meta: { role: parsed.data.role },
    });
    revalidatePath("/admin/customers");
    return { ok: true };
  } catch (error) {
    if (error instanceof AuthError) return { ok: false, error: error.message };
    return { ok: false, error: "Could not change that role." };
  }
}
export async function addCustomerNoteAction(userId, body) {
  try {
    const admin = await requireAdmin();
    const trimmed = body.trim().slice(0, 1000);
    if (!trimmed) return { ok: false, error: "Write something first." };
    await prisma.customerNote.create({
      data: { userId, body: trimmed, authorId: admin.id },
    });
    revalidatePath(`/admin/customers/${userId}`);
    return { ok: true };
  } catch (error) {
    if (error instanceof AuthError) return { ok: false, error: error.message };
    return { ok: false, error: "Could not save that note." };
  }
}
// ---------------------------------------------------------------- settings
export async function saveSettingsAction(_prev, formData) {
  try {
    const admin = await requireAdmin();
    const entries = [];
    for (const [key, value] of formData.entries()) {
      if (typeof value !== "string") continue;
      if (!/^[a-zA-Z0-9._-]{2,80}$/.test(key)) continue;
      entries.push([key, value.slice(0, 20000)]);
    }
    if (!entries.length) return { status: "error", message: "Nothing to save." };
    await prisma.$transaction(
      entries.map(([key, value]) =>
        prisma.siteSetting.upsert({
          where: { key },
          create: {
            key,
            // Policy bodies are rich text and must be sanitised like any other.
            value: key.startsWith("policy.") ? sanitizeHtml(value) : value,
          },
          update: {
            value: key.startsWith("policy.") ? sanitizeHtml(value) : value,
          },
        }),
      ),
    );
    await recordAudit({
      actorId: admin.id,
      action: "settings.updated",
      entity: "SiteSetting",
      meta: { keys: entries.map(([k]) => k) },
    });
    revalidatePath("/", "layout");
    return { status: "success", message: "Settings saved." };
  } catch (error) {
    return fail(error, "Could not save those settings.");
  }
}
export async function saveAnnouncementAction(_prev, formData) {
  try {
    await requireAdmin();
    const message = String(formData.get("message") ?? "")
      .trim()
      .slice(0, 200);
    if (message.length < 3) {
      return { status: "error", message: "Write the announcement text." };
    }
    const id = String(formData.get("id") ?? "");
    const data = {
      message,
      href: String(formData.get("href") ?? "").trim() || null,
      isActive: bool(formData, "isActive"),
      startsAt: parseDate(String(formData.get("startsAt") ?? "")),
      endsAt: parseDate(String(formData.get("endsAt") ?? "")),
      position: Number(formData.get("position") ?? 0) || 0,
    };
    if (id) await prisma.announcement.update({ where: { id }, data });
    else await prisma.announcement.create({ data });
    revalidatePath("/", "layout");
    revalidatePath("/admin/content/announcements");
    return { status: "success", message: "Announcement saved." };
  } catch (error) {
    return fail(error, "Could not save that announcement.");
  }
}
export async function deleteAnnouncementAction(id) {
  try {
    await requireAdmin();
    await prisma.announcement.delete({ where: { id } });
    revalidatePath("/", "layout");
    revalidatePath("/admin/content/announcements");
    return { ok: true };
  } catch (error) {
    if (error instanceof AuthError) return { ok: false, error: error.message };
    return { ok: false, error: "Could not delete that announcement." };
  }
}
