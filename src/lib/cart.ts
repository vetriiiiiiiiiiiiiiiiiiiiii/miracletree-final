import "server-only";
import { cookies } from "next/headers";
import { cache } from "react";
import { nanoid } from "nanoid";
import { prisma } from "./prisma";
import { getSession } from "./auth";
import { COMMERCE_DEFAULTS } from "./constants";
import { settingNumber } from "./queries";

const CART_COOKIE = "mt_cart";
const CART_TTL_SECONDS = 60 * 60 * 24 * 60; // 60 days

export type CartLine = {
  id: string;
  productId: string;
  variantId: string;
  productName: string;
  productSlug: string;
  variantName: string;
  sku: string | null;
  imageUrl: string | null;
  unitPrice: number;
  compareAtPrice: number | null;
  quantity: number;
  lineTotal: number;
  /** Units actually purchasable right now. */
  available: number;
  /** True when the line quantity exceeds what is in stock. */
  overStock: boolean;
  /** Used to judge coupons scoped to a category. Null when uncategorised. */
  categoryId: string | null;
  categorySlug: string | null;
};

export type CartTotals = {
  subtotal: number;
  discountTotal: number;
  shippingTotal: number;
  taxTotal: number;
  grandTotal: number;
  freeShippingThreshold: number;
  /** Paise still needed to unlock free shipping, or 0. */
  amountToFreeShipping: number;
};

export type CartView = {
  id: string | null;
  token: string | null;
  lines: CartLine[];
  itemCount: number;
  totals: CartTotals;
  coupon: { code: string; description: string | null; kind: string } | null;
  /** Set when a stored coupon stopped qualifying (cart value dropped, expired). */
  couponWarning: string | null;
};

export const EMPTY_CART: CartView = {
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
  },
  coupon: null,
  couponWarning: null,
};

/** Reads the cart token without creating one — safe in Server Components. */
export async function getCartToken(): Promise<string | null> {
  const store = await cookies();
  return store.get(CART_COOKIE)?.value ?? null;
}

/**
 * Resolves the caller's cart, creating one if needed. Only callable from a
 * Server Action or Route Handler, because it writes a cookie.
 */
