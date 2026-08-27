import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Container } from "@/components/layout/Section";
import { LinkButton } from "@/components/ui/Button";
import { OrderCelebration } from "@/components/checkout/OrderCelebration";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { formatPrice } from "@/lib/money";
import { formatDate } from "@/lib/utils";
import { ORDER_STATUS_LABELS, type OrderStatus } from "@/lib/constants";
import { buildMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildMetadata({
  title: "Order confirmed",
  description: "Your Miracle Tree order has been placed.",
  path: "/order",
  noIndex: true,
});

export default async function OrderConfirmationPage({
  params,
}: {
  params: Promise<{ orderNumber: string }>;
}) {
  const { orderNumber } = await params;

  const order = await prisma.order.findUnique({
    where: { orderNumber },
    include: { items: true, events: { orderBy: { createdAt: "asc" } } },
  });

  if (!order) notFound();

  // A guest can see the confirmation they were just redirected to, but a
  // signed-in shopper must own the order — otherwise order numbers would be
  // enumerable into other people's addresses.
  const user = await getCurrentUser();
  if (order.userId && order.userId !== user?.id && user?.role !== "admin") {
    notFound();
  }

  const paid = order.paymentStatus === "paid";
  const cod = order.paymentProvider === "cod";

  return (
    <div className="grain relative bg-ink pb-24 pt-16">
      <OrderCelebration />

      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[60vh]"
        style={{
          background:
            "radial-gradient(60% 60% at 50% 0%, rgba(28,90,58,0.28) 0%, rgba(6,9,7,0) 70%)",
        }}
      />

      <Container className="relative z-10">
        <div className="mx-auto max-w-2xl text-center">
          <p className="eyebrow mb-6 text-gold-400">Order {order.orderNumber}</p>
          <h1 className="text-hero text-cream-50" style={{ fontFamily: "var(--font-display)" }}>
            Your miracle is on its way.
          </h1>
          <p className="mx-auto mt-7 max-w-[46ch] leading-relaxed text-cream-300/85">
            {cod && !paid
              ? "We've received your order and you'll pay the courier on delivery. A confirmation is on its way to your inbox."
              : "Payment received and your order is confirmed. A receipt is on its way to your inbox."}
          </p>

          <dl className="mx-auto mt-10 grid max-w-md grid-cols-2 gap-x-8 gap-y-5 border-y border-white/10 py-7 text-left text-sm">
            <div>
              <dt className="eyebrow text-cream-400">Order</dt>
              <dd className="mt-1.5 tabular-nums text-cream-50">{order.orderNumber}</dd>
            </div>
            <div>
              <dt className="eyebrow text-cream-400">Placed</dt>
              <dd className="mt-1.5 text-cream-50">{formatDate(order.placedAt)}</dd>
            </div>
            <div>
              <dt className="eyebrow text-cream-400">Status</dt>
              <dd className="mt-1.5 text-cream-50">
                {ORDER_STATUS_LABELS[order.status as OrderStatus] ?? order.status}
              </dd>
            </div>
            <div>
              <dt className="eyebrow text-cream-400">Total</dt>
              <dd className="mt-1.5 tabular-nums text-cream-50">
                {formatPrice(order.grandTotal)}
              </dd>
            </div>
          </dl>
        </div>

        {/* Items */}
        <div className="mx-auto mt-16 max-w-3xl">
          <h2 className="text-title text-cream-50">What's coming</h2>

          <ul className="mt-7 divide-y divide-white/10 border-y border-white/10">
            {order.items.map((item) => (
              <li key={item.id} className="flex items-center gap-5 py-5">
                <div className="relative h-20 w-16 shrink-0 overflow-hidden bg-ink-800">
                  {item.imageUrl ? (
                    <Image
                      src={item.imageUrl}
                      alt=""
                      fill
                      sizes="64px"
                      className="object-contain p-2"
                    />
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
            <div className="mt-2 flex items-baseline justify-between border-t border-white/10 pt-3">
              <dt className="text-cream-100">Total</dt>
              <dd className="text-lg tabular-nums text-cream-50">
                {formatPrice(order.grandTotal)}
              </dd>
            </div>
          </dl>

          {/* Delivery */}
          <div className="mt-12 grid gap-8 border-t border-white/10 pt-8 sm:grid-cols-2">
            <div>
              <h3 className="eyebrow mb-3 text-gold-400/80">Delivering to</h3>
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
              <h3 className="eyebrow mb-3 text-gold-400/80">What happens next</h3>
              <ol className="grid gap-2.5 text-sm text-cream-400">
                <li>We pack your order within 1–2 working days.</li>
                <li>You'll get a tracking number by email once it ships.</li>
                <li>Delivery usually takes 3–7 working days.</li>
              </ol>
            </div>
          </div>

          <div className="mt-14 flex flex-wrap justify-center gap-3">
            <LinkButton href="/shop" size="lg" magnetic>
              Continue shopping
            </LinkButton>
            <LinkButton href="/account/orders" variant="secondary" size="lg">
              Track your orders
            </LinkButton>
          </div>

          <p className="mt-8 text-center text-xs text-cream-400">
            Questions about this order?{" "}
            <Link href="/contact" className="underline underline-offset-4">
              Get in touch
            </Link>{" "}
            and quote {order.orderNumber}.
          </p>
        </div>
      </Container>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between">
      <dt className="text-cream-400">{label}</dt>
      <dd className="tabular-nums text-cream-200">{value}</dd>
    </div>
  );
}
