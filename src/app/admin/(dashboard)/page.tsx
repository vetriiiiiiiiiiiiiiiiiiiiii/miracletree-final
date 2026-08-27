import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { formatPrice } from "@/lib/money";
import { formatDate } from "@/lib/utils";
import type { OrderStatus } from "@/lib/constants";
import { Card, EmptyRow, PageHeader, Pill, StatCard, Table, Td, Tr } from "@/components/admin/ui";
import { OrderStatusPill } from "@/components/account/OrderStatusPill";
import { RevenueChart } from "@/components/admin/RevenueChart";

export const dynamic = "force-dynamic";

/** Revenue only ever counts money actually taken. */
const PAID = { paymentStatus: "paid" as const };

export default async function AdminDashboard() {
  await requireAdmin();

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const last30 = new Date(startOfToday.getTime() - 29 * 86400000);
  const previous30 = new Date(startOfToday.getTime() - 59 * 86400000);

  const [
    revenue30,
    revenuePrevious30,
    orders30,
    ordersPrevious30,
    customerCount,
    newCustomers30,
    productCount,
    draftCount,
    pendingOrders,
    pendingReviews,
    lowStock,
    recentOrders,
    topProducts,
    dailyRows,
  ] = await Promise.all([
    prisma.order.aggregate({
      where: { ...PAID, placedAt: { gte: last30 } },
      _sum: { grandTotal: true },
    }),
    prisma.order.aggregate({
      where: { ...PAID, placedAt: { gte: previous30, lt: last30 } },
      _sum: { grandTotal: true },
    }),
    prisma.order.count({ where: { placedAt: { gte: last30 } } }),
    prisma.order.count({ where: { placedAt: { gte: previous30, lt: last30 } } }),
    prisma.user.count({ where: { role: "customer" } }),
    prisma.user.count({ where: { role: "customer", createdAt: { gte: last30 } } }),
    prisma.product.count({ where: { status: "published" } }),
    prisma.product.count({ where: { status: "draft" } }),
    prisma.order.count({ where: { status: { in: ["pending", "confirmed", "processing"] } } }),
    prisma.review.count({ where: { status: "pending" } }),
    prisma.inventory.findMany({
      where: { trackInventory: true, onHand: { lte: 10 } },
      orderBy: { onHand: "asc" },
      take: 8,
      select: {
        id: true,
        onHand: true,
        reserved: true,
        lowStockAt: true,
        variant: {
          select: {
            id: true,
            name: true,
            sku: true,
            product: { select: { id: true, name: true, slug: true } },
          },
        },
      },
    }),
    prisma.order.findMany({
      orderBy: { placedAt: "desc" },
      take: 8,
      select: {
        id: true,
        orderNumber: true,
        placedAt: true,
        status: true,
        paymentStatus: true,
        grandTotal: true,
        shippingName: true,
        items: { select: { id: true } },
      },
    }),
    prisma.orderItem.groupBy({
      by: ["productId", "productName"],
      where: { order: { ...PAID, placedAt: { gte: last30 } } },
      _sum: { quantity: true, lineTotal: true },
      orderBy: { _sum: { lineTotal: "desc" } },
      take: 5,
    }),
    prisma.order.findMany({
      where: { ...PAID, placedAt: { gte: last30 } },
      select: { placedAt: true, grandTotal: true },
    }),
  ]);

  const revenue = revenue30._sum.grandTotal ?? 0;
  const revenuePrevious = revenuePrevious30._sum.grandTotal ?? 0;

  const averageOrder = orders30 > 0 ? Math.round(revenue / orders30) : 0;

  // A 30-day series, zero-filled so the chart has no gaps on quiet days.
  const byDay = new Map<string, number>();
  for (let i = 0; i < 30; i++) {
    const day = new Date(last30.getTime() + i * 86400000);
    byDay.set(day.toISOString().slice(0, 10), 0);
  }
  for (const row of dailyRows) {
    const key = row.placedAt.toISOString().slice(0, 10);
    byDay.set(key, (byDay.get(key) ?? 0) + row.grandTotal);
  }
  const series = [...byDay.entries()].map(([date, total]) => ({
    date,
    revenue: total / 100,
  }));

  const productImages = await prisma.product.findMany({
    where: { id: { in: topProducts.map((p) => p.productId).filter((id): id is string => Boolean(id)) } },
    select: {
      id: true,
      slug: true,
      images: { take: 1, orderBy: { position: "asc" }, select: { url: true } },
    },
  });
  const imageById = new Map(productImages.map((p) => [p.id, p]));

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Everything below covers the last 30 days unless stated otherwise. Revenue counts paid orders only."
      />

      {/* Attention */}
      {pendingOrders + pendingReviews + lowStock.length > 0 ? (
        <div className="mb-8 flex flex-wrap gap-2">
          {pendingOrders > 0 ? (
            <Link href="/admin/orders?status=pending">
              <Pill tone="warning">{pendingOrders} orders need action</Pill>
            </Link>
          ) : null}
          {pendingReviews > 0 ? (
            <Link href="/admin/reviews?status=pending">
              <Pill tone="warning">{pendingReviews} reviews awaiting moderation</Pill>
            </Link>
          ) : null}
          {lowStock.length > 0 ? (
            <Link href="/admin/inventory?filter=low">
              <Pill tone="danger">{lowStock.length} variants low on stock</Pill>
            </Link>
          ) : null}
        </div>
      ) : null}

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Revenue · 30 days"
          value={formatPrice(revenue)}
          delta={{ value: percentChange(revenue, revenuePrevious), label: "vs previous 30" }}
        />
        <StatCard
          label="Orders · 30 days"
          value={String(orders30)}
          delta={{ value: percentChange(orders30, ordersPrevious30), label: "vs previous 30" }}
          href="/admin/orders"
        />
        <StatCard
          label="Average order"
          value={formatPrice(averageOrder)}
          hint={orders30 === 0 ? "No paid orders yet" : undefined}
        />
        <StatCard
          label="Customers"
          value={String(customerCount)}
          hint={`${newCustomers30} new in 30 days`}
          href="/admin/customers"
        />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Published products" value={String(productCount)} href="/admin/products" />
        <StatCard
          label="Drafts"
          value={String(draftCount)}
          href="/admin/products?status=draft"
          tone={draftCount > 0 ? "warning" : "default"}
        />
        <StatCard
          label="Low stock"
          value={String(lowStock.length)}
          href="/admin/inventory?filter=low"
          tone={lowStock.length > 0 ? "danger" : "default"}
        />
        <StatCard
          label="Reviews pending"
          value={String(pendingReviews)}
          href="/admin/reviews?status=pending"
          tone={pendingReviews > 0 ? "warning" : "default"}
        />
      </div>

      {/* Chart */}
      <Card
        className="mt-8"
        title="Revenue, last 30 days"
        description={
          revenue === 0
            ? "No paid orders in this window yet — the chart fills in as orders come through."
            : undefined
        }
      >
        <RevenueChart data={series} />
      </Card>

      <div className="mt-8 grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        {/* Recent orders */}
        <Card
          title="Recent orders"
          actions={
            <Link
              href="/admin/orders"
              className="text-[0.66rem] uppercase tracking-[0.14em] text-cream-400 hover:text-cream-100"
            >
              All orders
            </Link>
          }
          padded={false}
        >
          <Table
            head={[
              "Order",
              "Customer",
              "Status",
              { label: "Payment", align: "center" },
              { label: "Total", align: "right" },
            ]}
          >
            {recentOrders.length === 0 ? (
              <EmptyRow colSpan={5}>
                No orders yet. They will appear here the moment one comes in.
              </EmptyRow>
            ) : (
              recentOrders.map((order) => (
                <Tr key={order.id}>
                  <Td>
                    <Link
                      href={`/admin/orders/${order.id}`}
                      className="tabular-nums text-cream-50 hover:text-gold-300"
                    >
                      {order.orderNumber}
                    </Link>
                    <span className="mt-0.5 block text-xs text-cream-400">
                      {formatDate(order.placedAt)} · {order.items.length} item
                      {order.items.length === 1 ? "" : "s"}
                    </span>
                  </Td>
                  <Td>{order.shippingName}</Td>
                  <Td>
                    <OrderStatusPill status={order.status as OrderStatus} />
                  </Td>
                  <Td align="center">
                    <Pill
                      tone={
                        order.paymentStatus === "paid"
                          ? "success"
                          : order.paymentStatus === "failed"
                            ? "danger"
                            : "neutral"
                      }
                    >
                      {order.paymentStatus}
                    </Pill>
                  </Td>
                  <Td align="right" className="tabular-nums text-cream-50">
                    {formatPrice(order.grandTotal)}
                  </Td>
                </Tr>
              ))
            )}
          </Table>
        </Card>

        {/* Top products */}
        <Card title="Top sellers · 30 days" padded={false}>
          {topProducts.length === 0 ? (
            <p className="px-5 py-12 text-center text-sm text-cream-400">
              No sales in this window yet.
            </p>
          ) : (
            <ul className="divide-y divide-white/8">
              {topProducts.map((row) => {
                const product = row.productId ? imageById.get(row.productId) : null;
                return (
                  <li key={row.productId ?? row.productName} className="flex items-center gap-3 px-5 py-3.5">
                    <div className="relative h-11 w-9 shrink-0 overflow-hidden bg-ink-700">
                      {product?.images[0] ? (
                        <Image
                          src={product.images[0].url}
                          alt=""
                          fill
                          sizes="36px"
                          className="object-contain p-1"
                        />
                      ) : null}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm text-cream-100">{row.productName}</p>
                      <p className="text-xs text-cream-400">
                        {row._sum.quantity ?? 0} sold
                      </p>
                    </div>
                    <span className="shrink-0 text-sm tabular-nums text-cream-200">
                      {formatPrice(row._sum.lineTotal ?? 0)}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>

      {/* Low stock */}
      {lowStock.length ? (
        <Card
          className="mt-8"
          title="Running low"
          description="Available stock is on-hand minus what is reserved by open orders."
          actions={
            <Link
              href="/admin/inventory"
              className="text-[0.66rem] uppercase tracking-[0.14em] text-cream-400 hover:text-cream-100"
            >
              Manage inventory
            </Link>
          }
          padded={false}
        >
          <Table
            head={[
              "Product",
              "Variant",
              "SKU",
              { label: "On hand", align: "right" },
              { label: "Reserved", align: "right" },
              { label: "Available", align: "right" },
            ]}
          >
            {lowStock.map((row) => {
              const available = row.onHand - row.reserved;
              return (
                <Tr key={row.id}>
                  <Td>
                    <Link
                      href={`/admin/products/${row.variant.product.id}`}
                      className="text-cream-50 hover:text-gold-300"
                    >
                      {row.variant.product.name}
                    </Link>
                  </Td>
                  <Td>{row.variant.name}</Td>
                  <Td className="text-xs text-cream-400">{row.variant.sku ?? "—"}</Td>
                  <Td align="right" className="tabular-nums">
                    {row.onHand}
                  </Td>
                  <Td align="right" className="tabular-nums text-cream-400">
                    {row.reserved}
                  </Td>
                  <Td align="right">
                    <Pill tone={available <= 0 ? "danger" : "warning"}>{available}</Pill>
                  </Td>
                </Tr>
              );
            })}
          </Table>
        </Card>
      ) : null}
    </>
  );
}

function percentChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}
