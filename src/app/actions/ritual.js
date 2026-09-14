"use server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import {
  availableStock,
  couponContextFor,
  ensureCart,
  evaluateCoupon,
  getCart,
} from "@/lib/cart";
import { ritualSchema } from "@/lib/validation";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { RITUAL_COUPON } from "@/lib/constants";
/**
 * Adds a built ritual to the bag in one go.
 *
 * The client sends variant ids and nothing else — no prices, no totals, no
 * discount. Everything about money is re-derived here, exactly as the ordinary
 * add-to-cart path does, because a page that lets a shopper assemble several
 * items at a quoted total is precisely where it would be tempting to trust the
 * number the browser calculated.
 *
 * Stock is checked per line before anything is written, and the whole set goes
 * in inside one transaction: a ritual half-added is worse than one refused,
 * because the shopper has no way to tell which half made it.
 */
export async function addRitualAction(input) {
  const parsed = ritualSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "That ritual could not be added." };
  const ids = [...new Set(parsed.data.variantIds)];
  if (ids.length === 0) return { ok: false, error: "Choose at least one thing first." };
  // Assembling a ritual is a handful of clicks, so a burst of these is either a
  // mis-click or a script; either way the cart does not need to see it twice.
  const limit = await rateLimit({
    key: `ritual:${await clientIp()}`,
    limit: 20,
    windowSeconds: 300,
  });
  if (!limit.ok)
    return { ok: false, error: "Too many attempts. Try again in a few minutes." };
  const variants = await prisma.productVariant.findMany({
    where: { id: { in: ids }, isActive: true, product: { status: "published" } },
    select: { id: true, productId: true, product: { select: { name: true } } },
  });
  if (variants.length !== ids.length) {
    return {
      ok: false,
      error: "One of those is no longer available. Refresh and try again.",
    };
  }
  // Every line is checked before any is written.
  for (const variant of variants) {
    const stock = await availableStock(variant.id);
    if (stock <= 0) {
      return {
        ok: false,
        error: `${variant.product.name} has just gone out of stock.`,
      };
    }
  }
  const cart = await ensureCart();
  await prisma.$transaction(async (tx) => {
    for (const variant of variants) {
      await tx.cartItem.upsert({
        where: { cartId_variantId: { cartId: cart.id, variantId: variant.id } },
        create: {
          cartId: cart.id,
          productId: variant.productId,
          variantId: variant.id,
          quantity: 1,
        },
        update: { quantity: { increment: 1 } },
      });
    }
    await tx.cart.update({ where: { id: cart.id }, data: { updatedAt: new Date() } });
  });
  // Attach the promotion if the basket now actually qualifies. Judged by the
  // same evaluator the cart uses, so nothing is promised here that checkout
  // will then decline — and if an admin has retired the code, this simply does
  // nothing rather than inventing a discount.
  let applied;
  const coupon = await prisma.coupon.findUnique({ where: { code: RITUAL_COUPON } });
  if (coupon) {
    const fresh = await getCart();
    const check = evaluateCoupon(coupon, await couponContextFor(coupon, fresh));
    if (check.ok) {
      await prisma.cart.update({
        where: { id: cart.id },
        data: { couponId: coupon.id },
      });
      applied = coupon.code;
    }
  }
  revalidatePath("/", "layout");
  return {
    ok: true,
    message:
      variants.length === 1
        ? "Added to your bag."
        : `${variants.length} items added to your bag.`,
    applied,
  };
}