export async function ensureCart(): Promise<{ id: string; token: string }> {
  const store = await cookies();
  const session = await getSession();
  const existingToken = store.get(CART_COOKIE)?.value;

  if (existingToken) {
    const found = await prisma.cart.findUnique({
      where: { token: existingToken },
      select: { id: true, token: true, userId: true },
    });
    if (found) {
      // Claim an anonymous cart for the user who just signed in.
      if (session && !found.userId) {
        await prisma.cart.update({
          where: { id: found.id },
          data: { userId: session.sub },
        });
      }
      return { id: found.id, token: found.token };
    }
  }

  // A signed-in shopper returning on a new device picks their cart back up.
  if (session) {
    const previous = await prisma.cart.findFirst({
      where: { userId: session.sub },
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
    data: { token, userId: session?.sub ?? null },
    select: { id: true, token: true },
  });
  setCartCookie(store, token);
  return created;
}

function setCartCookie(store: Awaited<ReturnType<typeof cookies>>, token: string) {
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
export const getCart = cache(async (): Promise<CartView> => {
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
            },
          },
          variant: { include: { inventory: true } },
        },
      },
    },
  });

  if (!cart) return EMPTY_CART;

  const lines: CartLine[] = cart.items.map((item) => {
    const inv = item.variant.inventory;
    const available = !inv || !inv.trackInventory
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
      imageUrl: item.variant.imageUrl,
      unitPrice,
      compareAtPrice: item.variant.compareAtPrice,
      quantity: item.quantity,
      lineTotal: unitPrice * item.quantity,
      available: available === Number.MAX_SAFE_INTEGER ? item.quantity : available,
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
  const flatFee = await settingNumber("shipping.flatFee", COMMERCE_DEFAULTS.flatShippingFee);

  // --- coupon
  let discountTotal = 0;
  let freeShipping = false;
  let couponWarning: string | null = null;
  let coupon = cart.coupon;

  if (coupon) {
    // The shopper half of the context is read here rather than through
    // couponContextFor, which takes a finished CartView — and this *is* the
    // function that builds one. Only queried when a coupon is actually
    // attached, so an ordinary cart still costs nothing extra.
    const session = await getSession();
    const userId = session?.sub ?? null;
    const needsHistory =
      Boolean(userId) && (coupon.appliesTo === "first_order" || coupon.perUserLimit !== null);

    const [priorOrders, redemptions] = needsHistory
      ? await Promise.all([
          prisma.order.count({ where: { userId: userId!, status: { not: "cancelled" } } }),
          prisma.order.count({
            where: { userId: userId!, couponCode: coupon.code, status: { not: "cancelled" } },
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

  const shippingTotal =
    lines.length === 0 || freeShipping || subtotal - discountTotal >= threshold ? 0 : flatFee;

  // Product prices are GST-inclusive, matching Indian retail convention, so tax
  // is reported as zero here rather than added on top.
  const taxTotal = 0;
  const grandTotal = Math.max(0, subtotal - discountTotal + shippingTotal + taxTotal);

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
      amountToFreeShipping: freeShipping
        ? 0
        : Math.max(0, threshold - (subtotal - discountTotal)),
    },
    coupon: coupon
      ? { code: coupon.code, description: coupon.description, kind: coupon.kind }
      : null,
    couponWarning,
  };
});

type CouponRow = {
  code: string;
  kind: string;
  value: number;
  minSubtotal: number;
  maxDiscount: number | null;
  appliesTo: string;
  appliesToIds: string | null;
  usageLimit: number | null;
  usageCount: number;
  perUserLimit: number | null;
  startsAt: Date | null;
  endsAt: Date | null;
  isActive: boolean;
};

/**
 * Everything a coupon has to be judged against beyond the cart total.
 *
 * These used to be missing entirely, and the restrictions stored alongside each
 * coupon — who may use it, how often, and on what — were collected in admin and
 * then never read. A code labelled "first order only" worked for everyone,
 * repeatedly, and a code scoped to one product discounted the whole basket.
 */
export type CouponContext = {
  subtotal: number;
  lines: Pick<CartLine, "productId" | "productSlug" | "categoryId" | "categorySlug" | "lineTotal">[];
  /** Null for a guest. Per-shopper rules need an identity to hold onto. */
  userId: string | null;
  /** Orders this shopper has already placed, cancelled ones excluded. */
  priorOrders: number;
  /** Times this shopper has already redeemed this particular code. */
  redemptions: number;
};

/** Splits the admin's comma-separated list, tolerating spaces and blanks. */
function parseScopeIds(raw: string | null): Set<string> {
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
export async function couponContextFor(
  coupon: { code: string },
  cart: CartView,
): Promise<CouponContext> {
  const session = await getSession();
  const userId = session?.sub ?? null;

  if (!userId) {
    return { subtotal: cart.totals.subtotal, lines: cart.lines, userId: null, priorOrders: 0, redemptions: 0 };
  }

  const [priorOrders, redemptions] = await Promise.all([
    prisma.order.count({ where: { userId, status: { not: "cancelled" } } }),
    prisma.order.count({
      where: { userId, couponCode: coupon.code, status: { not: "cancelled" } },
    }),
  ]);

  return { subtotal: cart.totals.subtotal, lines: cart.lines, userId, priorOrders, redemptions };
}

export function evaluateCoupon(
  coupon: CouponRow,
  context: CouponContext,
): { ok: true; discount: number; freeShipping: boolean } | { ok: false; reason: string } {
  const now = new Date();
  const { subtotal } = context;

  if (!coupon.isActive) return { ok: false, reason: "That code is no longer active." };
  if (coupon.startsAt && coupon.startsAt > now)
    return { ok: false, reason: "That code isn't active yet." };
  if (coupon.endsAt && coupon.endsAt < now)
    return { ok: false, reason: "That code has expired." };
  if (coupon.usageLimit !== null && coupon.usageCount >= coupon.usageLimit)
    return { ok: false, reason: "That code has been fully redeemed." };

  // Per-shopper rules need somebody to attach to, and a guest has nobody. Left
  // open, either restriction is bypassed simply by checking out signed out — so
  // a code carrying one asks for an account instead.
  const perShopper = coupon.appliesTo === "first_order" || coupon.perUserLimit !== null;
  if (perShopper && !context.userId) {
    return { ok: false, reason: `Sign in to your account to use ${coupon.code}.` };
  }

  if (coupon.appliesTo === "first_order" && context.priorOrders > 0) {
    return { ok: false, reason: `${coupon.code} is for a first order only.` };
  }

  if (coupon.perUserLimit !== null && context.redemptions >= coupon.perUserLimit) {
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
    return { ok: false, reason: `${coupon.code} doesn't apply to anything in your basket.` };
  }

  if (coupon.kind === "free_shipping") {
    return { ok: true, discount: 0, freeShipping: true };
  }

  let discount =
    coupon.kind === "percentage"
      ? Math.floor((eligible * coupon.value) / 100)
      : coupon.value;

  if (coupon.maxDiscount !== null) discount = Math.min(discount, coupon.maxDiscount);
  discount = Math.min(discount, eligible);

  return { ok: true, discount, freeShipping: false };
}

/** Purchasable units for a variant, accounting for reservations. */
export async function availableStock(variantId: string): Promise<number> {
  const inv = await prisma.inventory.findUnique({ where: { variantId } });
  if (!inv || !inv.trackInventory) return Number.MAX_SAFE_INTEGER;
  return Math.max(0, inv.onHand - inv.reserved);
}
