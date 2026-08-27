"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { ensureCart, availableStock } from "@/lib/cart";

export type WishlistResult =
  | { ok: true; wishlisted: boolean; message?: string }
  | { ok: false; error: string; requiresAuth?: boolean };

export async function toggleWishlistAction(productId: string): Promise<WishlistResult> {
  const user = await getCurrentUser();
  if (!user) {
    return { ok: false, error: "Sign in to save products.", requiresAuth: true };
  }

  const product = await prisma.product.findFirst({
    where: { id: productId, status: "published" },
    select: { id: true, name: true },
  });
  if (!product) return { ok: false, error: "That product is unavailable." };

  const existing = await prisma.wishlistItem.findUnique({
    where: { userId_productId: { userId: user.id, productId } },
  });

  if (existing) {
    await prisma.wishlistItem.delete({ where: { id: existing.id } });
    revalidatePath("/account/wishlist");
    return { ok: true, wishlisted: false, message: `Removed ${product.name}.` };
  }

  await prisma.wishlistItem.create({ data: { userId: user.id, productId } });
  revalidatePath("/account/wishlist");
  return { ok: true, wishlisted: true, message: `Saved ${product.name}.` };
}

/** Moves a saved product into the bag, picking its first purchasable variant. */
export async function moveWishlistItemToCartAction(
  productId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Sign in to continue." };

  const product = await prisma.product.findFirst({
    where: { id: productId, status: "published" },
    select: {
      id: true,
      variants: {
        where: { isActive: true },
        orderBy: { position: "asc" },
        select: { id: true },
      },
    },
  });
  if (!product) return { ok: false, error: "That product is unavailable." };

  let chosen: string | null = null;
  for (const variant of product.variants) {
    if ((await availableStock(variant.id)) > 0) {
      chosen = variant.id;
      break;
    }
  }
  if (!chosen) return { ok: false, error: "Every size is currently out of stock." };

  const cart = await ensureCart();
  await prisma.cartItem.upsert({
    where: { cartId_variantId: { cartId: cart.id, variantId: chosen } },
    create: { cartId: cart.id, productId: product.id, variantId: chosen, quantity: 1 },
    update: { quantity: { increment: 1 } },
  });

  await prisma.wishlistItem.deleteMany({ where: { userId: user.id, productId } });

  revalidatePath("/", "layout");
  revalidatePath("/account/wishlist");
  return { ok: true };
}
