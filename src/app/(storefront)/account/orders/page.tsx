import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { formatPrice } from "@/lib/money";
import { formatDate } from "@/lib/utils";
import type { OrderStatus } from "@/lib/constants";
import { buildMetadata } from "@/lib/seo";
import { EmptyState } from "@/components/ui/EmptyState";
import { OrderStatusPill } from "@/components/account/OrderStatusPill";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildMetadata({
  title: "Your orders",
  description: "Track and review your Miracle Tree orders.",
  path: "/account/orders",
  noIndex: true,
});

export default async function AccountOrdersPage() {
  const user = await requireUser();

  const orders = await prisma.order.findMany({
    where: { userId: user.id },
    orderBy: { placedAt: "desc" },
    select: {
      id: true,
      orderNumber: true,
      placedAt: true,
      status: true,
      paymentStatus: true,
      grandTotal: true,
      trackingNumber: true,
      items: { select: { id: true, productName: true, variantName: true, quantity: true } },
    },
  });

  if (!orders.length) {
    return (
      <EmptyState
        icon="bag"
        title="No orders yet"
        body="Once you place an order it will appear here, with its status, tracking number and a full receipt."
        actionLabel="Explore the collection"
        actionHref="/shop"
      />
    );
  }

  return (
    <div>
      <h2 className="text-title text-cream-50">Your orders</h2>
      <p className="mt-3 text-sm text-cream-400">
        {orders.length} {orders.length === 1 ? "order" : "orders"}
      </p>

      <ul className="mt-10 grid gap-4">
        {orders.map((order) => (
          <li key={order.id} className="border border-white/12">
            <Link
              href={`/account/orders/${order.orderNumber}`}
              className="group block p-6 transition-colors hover:bg-white/[0.02]"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="tabular-nums text-cream-50">{order.orderNumber}</p>
                  <p className="mt-1 text-xs text-cream-400">
                    Placed {formatDate(order.placedAt)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <OrderStatusPill status={order.status as OrderStatus} />
                  <span className="tabular-nums text-cream-100">
                    {formatPrice(order.grandTotal)}
                  </span>
                </div>
              </div>

              <ul className="mt-5 grid gap-1 text-sm text-cream-400">
                {order.items.slice(0, 3).map((item) => (
                  <li key={item.id} className="truncate">
                    {item.quantity} × {item.productName}
                    <span className="text-cream-400/70"> · {item.variantName}</span>
                  </li>
                ))}
                {order.items.length > 3 ? (
                  <li className="text-cream-400/70">and {order.items.length - 3} more</li>
                ) : null}
              </ul>

              {order.trackingNumber ? (
                <p className="mt-4 text-xs text-gold-300">Tracking {order.trackingNumber}</p>
              ) : null}

              <span className="mt-5 inline-flex items-center gap-2 text-[0.68rem] uppercase tracking-[0.14em] text-cream-300">
                View order
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 14 14"
                  fill="none"
                  aria-hidden
                  className="transition-transform duration-300 group-hover:translate-x-1"
                >
                  <path d="M5 3l4 4-4 4" stroke="currentColor" strokeWidth="1.3" />
                </svg>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
