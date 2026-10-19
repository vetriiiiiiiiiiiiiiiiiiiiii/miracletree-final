import "server-only";
import { cookies } from "next/headers";
import { cache } from "react";
import { nanoid } from "nanoid";
import { prisma } from "./prisma";
import { getCurrentUser } from "./auth";
import { COMMERCE_DEFAULTS } from "./constants";
import { settingNumber } from "./queries";
const CART_COOKIE = "mt_cart";
const CART_TTL_SECONDS = 60 * 60 * 24 * 60; // 60 days
export const EMPTY_CART = {
  id: null,
  token: null,
  lines: [],
  itemCount: 0,
  totals: {
    subtotal: 0,
    discountTotal: 0,
    shippingTotal: 0,
    taxTotal: 0,
    grandTotal: 0,
    freeShippingThreshold: COMMERCE_DEFAULTS.freeShippingThreshold,
    amountToFreeShipping: COMMERCE_DEFAULTS.freeShippingThreshold,
    couponDiscount: 0,
    offerDiscount: 0,
    offerPercent: COMMERCE_DEFAULTS.autoDiscountPercent,
    offerThreshold: COMMERCE_DEFAULTS.autoDiscountThreshold,
    amountToOffer: COMMERCE_DEFAULTS.autoDiscountThreshold,
  },
  coupon: null,
  couponWarning: null,
};
/** Reads the cart token without creating one — safe in Server Components. */
export async function getCartToken() {
  const store = await cookies();
  return store.get(CART_COOKIE)?.value ?? null;
}
/**
 * Resolves the caller's cart, creating one if needed. Only callable from a
 * Server Action or Route Handler, because it writes a cookie.
 */
export async function ensureCart() {
  const store = await cookies();
  const sessionUser = await getCurrentUser();
  const existingToken = store.get(CART_COOKIE)?.value;
  if (existingToken) {
    const found = await prisma.cart.findUnique({
      where: { token: existingToken },
      select: { id: true, token: true, userId: true },
    });
    if (found) {
      // Claim an anonymous cart for the user who just signed in.
      if (sessionUser && !found.userId) {
        await prisma.cart.update({
          where: { id: found.id },
          data: { userId: sessionUser.id },
        });
      }
      return { id: found.id, token: found.token };
    }
  }
  // A signed-in shopper returning on a new device picks their cart back up.
  if (sessionUser) {
    const previous = await prisma.cart.findFirst({
      where: { userId: sessionUser.id },
      orderBy: { updatedAt: "desc" },
      select: { id: true, token: true },
    });
    if (previous) {
      setCartCookie(store, previous.token);
      return previous;
    }
  }
  const token = nanoid(32);
  const created = await prisma.cart.create({
    data: { token, userId: sessionUser?.id ?? null },
    select: { id: true, token: true },
  });
  setCartCookie(store, token);
  return created;
}
function setCartCookie(store, token) {
  store.set(CART_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: CART_TTL_SECONDS,
  });
}
/**
 * Builds the full cart view: live prices, live stock, discount and shipping.
 * Prices are always re-read from the variant, never trusted from the client.
 */
