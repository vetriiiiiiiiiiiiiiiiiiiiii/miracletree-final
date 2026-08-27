"use client";

import { useActionState, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useFormStatus } from "react-dom";
import { Input, Textarea, Select, FormMessage } from "@/components/ui/Field";
import { Card } from "@/components/admin/ui";
import {
  addOrderNoteAction,
  updateOrderStatusAction,
  updatePaymentStatusAction,
} from "@/app/actions/admin/orders";
import {
  ORDER_STATUSES,
  ORDER_STATUS_LABELS,
  PAYMENT_STATUSES,
  type OrderStatus,
} from "@/lib/constants";
import type { FormState } from "@/app/actions/marketing";

const INITIAL: FormState = { status: "idle" };

/**
 * The order's control surface. Status changes carry stock consequences, so the
 * form says what will happen before it happens rather than after.
 */
export function OrderControls({
  orderId,
  status,
  paymentStatus,
  trackingNumber,
  trackingUrl,
}: {
  orderId: string;
  status: OrderStatus;
  paymentStatus: string;
  trackingNumber: string | null;
  trackingUrl: string | null;
}) {
  const router = useRouter();
  const [statusState, statusAction] = useActionState(updateOrderStatusAction, INITIAL);
  const [paymentState, paymentAction] = useActionState(updatePaymentStatusAction, INITIAL);
  const [next, setNext] = useState<OrderStatus>(status);
  const [note, setNote] = useState("");
  const [noteBusy, setNoteBusy] = useState(false);
  const [, startTransition] = useTransition();

  const consequence = (() => {
    const dispatched = ["shipped", "out_for_delivery", "delivered"].includes(status);
    if ((next === "shipped" || next === "out_for_delivery") && !dispatched) {
      return "Stock will be deducted from on-hand when you save this.";
    }
    if ((next === "cancelled" || next === "refunded") && !dispatched) {
      return "Reserved stock will be returned to available when you save this.";
    }
    if (next === "refunded") {
      return "This marks the payment refunded. Issue the actual refund in your payment dashboard.";
    }
    return null;
  })();

  const saveNote = async () => {
    if (!note.trim()) return;
    setNoteBusy(true);
    await addOrderNoteAction(orderId, note);
    setNoteBusy(false);
    setNote("");
    startTransition(() => router.refresh());
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card title="Fulfilment">
        <form action={statusAction} className="grid gap-5">
          <input type="hidden" name="orderId" value={orderId} />

          {statusState.status === "error" ? (
            <FormMessage>{statusState.message}</FormMessage>
          ) : null}
          {statusState.status === "success" ? (
            <FormMessage tone="success">{statusState.message}</FormMessage>
          ) : null}

          <Select
            label="Status"
            name="status"
            value={next}
            onChange={(event) => setNext(event.target.value as OrderStatus)}
            options={ORDER_STATUSES.map((value) => ({
              value,
              label: ORDER_STATUS_LABELS[value],
            }))}
          />

          {consequence ? (
            <p className="border-l border-gold-500/50 bg-gold-400/5 py-2 pl-4 text-xs leading-relaxed text-gold-300">
              {consequence}
            </p>
          ) : null}

          <div className="grid gap-5 sm:grid-cols-2">
            <Input
              label="Tracking number"
              name="trackingNumber"
              defaultValue={trackingNumber ?? ""}
            />
            <Input
              label="Tracking URL"
              name="trackingUrl"
              defaultValue={trackingUrl ?? ""}
              hint="Shown to the customer as a link."
            />
          </div>

          <Textarea
            label="Note for the timeline"
            name="message"
            rows={2}
            maxLength={300}
            placeholder="Optional — visible to you and on the customer's order page."
          />

          <Submit label="Update order" />
        </form>
      </Card>

      <div className="grid gap-6">
        <Card title="Payment">
          <form action={paymentAction} className="grid gap-4">
            <input type="hidden" name="orderId" value={orderId} />

            {paymentState.status === "error" ? (
              <FormMessage>{paymentState.message}</FormMessage>
            ) : null}
            {paymentState.status === "success" ? (
              <FormMessage tone="success">{paymentState.message}</FormMessage>
            ) : null}

            <Select
              label="Payment status"
              name="paymentStatus"
              defaultValue={paymentStatus}
              options={PAYMENT_STATUSES.map((value) => ({ value, label: value }))}
              hint="Only change this to reconcile a payment you have confirmed elsewhere."
            />

            <Submit label="Update payment" />
          </form>
        </Card>

        <Card title="Internal note">
          <div className="grid gap-4">
            <Textarea
              label="Add a note"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              rows={3}
              maxLength={500}
              placeholder="Anything worth recording against this order."
            />
            <button
              type="button"
              onClick={() => void saveNote()}
              disabled={noteBusy || !note.trim()}
              className="justify-self-start border border-white/20 px-5 py-2.5 text-[0.68rem] uppercase tracking-[0.14em] text-cream-200 transition-colors hover:border-cream-100 disabled:opacity-40"
            >
              {noteBusy ? "Saving…" : "Add note"}
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
}

function Submit({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="justify-self-start bg-emerald-500 px-6 py-2.5 text-[0.68rem] font-medium uppercase tracking-[0.14em] text-cream-50 transition-colors hover:bg-emerald-400 disabled:opacity-60"
    >
      {pending ? "Saving…" : label}
    </button>
  );
}
