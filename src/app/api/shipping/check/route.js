import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { quoteShipping, shippingLive } from "@/lib/shipping";
import { settingNumber } from "@/lib/queries";
import { COMMERCE_DEFAULTS } from "@/lib/constants";
/**
 * The product page's PIN code checker: can we deliver there, by when, is cash
 * on delivery available, and what shipping costs for one of this item.
 */
export async function GET(request) {
  const limit = await rateLimit({ key: `pincode:${await clientIp()}`, limit: 30, windowSeconds: 600 });
  if (!limit.ok) return NextResponse.json({ ok: false, error: "Too many checks. Try again in a few minutes." }, { status: 429 });
  const { searchParams } = new URL(request.url);
  const pincode = (searchParams.get("pincode") ?? "").trim();
  const variantId = searchParams.get("variantId") ?? "";
  if (!/^\d{6}$/.test(pincode)) return NextResponse.json({ ok: false, error: "Enter a 6-digit PIN code." }, { status: 400 });
  const variant = /^[0-9a-f]{24}$/i.test(variantId)
    ? await prisma.productVariant.findUnique({ where: { id: variantId }, select: { id: true, price: true } })
    : null;
  const lines = variant ? [{ variantId: variant.id, quantity: 1 }] : [];
  const quote = await quoteShipping({ pincode, cod: false, lines, subtotal: variant?.price ?? 0, free: false });
  if (!quote.ok) return NextResponse.json({ ok: false, error: quote.reason }, { status: 400 });
  return NextResponse.json({
    ok: true,
    live: shippingLive() && quote.live,
    serviceable: quote.serviceable,
    codAvailable: quote.codAvailable,
    etd: quote.etd ?? null,
    days: quote.days ?? null,
    shipping: quote.amount ?? null,
    freeAbove: await settingNumber("shipping.freeThreshold", COMMERCE_DEFAULTS.freeShippingThreshold),
  });
}