export const getCart = async () => {
  const token = await getCartToken();
  if (!token) return EMPTY_CART;
  const cart = await prisma.cart.findUnique({
    where: { token },
    include: {
      coupon: true,
      items: {
        orderBy: { createdAt: "asc" },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
              taxRatePct: true,
              category: { select: { id: true, slug: true } },
              images: { orderBy: { position: "asc" }, take: 1 },
            },
          },
          variant: { include: { inventory: true } },
        },
      },
    },
  });
  if (!cart) return EMPTY_CART;
  const lines = cart.items.map((item) => {
    const inv = item.variant.inventory;
    const available =
      !inv || !inv.trackInventory
        ? Number.MAX_SAFE_INTEGER
        : Math.max(0, inv.onHand - inv.reserved);
    const unitPrice = item.variant.price;
    return {
      id: item.id,
      productId: item.productId,
      variantId: item.variantId,
      productName: item.product.name,
      productSlug: item.product.slug,
      variantName: item.variant.name,
      sku: item.variant.sku,
      imageUrl: item.variant.imageUrl || item.product.images?.[0]?.url || null,
      unitPrice,
      compareAtPrice: item.variant.compareAtPrice,
      quantity: item.quantity,
      lineTotal: unitPrice * item.quantity,
      available:
        available === Number.MAX_SAFE_INTEGER ? item.quantity : available,
      overStock: item.quantity > available,
      categoryId: item.product.category?.id ?? null,
      categorySlug: item.product.category?.slug ?? null,
    };
  });
  const subtotal = lines.reduce((sum, l) => sum + l.lineTotal, 0);
  const itemCount = lines.reduce((sum, l) => sum + l.quantity, 0);
  const threshold = await settingNumber(
    "shipping.freeThreshold",
    COMMERCE_DEFAULTS.freeShippingThreshold,
  );
  const flatFee = await settingNumber(
    "shipping.flatFee",
    COMMERCE_DEFAULTS.flatShippingFee,
  );
  // --- automatic order discount: a percentage off every order at or above
  // a threshold, no code needed. A percent of 0 switches it off.
  const offerThreshold = await settingNumber(
    "discount.autoThreshold",
    COMMERCE_DEFAULTS.autoDiscountThreshold,
  );
  const offerPercent = Math.min(
    100,
    Math.max(0, await settingNumber("discount.autoPercent", COMMERCE_DEFAULTS.autoDiscountPercent)),
  );
  const offerActive = offerPercent > 0;
  const offerEarned =
    offerActive && lines.length > 0 && subtotal >= offerThreshold
      ? // Whole rupees: paise totals like ₹256.50 look odd on a receipt.
        Math.round((subtotal * offerPercent) / 100 / 100) * 100
      : 0;
  // --- coupon
  let discountTotal = 0;
  let freeShipping = false;
  let couponWarning = null;
  let coupon = cart.coupon;
  if (coupon) {
    // The shopper half of the context is read here rather than through
    // couponContextFor, which takes a finished CartView — and this *is* the
    // function that builds one. Only queried when a coupon is actually
    // attached, so an ordinary cart still costs nothing extra.
    // getCurrentUser, not a raw session: it covers both sign-in paths, and
    // reading `.sub` off the NextAuth session was always empty.
    const userId = (await getCurrentUser())?.id ?? null;
    const needsHistory =
      Boolean(userId) &&
      (coupon.appliesTo === "first_order" || coupon.perUserLimit !== null);
    const [priorOrders, redemptions] = needsHistory
      ? await Promise.all([
          prisma.order.count({
            where: { userId: userId, status: { not: "cancelled" } },
          }),
          prisma.order.count({
            where: {
              userId: userId,
              couponCode: coupon.code,
              status: { not: "cancelled" },
            },
          }),
        ])
      : [0, 0];
    const check = evaluateCoupon(coupon, {
      subtotal,
      lines,
      userId,
      priorOrders,
      redemptions,
    });
    if (check.ok) {
      discountTotal = check.discount;
      freeShipping = check.freeShipping;
    } else {
      couponWarning = check.reason;
      coupon = null;
    }
  }
  // The automatic discount and a code do not stack: the shopper gets
  // whichever saves them more.
  let couponDiscount = discountTotal;
  let offerDiscount = 0;
  if (offerEarned > 0 && offerEarned >= couponDiscount) {
    if (coupon && couponDiscount > 0) {
      couponWarning = `Your ${offerPercent}% order discount saves you more, so ${coupon.code} isn't added on top.`;
      coupon = null;
      freeShipping = false;
    }
    couponDiscount = 0;
    offerDiscount = offerEarned;
    discountTotal = offerEarned;
  }
  // Free shipping is earned on the order value before discounts, so a
  // discount never takes it away again.
  const shippingTotal =
    lines.length === 0 || freeShipping || subtotal >= threshold
      ? 0
      : flatFee;
  // Product prices are GST-inclusive, matching Indian retail convention, so tax
  // is reported as zero here rather than added on top.
  const taxTotal = 0;
  const grandTotal = Math.max(
    0,
    subtotal - discountTotal + shippingTotal + taxTotal,
  );
  return {
    id: cart.id,
    token: cart.token,
    lines,
    itemCount,
    totals: {
      subtotal,
      discountTotal,
      shippingTotal,
      taxTotal,
      grandTotal,
      freeShippingThreshold: threshold,
      // Zero once shipping is already free, whether earned by spending or
      // granted by a coupon. Otherwise the summary urges the shopper to spend
      // another ₹539 to unlock something they have just been given.
      // Also zero when the flat fee itself is zero: there is nothing to unlock.
      amountToFreeShipping:
        freeShipping || flatFee === 0
          ? 0
          : Math.max(0, threshold - subtotal),
      couponDiscount,
      offerDiscount,
      offerPercent,
      offerThreshold,
      // Zero once the offer applies, or when it is switched off.
      amountToOffer: offerActive ? Math.max(0, offerThreshold - subtotal) : 0,
    },
    coupon: coupon
      ? {
          code: coupon.code,
          description: coupon.description,
          kind: coupon.kind,
        }
      : null,
    couponWarning,
  };
};
/** Splits the admin's comma-separated list, tolerating spaces and blanks. */
function parseScopeIds(raw) {
  if (!raw) return new Set();
  return new Set(
    raw
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean),
  );
}
/**
 * Builds the shopper half of the context.
 *
 * Redemptions are counted from `Order.couponCode` rather than a join table
 * because that is where checkout already records the code, and it survives the
 * coupon being renamed or deleted.
 */
