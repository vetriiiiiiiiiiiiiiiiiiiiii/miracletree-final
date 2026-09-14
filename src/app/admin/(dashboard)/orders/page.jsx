import Link from "next/link";
import { prisma, insensitive } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { formatPrice } from "@/lib/money";
import { formatDate } from "@/lib/utils";
import { ORDER_STATUSES, ORDER_STATUS_LABELS } from "@/lib/constants";
import {
  Card,
  EmptyRow,
  PageHeader,
  Pill,
  StatCard,
  Table,
  Td,
  Tr,
} from "@/components/admin/ui";
import { OrderStatusPill } from "@/components/account/OrderStatusPill";
import { cn } from "@/lib/utils";
export const dynamic = "force-dynamic";
const PAGE_SIZE = 30;
export default async function AdminOrdersPage({ searchParams }) {
  await requireAdmin();
  const params = await searchParams;
  const page = Math.max(1, Number(params.page ?? 1) || 1);
  const where = {
    ...(params.status && params.status !== "all" ? { status: params.status } : {}),
    ...(params.payment ? { paymentStatus: params.payment } : {}),
    ...(params.q
      ? {
          OR: [
            { orderNumber: { contains: params.q, ...insensitive } },
            { email: { contains: params.q, ...insensitive } },
            { shippingName: { contains: params.q, ...insensitive } },
            { shippingPhone: { contains: params.q, ...insensitive } },
          ],
        }
      : {}),
  };
  const [orders, total, counts, revenueToday, unfulfilled] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy: { placedAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        orderNumber: true,
        placedAt: true,
        status: true,
        paymentStatus: true,
        paymentProvider: true,
        grandTotal: true,
        shippingName: true,
        shippingCity: true,
        email: true,
        items: { select: { id: true, quantity: true } },
      },
    }),
    prisma.order.count({ where }),
    prisma.order.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.order.aggregate({
      where: {
        paymentStatus: "paid",
        placedAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
      },
      _sum: { grandTotal: true },
      _count: { _all: true },
    }),
    prisma.order.count({
      where: { status: { in: ["confirmed", "processing", "packed"] } },
    }),
  ]);
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const byStatus = Object.fromEntries(
    counts.map((row) => [row.status, row._count._all]),
  );
  return (
    <>
      <PageHeader
        title="Orders"
        description="Newest first. Changing an order's status also moves its stock — dispatching commits it, cancelling returns it."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Revenue today"
          value={formatPrice(revenueToday._sum.grandTotal ?? 0)}
        />
        <StatCard label="Paid orders today" value={String(revenueToday._count._all)} />
        <StatCard
          label="Awaiting dispatch"
          value={String(unfulfilled)}
          tone={unfulfilled > 0 ? "warning" : "default"}
        />
        <StatCard label="All orders" value={String(total)} />
      </div>

      {/* Status filter */}
      <nav aria-label="Filter orders" className="mt-8 flex flex-wrap gap-1">
        <FilterLink
          href="/admin/orders"
          active={!params.status || params.status === "all"}
        >
          All
        </FilterLink>
        {ORDER_STATUSES.map((status) => (
          <FilterLink
            key={status}
            href={`/admin/orders?status=${status}`}
            active={params.status === status}
            count={byStatus[status]}
          >
            {ORDER_STATUS_LABELS[status]}
          </FilterLink>
        ))}
      </nav>

      <Card className="mt-6" padded={false}>
        <Table
          head={[
            "Order",
            "Customer",
            { label: "Items", align: "right" },
            { label: "Status", align: "center" },
            { label: "Payment", align: "center" },
            { label: "Total", align: "right" },
          ]}
        >
          {orders.length === 0 ? (
            <EmptyRow colSpan={6}>
              {params.q
                ? `No orders matched “${params.q}”.`
                : "No orders match this filter."}
            </EmptyRow>
          ) : (
            orders.map((order) => (
              <Tr key={order.id}>
                <Td>
                  <Link
                    href={`/admin/orders/${order.id}`}
                    className="tabular-nums text-cream-50 hover:text-gold-300"
                  >
                    {order.orderNumber}
                  </Link>
                  <span className="mt-0.5 block text-xs text-cream-400">
                    {formatDate(order.placedAt, { hour: "numeric", minute: "2-digit" })}
                  </span>
                </Td>

                <Td>
                  <span className="block text-cream-100">{order.shippingName}</span>
                  <span className="mt-0.5 block truncate text-xs text-cream-400">
                    {order.shippingCity} · {order.email}
                  </span>
                </Td>

                <Td align="right" className="tabular-nums text-cream-400">
                  {order.items.reduce((sum, item) => sum + item.quantity, 0)}
                </Td>

                <Td align="center">
                  <OrderStatusPill status={order.status} />
                </Td>

                <Td align="center">
                  <Pill
                    tone={
                      order.paymentStatus === "paid"
                        ? "success"
                        : order.paymentStatus === "failed"
                          ? "danger"
                          : order.paymentStatus === "refunded"
                            ? "danger"
                            : "neutral"
                    }
                  >
                    {order.paymentStatus}
                  </Pill>
                  {order.paymentProvider === "cod" ? (
                    <span className="mt-1 block text-[0.58rem] uppercase tracking-[0.12em] text-cream-400">
                      COD
                    </span>
                  ) : null}
                </Td>

                <Td align="right" className="tabular-nums text-cream-50">
                  {formatPrice(order.grandTotal)}
                </Td>
              </Tr>
            ))
          )}
        </Table>
      </Card>

      {pages > 1 ? (
        <nav aria-label="Pagination" className="mt-6 flex items-center justify-between">
          <p className="text-xs tabular-nums text-cream-400">
            Page {page} of {pages}
          </p>
          <div className="flex gap-2">
            {page > 1 ? (
              <PageLink params={params} page={page - 1}>
                Previous
              </PageLink>
            ) : null}
            {page < pages ? (
              <PageLink params={params} page={page + 1}>
                Next
              </PageLink>
            ) : null}
          </div>
        </nav>
      ) : null}
    </>
  );
}
function FilterLink({ href, active, count, children }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "border px-3.5 py-2 text-[0.64rem] uppercase tracking-[0.12em] transition-colors",
        active
          ? "border-gold-400 text-cream-50"
          : "border-border-subtle text-cream-400 hover:border-border-strong hover:text-cream-100",
      )}
    >
      {children}
      {count ? (
        <span className="ml-1.5 tabular-nums text-cream-400">{count}</span>
      ) : null}
    </Link>
  );
}
function PageLink({ params, page, children }) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value && key !== "page") search.set(key, value);
  }
  if (page > 1) search.set("page", String(page));
  return (
    <Link
      href={`/admin/orders${search.toString() ? `?${search}` : ""}`}
      className="border border-border-subtle px-4 py-2 text-xs text-cream-300 hover:border-border-strong hover:text-cream-50"
    >
      {children}
    </Link>
  );
}
