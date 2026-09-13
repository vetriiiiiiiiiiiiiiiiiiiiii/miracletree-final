import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { formatPrice } from "@/lib/money";
import { formatDate } from "@/lib/utils";
import { buildMetadata } from "@/lib/seo";
import { LinkButton } from "@/components/ui/Button";
import { OrderStatusPill } from "@/components/account/OrderStatusPill";
export const dynamic = "force-dynamic";
export const metadata = buildMetadata({
  title: "Your account",
  description: "Orders, addresses and saved products.",
  path: "/account",
  noIndex: true,
});
export default async function AccountOverviewPage() {
  const user = await requireUser();
  const [orders, orderCount, wishlistCount, addressCount, spend] = await Promise.all([
    prisma.order.findMany({
      where: { userId: user.id },
      orderBy: { placedAt: "desc" },
      take: 3,
      select: {
        id: true,
        orderNumber: true,
        placedAt: true,
        status: true,
        grandTotal: true,
        items: { select: { id: true, productName: true, quantity: true } },
      },
    }),
    prisma.order.count({ where: { userId: user.id } }),
    prisma.wishlistItem.count({ where: { userId: user.id } }),
    prisma.address.count({ where: { userId: user.id } }),
    prisma.order.aggregate({
      where: { userId: user.id, paymentStatus: "paid" },
      _sum: { grandTotal: true },
    }),
  ]);
  return (
    <div className="grid gap-14">
      <section>
        <h2 className="sr-only">Summary</h2>
        <dl className="grid gap-px overflow-hidden border border-border-subtle bg-border-subtle sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Orders" value={String(orderCount)} />
          <Stat label="Total spent" value={formatPrice(spend._sum.grandTotal ?? 0)} />
          <Stat
            label="Saved products"
            value={String(wishlistCount)}
            href="/account/wishlist"
          />
          <Stat
            label="Addresses"
            value={String(addressCount)}
            href="/account/addresses"
          />
        </dl>
      </section>

      <section>
        <div className="mb-6 flex items-baseline justify-between gap-4">
          <h2 className="text-title text-cream-50">Recent orders</h2>
          {orderCount > 3 ? (
            <Link
              href="/account/orders"
              className="text-[0.7rem] uppercase tracking-[0.14em] text-cream-400 underline underline-offset-4 hover:text-cream-100"
            >
              All orders
            </Link>
          ) : null}
        </div>

        {orders.length === 0 ? (
          <div className="border border-border-subtle px-8 py-14 text-center">
            <p className="text-cream-200">You haven't ordered yet.</p>
            <p className="mx-auto mt-3 max-w-[40ch] text-sm text-cream-400">
              When you do, it will show up here with tracking and a full receipt.
            </p>
            <LinkButton href="/shop" size="md" className="mt-7" magnetic>
              Explore the collection
            </LinkButton>
          </div>
        ) : (
          <ul className="divide-y divide-border-subtle border-y border-border-subtle">
            {orders.map((order) => (
              <li key={order.id}>
                <Link
                  href={`/account/orders/${order.orderNumber}`}
                  className="group flex flex-wrap items-center gap-x-6 gap-y-3 py-5 transition-colors hover:bg-ink-800"
                >
                  <div className="min-w-[8rem]">
                    <p className="tabular-nums text-cream-50">{order.orderNumber}</p>
                    <p className="mt-1 text-xs text-cream-400">
                      {formatDate(order.placedAt)}
                    </p>
                  </div>

                  <p className="min-w-0 flex-1 truncate text-sm text-cream-400">
                    {order.items.map((i) => i.productName).join(", ")}
                  </p>

                  <OrderStatusPill status={order.status} />

                  <span className="tabular-nums text-cream-100">
                    {formatPrice(order.grandTotal)}
                  </span>

                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 14 14"
                    fill="none"
                    aria-hidden
                    className="text-cream-400 transition-transform duration-300 group-hover:translate-x-1"
                  >
                    <path d="M5 3l4 4-4 4" stroke="currentColor" strokeWidth="1.3" />
                  </svg>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="border-t border-border-subtle pt-10">
        <h2 className="text-title text-cream-50">Need a hand?</h2>
        <p className="mt-3 max-w-[52ch] text-sm leading-relaxed text-cream-400">
          Questions about an order, a delivery or a product — we answer within one
          working day.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <LinkButton href="/contact" variant="secondary" size="md">
            Contact us
          </LinkButton>
          <LinkButton href="/faq" variant="ghost" size="md">
            Read the FAQ
          </LinkButton>
        </div>
      </section>
    </div>
  );
}
function Stat({ label, value, href }) {
  const content = (
    <>
      <dt className="eyebrow text-cream-400">{label}</dt>
      <dd className="mt-3 text-[1.6rem] tabular-nums text-cream-50">{value}</dd>
    </>
  );
  return (
    <div className="bg-ink p-6 transition-colors hover:bg-ink-800">
      {href ? (
        <Link href={href} className="block">
          {content}
        </Link>
      ) : (
        content
      )}
    </div>
  );
}
