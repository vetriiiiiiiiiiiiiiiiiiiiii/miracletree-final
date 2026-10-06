import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyWebhookSignature } from "@/lib/razorpay";
import { markOrderPaid } from "@/app/actions/checkout";
import { recordAudit } from "@/lib/audit";

export async function POST(req) {
  const body = await req.text();
  const signature = req.headers.get("x-razorpay-signature");

  if (!signature || !verifyWebhookSignature(body, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  let event;
  try {
    event = JSON.parse(body);
  } catch (err) {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // We only care about order.paid
  if (event.event === "order.paid") {
    const rzpOrderId = event.payload?.order?.entity?.id;
    const rzpPaymentId = event.payload?.payment?.entity?.id;

    if (rzpOrderId) {
      // Find our internal order ID by Razorpay's order ID
      const order = await prisma.order.findFirst({
        where: { paymentOrderId: rzpOrderId },
        select: { id: true }
      });

      if (order) {
        await markOrderPaid(order.id, rzpPaymentId || "webhook");
      } else {
        // Record it just in case we need to debug
        await recordAudit({
          action: "webhook.unmatched_order",
          entity: "System",
          meta: { rzpOrderId, rzpPaymentId }
        });
      }
    }
  }

  return NextResponse.json({ received: true });
}
