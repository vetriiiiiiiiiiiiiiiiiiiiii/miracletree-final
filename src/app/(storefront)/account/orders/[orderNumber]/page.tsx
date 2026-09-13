import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { formatPrice } from "@/lib/money";
import { formatDate } from "@/lib/utils";
import { ORDER_STATUS_LABELS, type OrderStatus } from "@/lib/constants";
import { buildMetadata } from "@/lib/seo";
import { OrderStatusPill } from "@/components/account/OrderStatusPill";
import { LinkButton } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildMetadata({
  title: "Order details",
  description: "Track your Miracle Tree order.",
  path: "/account/orders",
  noIndex: true,
});

/** The happy path, in order. Cancelled and refunded orders skip the rail. */
const TIMELINE: OrderStatus[] = [
  "confirmed",
  "processing",
  "packed",
  "shipped",
  "out_for_delivery",
  "delivered",
];

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ orderNumber: string }>;
}) {
  const { orderNumber } = await params;
  const user = await requireUser();

  // Scoped by userId, so an order number alone is not enough to read an order.
  const order = await prisma.order.findFirst({
    where: { orderNumber, userId: user.id },
    include: {
      items: true,
      events: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!order) notFound();

  const status = order.status as OrderStatus;
  const isCancelled = status === "cancelled" || status === "refunded";
  const currentStep = TIMELINE.indexOf(status);

  return (
    <div>
      <Link
        href="/account/orders"
        className="inline-flex items-center gap-2 text-[0.7rem] uppercase tracking-[0.14em] text-cream-400 hover:text-cream-100"
      >
        <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden>
          <path d="M9 3L5 7l4 4" stroke="currentColor" strokeWidth="1.3" />
        </svg>
        All orders
      </Link>

      <div className="mt-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-title tabular-nums text-cream-50">{order.orderNumber}</h2>
          <p className="mt-2 text-sm text-cream-400">
            Placed {formatDate(order.placedAt, { hour: "numeric", minute: "2-digit" })}
          </p>
        </div>
        <OrderStatusPill status={status} />
      </div>

      {/* Progress */}
      {!isCancelled ? (
        <ol className="mt-10 grid gap-0 border-y border-border-subtle py-6 sm:grid-cols-6">
          {TIMELINE.map((step, index) => {
            const done = currentStep >= index;
            return (
              <li key={step} className="flex items-start gap-3 py-2 sm:flex-col sm:gap-2">
                <span
                  className={cn(
                    "mt-1 h-2 w-2 shrink-0 rounded-full transition-colors sm:mt-0",
                    done ? "bg-emerald-400" : "bg-border-subtle",
                  )}
                  aria-hidden
                />
                <span
                  className={cn(
                    "text-xs leading-tight",
                    done ? "text-cream-100" : "text-cream-400",
                  )}
                >
                  {ORDER_STATUS_LABELS[step]}
                </span>
              </li>
            );
          })}
        </ol>
      ) : (
        <p className="mt-10 border border-danger/30 bg-danger/8 px-5 py-4 text-sm text-[#e8bab7]">
          This order was {status}. If you were charged, the refund is processed to the
          original payment method within 5–7 working days.
        </p>
      )}

      {order.trackingNumber ? (
        <div className="mt-8 border border-gold-400/30 bg-gold-400/5 p-5">
          <p className="eyebrow text-gold-400">Tracking</p>
          <p className="mt-2 tabular-nums text-cream-50">{order.trackingNumber}</p>
          {order.trackingUrl ? (
            <a
              href={order.trackingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-block text-xs text-gold-300 underline underline-offset-4"
            >
              Track with the courier
            </a>
          ) : null}
        </div>
      ) : null}

      {/* Items */}
      <h3 className="mt-14 text-[1.15rem] text-cream-50">Items</h3>
      <ul className="mt-5 divide-y divide-border-subtle border-y border-border-subtle">
        {order.items.map((item) => (
          <li key={item.id} className="flex items-center gap-4 py-5">
            <div className="relative h-20 w-16 shrink-0 overflow-hidden bg-ink-800">
              {item.imageUrl ? (
                <Image src={item.imageUrl} alt="" fill sizes="64px" className="object-contain p-2" />
              ) : null}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-cream-50">{item.productName}</p>
              <p className="mt-0.5 text-sm text-cream-400">
                {item.variantName} · Qty {item.quantity}
              </p>
            </div>
            <span className="shrink-0 tabular-nums text-cream-200">
              {formatPrice(item.lineTotal)}
            </span>
          </li>
        ))}
      </ul>

      <dl className="mt-6 grid gap-2.5 text-sm">
        <Row label="Subtotal" value={formatPrice(order.subtotal)} />
        {order.discountTotal > 0 ? (
          <Row
            label={`Discount${order.couponCode ? ` (${order.couponCode})` : ""}`}
            value={`−${formatPrice(order.discountTotal)}`}
          />
        ) : null}
        <Row
          label="Shipping"
          value={order.shippingTotal === 0 ? "Free" : formatPrice(order.shippingTotal)}
        />
        <div className="mt-2 flex items-baseline justify-between border-t border-border-subtle pt-3">
          <dt className="text-cream-100">Total</dt>
          <dd className="text-lg tabular-nums text-cream-50">
            {formatPrice(order.grandTotal)}
          </dd>
        </div>
        <Row
          label="Payment"
          value={`${order.paymentProvider === "cod" ? "Cash on delivery" : "Online"} · ${order.paymentStatus}`}
        />
      </dl>

      {/* Address + history */}
      <div className="mt-12 grid gap-10 border-t border-border-subtle pt-8 sm:grid-cols-2">
        <div>
          <h3 className="eyebrow mb-3 text-gold-400">Delivery address</h3>
          <address className="not-italic text-sm leading-relaxed text-cream-300">
            {order.shippingName}
            <br />
            {order.shippingLine1}
            {order.shippingLine2 ? (
              <>
                <br />
                {order.shippingLine2}
              </>
            ) : null}
            <br />
            {order.shippingCity}, {order.shippingState} {order.shippingPostalCode}
            <br />
            {order.shippingCountry}
            <br />
            <span className="text-cream-400">{order.shippingPhone}</span>
          </address>
        </div>

        <div>
          <h3 className="eyebrow mb-3 text-gold-400">History</h3>
          <ol className="grid gap-3">
            {order.events.map((event) => (
              <li key={event.id} className="text-sm">
                <span className="text-cream-200">
                  {ORDER_STATUS_LABELS[event.status as OrderStatus] ?? event.status}
                </span>
                {event.message ? (
                  <span className="block text-xs text-cream-400">{event.message}</span>
                ) : null}
                <span className="block text-xs text-cream-400">
                  {formatDate(event.createdAt, { hour: "numeric", minute: "2-digit" })}
                </span>
              </li>
            ))}
          </ol>
        </div>
      </div>

      <div className="mt-12 flex flex-wrap gap-3 border-t border-border-subtle pt-8">
        <LinkButton href="/shop" size="md" variant="secondary">
          Order again
        </LinkButton>
        <LinkButton href={`/contact?order=${order.orderNumber}`} size="md" variant="ghost">
          Question about this order
        </LinkButton>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between">
      <dt className="text-cream-400">{label}</dt>
      <dd className="tabular-nums capitalize text-cream-200">{value}</dd>
    </div>
  );
}
