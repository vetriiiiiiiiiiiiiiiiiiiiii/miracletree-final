"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { availableStock, couponContextFor, ensureCart, evaluateCoupon, getCart } from "@/lib/cart";
import { cartAddSchema, cartUpdateSchema, couponSchema } from "@/lib/validation";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export type ActionResult = { ok: true; message?: string } | { ok: false; error: string };

/**
 * Cart mutations. Prices and stock are always re-read from the database here —
 * the client sends ids and quantities, never money.
 */

export async function addToCartAction(input: {
  productId: string;
  variantId: string;
  quantity?: number;
}): Promise<ActionResult> {
  const parsed = cartAddSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "That product could not be added." };

  const { productId, variantId, quantity } = parsed.data;

  const variant = await prisma.productVariant.findFirst({
    where: { id: variantId, productId, isActive: true, product: { status: "published" } },
    select: { id: true, name: true, product: { select: { name: true } } },
  });
  if (!variant) return { ok: false, error: "That option is no longer available." };

  const cart = await ensureCart();
  const existing = await prisma.cartItem.findUnique({
    where: { cartId_variantId: { cartId: cart.id, variantId } },
  });

  const desired = (existing?.quantity ?? 0) + quantity;
  const stock = await availableStock(variantId);

  if (stock <= 0) return { ok: false, error: `${variant.product.name} is out of stock.` };
  if (desired > stock) {
    return {
      ok: false,
      error:
        existing
          ? `Only ${stock} left — you already have ${existing.quantity} in your bag.`
          : `Only ${stock} left in stock.`,
    };
  }

  await prisma.cartItem.upsert({
    where: { cartId_variantId: { cartId: cart.id, variantId } },
    create: { cartId: cart.id, productId, variantId, quantity },
    update: { quantity: desired },
  });
  await prisma.cart.update({ where: { id: cart.id }, data: { updatedAt: new Date() } });

  revalidatePath("/", "layout");
  return { ok: true, message: `${variant.product.name} added to your bag.` };
}

export async function updateCartItemAction(input: {
  itemId: string;
  quantity: number;
}): Promise<ActionResult> {
  const parsed = cartUpdateSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "That quantity isn't valid." };

  const { itemId, quantity } = parsed.data;
  const cart = await ensureCart();

  // Scoping the lookup by cartId is what stops one shopper editing another's bag.
  const item = await prisma.cartItem.findFirst({
    where: { id: itemId, cartId: cart.id },
    select: { id: true, variantId: true },
  });
  if (!item) return { ok: false, error: "That item is no longer in your bag." };

  if (quantity === 0) {
    await prisma.cartItem.delete({ where: { id: item.id } });
    revalidatePath("/", "layout");
    return { ok: true, message: "Removed from your bag." };
  }

  const stock = await availableStock(item.variantId);
  if (quantity > stock) return { ok: false, error: `Only ${stock} left in stock.` };

  await prisma.cartItem.update({ where: { id: item.id }, data: { quantity } });
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function removeCartItemAction(itemId: string): Promise<ActionResult> {
  return updateCartItemAction({ itemId, quantity: 0 });
}

export async function applyCouponAction(code: string): Promise<ActionResult> {
  const parsed = couponSchema.safeParse({ code });
  if (!parsed.success) return { ok: false, error: "Enter a valid code." };

  // Coupon guessing is the one cart endpoint worth throttling.
  const limit = await rateLimit({
    key: `coupon:${await clientIp()}`,
    limit: 12,
    windowSeconds: 300,
  });
  if (!limit.ok) {
    return { ok: false, error: "Too many attempts. Try again in a few minutes." };
  }

  const coupon = await prisma.coupon.findUnique({ where: { code: parsed.data.code } });
  if (!coupon) return { ok: false, error: "We don't recognise that code." };

  const cart = await getCart();
  const check = evaluateCoupon(coupon, await couponContextFor(coupon, cart));
  if (!check.ok) return { ok: false, error: check.reason };

  const resolved = await ensureCart();
  await prisma.cart.update({
    where: { id: resolved.id },
    data: { couponId: coupon.id },
  });

  revalidatePath("/", "layout");
  return { ok: true, message: `${coupon.code} applied.` };
}

export async function removeCouponAction(): Promise<ActionResult> {
  const cart = await ensureCart();
  await prisma.cart.update({ where: { id: cart.id }, data: { couponId: null } });
  revalidatePath("/", "layout");
  return { ok: true, message: "Discount removed." };
}
