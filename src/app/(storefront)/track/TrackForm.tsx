"use client";

import { useActionState } from "react";
import { Input, FormMessage } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { OrderStatusPill } from "@/components/account/OrderStatusPill";
import { trackOrderAction, type TrackState } from "@/app/actions/track";
import { formatDate } from "@/lib/utils";

const INITIAL: TrackState = { status: "idle" };

export function TrackForm() {
  const [state, action, pending] = useActionState(trackOrderAction, INITIAL);

  return (
    <div className="grid gap-12 lg:grid-cols-[minmax(0,22rem)_1fr] lg:gap-20">
      <form action={action} className="grid gap-5">
        <Input
          name="orderNumber"
          label="Order number"
          placeholder="MT-2609-0001"
          required
          autoComplete="off"
          spellCheck={false}
          hint="On your confirmation email, at the top."
          error={state.status === "error" ? state.errors?.orderNumber : undefined}
        />
        <Input
          name="email"
          type="email"
          label="Email address"
          placeholder="you@example.com"
          required
          autoComplete="email"
          hint="The address the order was placed with."
          error={state.status === "error" ? state.errors?.email : undefined}
        />

        <Button type="submit" disabled={pending} className="justify-self-start">
          {pending ? "Looking…" : "Find my order"}
        </Button>

        {state.status === "error" ? (
          <FormMessage>{state.message}</FormMessage>
        ) : null}
      </form>

      <div>
        {state.status === "found" ? (
          <OrderResult order={state.order} />
        ) : (
          <div className="border border-border-subtle p-8 text-sm leading-relaxed text-cream-400">
            <p>
              Enter both details and the current status of the order will appear
              here, along with everything that has happened to it so far.
            </p>
            <p className="mt-4">
              If you have an account, your full order history including invoices
              and addresses is under{" "}
              <a
                href="/account/orders"
                className="text-cream-200 underline decoration-gold-500 underline-offset-4 hover:text-cream-50"
              >
                your account
              </a>
              .
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function OrderResult({ order }: { order: Extract<TrackState, { status: "found" }>["order"] }) {
  return (
    <article className="border border-border-subtle">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-border-subtle p-6">
        <div>
          <p className="eyebrow text-cream-400">Order</p>
          <p className="mt-1.5 font-display text-[1.4rem] tabular-nums text-cream-50">
            {order.orderNumber}
          </p>
        </div>
        <OrderStatusPill status={order.status} />
      </header>

      <dl className="grid gap-px bg-border-subtle sm:grid-cols-3">
        <div className="bg-ink p-6">
          <dt className="eyebrow text-cream-400">Placed</dt>
          <dd className="mt-2 text-cream-100">{formatDate(order.placedAt)}</dd>
        </div>
        <div className="bg-ink p-6">
          <dt className="eyebrow text-cream-400">Items</dt>
          <dd className="mt-2 tabular-nums text-cream-100">{order.itemCount}</dd>
        </div>
        <div className="bg-ink p-6">
          <dt className="eyebrow text-cream-400">Payment</dt>
          <dd className="mt-2 capitalize text-cream-100">{order.paymentStatus}</dd>
        </div>
      </dl>

      <div className="border-t border-border-subtle p-6">
        <h2 className="eyebrow mb-4 text-cream-400">What you ordered</h2>
        <ul className="grid gap-2">
          {order.items.map((item, i) => (
            <li key={i} className="flex justify-between gap-6 text-sm text-cream-200">
              <span>{item.name}</span>
              <span className="tabular-nums text-cream-400">×{item.quantity}</span>
            </li>
          ))}
        </ul>
      </div>

      {order.events.length ? (
        <div className="border-t border-border-subtle p-6">
          <h2 className="eyebrow mb-5 text-cream-400">Progress</h2>
          <ol className="grid gap-5">
            {order.events.map((event, i) => (
              <li key={i} className="flex gap-4">
                <span
                  aria-hidden
                  className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-emerald-400"
                />
                <div>
                  <p className="text-sm text-cream-100">{event.label}</p>
                  {event.message ? (
                    <p className="mt-1 text-sm text-cream-400">{event.message}</p>
                  ) : null}
                  <p className="mt-1 text-xs text-cream-400">{formatDate(event.at)}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      ) : null}
    </article>
  );
}
