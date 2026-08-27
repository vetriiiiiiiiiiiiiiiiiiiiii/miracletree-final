"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { fieldErrors, reviewSchema } from "@/lib/validation";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import type { FormState } from "@/app/actions/marketing";

/**
 * Review submission.
 *
 * Everything arrives as `pending` and appears only once a moderator approves
 * it — no review is ever auto-published, and none are ever generated. The
 * "verified" flag is set from order history, not from a checkbox.
 */
export async function submitReviewAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await getCurrentUser();

  const parsed = reviewSchema.safeParse({
    productId: formData.get("productId"),
    rating: formData.get("rating"),
    title: formData.get("title"),
    body: formData.get("body"),
    authorName:
      formData.get("authorName") ||
      [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
      undefined,
    authorEmail: formData.get("authorEmail") || user?.email || undefined,
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Please check the highlighted fields.",
      errors: fieldErrors(parsed.error),
    };
  }

  const limit = await rateLimit({
    key: `review:${user?.id ?? (await clientIp())}`,
    limit: 5,
    windowSeconds: 86400,
  });
  if (!limit.ok) {
    return { status: "error", message: "You've submitted several reviews today already." };
  }

  const product = await prisma.product.findFirst({
    where: { id: parsed.data.productId, status: "published" },
    select: { id: true, slug: true },
  });
  if (!product) return { status: "error", message: "That product is unavailable." };

  if (user) {
    const existing = await prisma.review.findFirst({
      where: { productId: product.id, userId: user.id },
      select: { id: true },
    });
    if (existing) {
      return {
        status: "error",
        message: "You've already reviewed this product. Contact us to change it.",
      };
    }
  }

  // Verified only when this account has actually received this product.
  const verified = user
    ? Boolean(
        await prisma.orderItem.findFirst({
          where: {
            productId: product.id,
            order: { userId: user.id, status: "delivered" },
          },
          select: { id: true },
        }),
      )
    : false;

  await prisma.review.create({
    data: {
      productId: product.id,
      userId: user?.id ?? null,
      authorName: parsed.data.authorName,
      authorEmail: parsed.data.authorEmail ?? null,
      rating: parsed.data.rating,
      title: parsed.data.title || null,
      body: parsed.data.body,
      status: "pending",
      isVerified: verified,
    },
  });

  revalidatePath(`/product/${product.slug}`);

  return {
    status: "success",
    message: "Thank you. Your review will appear once it has been checked.",
  };
}
