import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyWebhookSignature } from "@/lib/razorpay";
import { markOrderFailed, markOrderPaid } from "@/app/actions/checkout";
import { recordAudit } from "@/lib/audit";
import { limitRoute } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Razorpay webhook.
 *
 * This is the authoritative path: the browser callback can be closed, blocked or
 * lost, but the webhook always arrives. Both routes converge on `markOrderPaid`,
 * which is idempotent, so whichever wins the race the result is identical.
 *
 * The raw body is read as text and verified before it is parsed — parsing first
 * would mean trusting unsigned input.
 */
export async function POST(request: NextRequest) {
  const signature = request.headers.get("x-razorpay-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const raw = await request.text();

  if (!verifyWebhookSignature(raw, signature)) {
    await recordAudit({
      action: "payment.webhook_invalid_signature",
      entity: "Order",
      meta: { length: raw.length },
    });

    // Throttled only *after* the signature fails, never before. Razorpay retries
    // legitimate events aggressively, and a limiter in front of verification
    // would eventually drop a real payment notification — the one failure this
    // system cannot tolerate. Forged calls, which cannot pass HMAC, are what
    // gets slowed down.
    const limited = await limitRoute({ name: "webhook-bad-sig", limit: 20, windowSeconds: 600 });
    if (limited) return limited;

    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let payload: {
    event?: string;
    payload?: {
      payment?: { entity?: { id?: string; order_id?: string; error_description?: string } };
    };
  };

  try {
    payload = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Malformed payload" }, { status: 400 });
  }

  const entity = payload.payload?.payment?.entity;
  const razorpayOrderId = entity?.order_id;
  const paymentId = entity?.id;

  if (!razorpayOrderId) {
    // Events we do not handle are acknowledged, so Razorpay stops retrying.
    return NextResponse.json({ received: true });
  }

  const order = await prisma.order.findFirst({
    where: { paymentOrderId: razorpayOrderId },
    select: { id: true },
  });

  if (!order) {
    // A payment for an order we do not have is still acknowledged; retrying
    // would not make it appear.
    await recordAudit({
      action: "payment.webhook_unknown_order",
      entity: "Order",
      meta: { razorpayOrderId },
    });
    return NextResponse.json({ received: true });
  }

  switch (payload.event) {
    case "payment.captured":
    case "order.paid":
      await markOrderPaid(order.id, paymentId ?? razorpayOrderId);
      break;

    case "payment.failed":
      await markOrderFailed(
        order.id,
        entity?.error_description ?? "Payment failed at the gateway.",
      );
      break;

    default:
      break;
  }

  return NextResponse.json({ received: true });
}
