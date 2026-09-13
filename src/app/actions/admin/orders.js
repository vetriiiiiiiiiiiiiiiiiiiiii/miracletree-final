"use server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin, AuthError } from "@/lib/auth";
import { recordAudit } from "@/lib/audit";
import { sendOrderStatusEmail, statusDeservesEmail } from "@/lib/order-mail";
import { commitStock, releaseStock, adjustStock } from "@/lib/inventory";
import {
  adminInventorySchema,
  adminOrderStatusSchema,
  adminPaymentStatusSchema,
  fieldErrors,
  formText,
} from "@/lib/validation";
import { TERMINAL_ORDER_STATUSES } from "@/lib/constants";
/**
 * Order and inventory administration.
 *
 * Moving an order between statuses is not just a label change — dispatching
 * converts reserved stock into a sale, and cancelling returns it. Both happen
 * inside the same transaction as the status change so the two can never
 * disagree.
 */
export async function updateOrderStatusAction(_prev, formData) {
  try {
    const admin = await requireAdmin();
    const parsed = adminOrderStatusSchema.safeParse({
      orderId: formData.get("orderId"),
      status: formData.get("status"),
      message: formData.get("message"),
      trackingNumber: formData.get("trackingNumber"),
      trackingUrl: formData.get("trackingUrl"),
    });
    if (!parsed.success) {
      return {
        status: "error",
        message: "Please check the highlighted fields.",
        errors: fieldErrors(parsed.error),
      };
    }
    const { orderId, status, message, trackingNumber, trackingUrl } = parsed.data;
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        items: { select: { variantId: true, quantity: true } },
      },
    });
    if (!order) return { status: "error", message: "That order no longer exists." };
    const previous = order.status;
    if (previous === status) {
      return { status: "error", message: "The order is already at that status." };
    }
    const lines = order.items
      .filter((item) => item.variantId)
      .map((item) => ({ variantId: item.variantId, quantity: item.quantity }));
    await prisma.$transaction(async (tx) => {
      // Dispatch is the point stock genuinely leaves the building.
      const dispatching = status === "shipped" || status === "out_for_delivery";
      const alreadyDispatched =
        previous === "shipped" ||
        previous === "out_for_delivery" ||
        previous === "delivered";
      if (dispatching && !alreadyDispatched) {
        await commitStock(tx, lines, order.orderNumber, admin.id);
      }
      // Cancelling before dispatch puts the reservation back.
      if (
        (status === "cancelled" || status === "refunded") &&
        !alreadyDispatched &&
        !TERMINAL_ORDER_STATUSES.includes(previous)
      ) {
        await releaseStock(tx, lines, order.orderNumber, admin.id);
      }
      await tx.order.update({
        where: { id: order.id },
        data: {
          status,
          ...(trackingNumber ? { trackingNumber } : {}),
          ...(trackingUrl ? { trackingUrl } : {}),
          ...(status === "delivered" ? { fulfillmentStatus: "fulfilled" } : {}),
          ...(status === "refunded" ? { paymentStatus: "refunded" } : {}),
          events: {
            create: {
              status,
              message: message || null,
              actorId: admin.id,
            },
          },
        },
      });
    });
    await recordAudit({
      actorId: admin.id,
      action: "order.status_changed",
      entity: "Order",
      entityId: order.id,
      meta: { from: previous, to: status, orderNumber: order.orderNumber },
    });
    revalidatePath("/admin/orders");
    revalidatePath(`/admin/orders/${order.id}`);
    revalidatePath("/account/orders");
    // Only the statuses a shopper would want to hear about. Marking an order
    // "processing" or "packed" is an internal step, and emailing every one of
    // them trains people to ignore the address the shipping notice comes from.
    if (statusDeservesEmail(status)) {
      await sendOrderStatusEmail(order.orderNumber, status, message || null);
    }
    return { status: "success", message: `Order marked ${status.replace(/_/g, " ")}.` };
  } catch (error) {
    if (error instanceof AuthError) return { status: "error", message: error.message };
    console.error("[admin/orders]", error);
    return { status: "error", message: "Could not update that order." };
  }
}
export async function updatePaymentStatusAction(_prev, formData) {
  try {
    const admin = await requireAdmin();
    const parsed = adminPaymentStatusSchema.safeParse({
      orderId: formData.get("orderId"),
      paymentStatus: formData.get("paymentStatus"),
    });
    if (!parsed.success) return { status: "error", message: "Invalid payment status." };
    await prisma.order.update({
      where: { id: parsed.data.orderId },
      data: {
        paymentStatus: parsed.data.paymentStatus,
        events: {
          create: {
            status: "payment",
            message: `Payment marked ${parsed.data.paymentStatus}.`,
            actorId: admin.id,
          },
        },
      },
    });
    await recordAudit({
      actorId: admin.id,
      action: "order.payment_status_changed",
      entity: "Order",
      entityId: parsed.data.orderId,
      meta: { to: parsed.data.paymentStatus },
    });
    revalidatePath(`/admin/orders/${parsed.data.orderId}`);
    return { status: "success", message: "Payment status updated." };
  } catch (error) {
    if (error instanceof AuthError) return { status: "error", message: error.message };
    return { status: "error", message: "Could not update the payment status." };
  }
}
export async function addOrderNoteAction(orderId, note) {
  try {
    const admin = await requireAdmin();
    const trimmed = note.trim().slice(0, 500);
    if (!trimmed) return { ok: false, error: "Write something first." };
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { status: true },
    });
    if (!order) return { ok: false, error: "That order no longer exists." };
    await prisma.orderEvent.create({
      data: {
        orderId,
        status: order.status,
        message: trimmed,
        actorId: admin.id,
      },
    });
    revalidatePath(`/admin/orders/${orderId}`);
    return { ok: true };
  } catch (error) {
    if (error instanceof AuthError) return { ok: false, error: error.message };
    return { ok: false, error: "Could not save that note." };
  }
}
// ---------------------------------------------------------------- inventory
export async function adjustInventoryAction(_prev, formData) {
  try {
    const admin = await requireAdmin();
    const parsed = adminInventorySchema.safeParse({
      variantId: formText(formData, "variantId"),
      delta: formText(formData, "delta"),
      reason: formText(formData, "reason"),
      reference: formText(formData, "reference"),
    });
    if (!parsed.success) {
      return {
        status: "error",
        message: "Enter a whole number to add or subtract.",
        errors: fieldErrors(parsed.error),
      };
    }
    if (parsed.data.delta === 0) {
      return { status: "error", message: "Enter a non-zero adjustment." };
    }
    const result = await adjustStock({
      variantId: parsed.data.variantId,
      delta: parsed.data.delta,
      reason: parsed.data.reason,
      reference: parsed.data.reference || null,
      actorId: admin.id,
    });
    await recordAudit({
      actorId: admin.id,
      action: "inventory.adjusted",
      entity: "Inventory",
      entityId: parsed.data.variantId,
      meta: {
        delta: parsed.data.delta,
        reason: parsed.data.reason,
        onHand: result.onHand,
      },
    });
    revalidatePath("/admin/inventory");
    return {
      status: "success",
      message: `Stock updated — ${result.onHand} on hand.`,
    };
  } catch (error) {
    if (error instanceof AuthError) return { status: "error", message: error.message };
    console.error("[admin/inventory]", error);
    return { status: "error", message: "Could not adjust that stock level." };
  }
}