export async function couponContextFor(coupon, cart) {
  const userId = (await getCurrentUser())?.id ?? null;
  if (!userId) {
    return {
      subtotal: cart.totals.subtotal,
      lines: cart.lines,
      userId: null,
      priorOrders: 0,
      redemptions: 0,
    };
  }
  const [priorOrders, redemptions] = await Promise.all([
    prisma.order.count({ where: { userId, status: { not: "cancelled" } } }),
    prisma.order.count({
      where: { userId, couponCode: coupon.code, status: { not: "cancelled" } },
    }),
  ]);
  return {
    subtotal: cart.totals.subtotal,
    lines: cart.lines,
    userId,
    priorOrders,
    redemptions,
  };
}
export function evaluateCoupon(coupon, context) {
  const now = new Date();
  const { subtotal } = context;
  if (!coupon.isActive)
    return { ok: false, reason: "That code is no longer active." };
  if (coupon.startsAt && coupon.startsAt > now)
    return { ok: false, reason: "That code isn't active yet." };
  if (coupon.endsAt && coupon.endsAt < now)
    return { ok: false, reason: "That code has expired." };
  if (coupon.usageLimit !== null && coupon.usageCount >= coupon.usageLimit)
    return { ok: false, reason: "That code has been fully redeemed." };
  // Per-shopper rules need somebody to attach to, and a guest has nobody. Left
  // open, either restriction is bypassed simply by checking out signed out — so
  // a code carrying one asks for an account instead.
  const perShopper =
    coupon.appliesTo === "first_order" || coupon.perUserLimit !== null;
  if (perShopper && !context.userId) {
    return {
      ok: false,
      reason: `Sign in to your account to use ${coupon.code}.`,
    };
  }
  if (coupon.appliesTo === "first_order" && context.priorOrders > 0) {
    return { ok: false, reason: `${coupon.code} is for a first order only.` };
  }
  if (
    coupon.perUserLimit !== null &&
    context.redemptions >= coupon.perUserLimit
  ) {
    return {
      ok: false,
      reason:
        coupon.perUserLimit === 1
          ? `You have already used ${coupon.code}.`
          : `You have used ${coupon.code} the maximum number of times.`,
    };
  }
  if (subtotal < coupon.minSubtotal) {
    return {
      ok: false,
      reason: `Add ₹${Math.ceil((coupon.minSubtotal - subtotal) / 100)} more to use ${coupon.code}.`,
    };
  }
  // Scope. A coupon for one product discounts only the lines it covers —
  // applying its percentage to the whole basket would give away far more than
  // the promotion actually offers. Slugs are accepted alongside ids because
  // asking an admin to paste cuids into a text field invites mistakes.
  const scope = parseScopeIds(coupon.appliesToIds);
  let eligible = subtotal;
  if (coupon.appliesTo === "product") {
    eligible = context.lines
      .filter((l) => scope.has(l.productId) || scope.has(l.productSlug))
      .reduce((sum, l) => sum + l.lineTotal, 0);
  } else if (coupon.appliesTo === "category") {
    eligible = context.lines
      .filter(
        (l) =>
          (l.categoryId !== null && scope.has(l.categoryId)) ||
          (l.categorySlug !== null && scope.has(l.categorySlug)),
      )
      .reduce((sum, l) => sum + l.lineTotal, 0);
  }
  if (eligible <= 0) {
    return {
      ok: false,
      reason: `${coupon.code} doesn't apply to anything in your basket.`,
    };
  }
  if (coupon.kind === "free_shipping") {
    return { ok: true, discount: 0, freeShipping: true };
  }
  let discount =
    coupon.kind === "percentage"
      ? Math.floor((eligible * coupon.value) / 100)
      : coupon.value;
  if (coupon.maxDiscount !== null)
    discount = Math.min(discount, coupon.maxDiscount);
  discount = Math.min(discount, eligible);
  return { ok: true, discount, freeShipping: false };
}
/** Purchasable units for a variant, accounting for reservations. */
export async function availableStock(variantId) {
  const inv = await prisma.inventory.findUnique({ where: { variantId } });
  if (!inv || !inv.trackInventory) return Number.MAX_SAFE_INTEGER;
  return Math.max(0, inv.onHand - inv.reserved);
}
