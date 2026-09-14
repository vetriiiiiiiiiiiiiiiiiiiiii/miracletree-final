import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { formatPrice } from "@/lib/money";
import { formatDate } from "@/lib/utils";
import { ORDER_STATUS_LABELS } from "@/lib/constants";
import { Card, PageHeader, Pill, Table, Td, Tr } from "@/components/admin/ui";
import { OrderStatusPill } from "@/components/account/OrderStatusPill";
import { OrderControls } from "@/components/admin/OrderControls";
export const dynamic = "force-dynamic";
export default async function AdminOrderPage({ params }) {
  await requireAdmin();
  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: true,
      events: { orderBy: { createdAt: "desc" } },
      user: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          createdAt: true,
          _count: { select: { orders: true } },
        },
      },
    },
  });
  if (!order) notFound();
  return (
    <>
      <PageHeader
        title={order.orderNumber}
        description={`Placed ${formatDate(order.placedAt, { hour: "numeric", minute: "2-digit" })}`}
        breadcrumb={[
          { label: "Orders", href: "/admin/orders" },
          { label: order.orderNumber },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <OrderStatusPill status={order.status} />
            <Pill
              tone={
                order.paymentStatus === "paid"
                  ? "success"
                  : order.paymentStatus === "failed" ||
                      order.paymentStatus === "refunded"
                    ? "danger"
                    : "neutral"
              }
            >
              {order.paymentStatus}
            </Pill>
          </div>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr] xl:items-start">
        <div className="grid gap-6">
          {/* Items */}
          <Card title="Items" padded={false}>
            <Table
              head={[
                "Product",
                "SKU",
                { label: "Unit", align: "right" },
                { label: "Qty", align: "right" },
                { label: "Total", align: "right" },
              ]}
            >
              {order.items.map((item) => (
                <Tr key={item.id}>
                  <Td>
                    <div className="flex items-center gap-3">
                      <div className="relative h-12 w-10 shrink-0 overflow-hidden bg-ink-700">
                        {item.imageUrl ? (
                          <Image
                            src={item.imageUrl}
                            alt=""
                            fill
                            sizes="40px"
                            className="object-contain p-1"
                          />
                        ) : null}
                      </div>
                      <div className="min-w-0">
                        {item.productId ? (
                          <Link
                            href={`/admin/products/${item.productId}`}
                            className="block truncate text-cream-50 hover:text-gold-300"
                          >
                            {item.productName}
                          </Link>
                        ) : (
                          <span className="block truncate text-cream-100">
                            {item.productName}
                          </span>
                        )}
                        <span className="text-xs text-cream-400">
                          {item.variantName}
                        </span>
                      </div>
                    </div>
                  </Td>
                  <Td className="text-xs text-cream-400">{item.sku ?? "—"}</Td>
                  <Td align="right" className="tabular-nums">
                    {formatPrice(item.unitPrice)}
                  </Td>
                  <Td align="right" className="tabular-nums">
                    {item.quantity}
                  </Td>
                  <Td align="right" className="tabular-nums text-cream-50">
                    {formatPrice(item.lineTotal)}
                  </Td>
                </Tr>
              ))}
            </Table>

            <dl className="grid gap-2.5 border-t border-border-subtle p-5 text-sm">
              <Row label="Subtotal" value={formatPrice(order.subtotal)} />
              {order.discountTotal > 0 ? (
                <Row
                  label={`Discount${order.couponCode ? ` (${order.couponCode})` : ""}`}
                  value={`−${formatPrice(order.discountTotal)}`}
                />
              ) : null}
              <Row
                label="Shipping"
                value={
                  order.shippingTotal === 0 ? "Free" : formatPrice(order.shippingTotal)
                }
              />
              <div className="mt-2 flex items-baseline justify-between border-t border-border-subtle pt-3">
                <dt className="text-cream-100">Total</dt>
                <dd className="text-lg tabular-nums text-cream-50">
                  {formatPrice(order.grandTotal)}
                </dd>
              </div>
            </dl>
          </Card>

          {/* Controls */}
          <OrderControls
            orderId={order.id}
            status={order.status}
            paymentStatus={order.paymentStatus}
            trackingNumber={order.trackingNumber}
            trackingUrl={order.trackingUrl}
          />

          {/* Timeline */}
          <Card title="Timeline">
            <ol className="grid gap-4">
              {order.events.map((event) => (
                <li key={event.id} className="grid grid-cols-[9rem_1fr] gap-4 text-sm">
                  <time
                    dateTime={event.createdAt.toISOString()}
                    className="text-xs tabular-nums text-cream-400"
                  >
                    {formatDate(event.createdAt, {
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </time>
                  <div>
                    <p className="text-cream-100">
                      {ORDER_STATUS_LABELS[event.status] ?? event.status}
                    </p>
                    {event.message ? (
                      <p className="mt-0.5 text-cream-400">{event.message}</p>
                    ) : null}
                  </div>
                </li>
              ))}
            </ol>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="grid gap-6">
          <Card title="Customer">
            {order.user ? (
              <div className="grid gap-2 text-sm">
                <Link
                  href={`/admin/customers/${order.user.id}`}
                  className="text-cream-50 hover:text-gold-300"
                >
                  {[order.user.firstName, order.user.lastName]
                    .filter(Boolean)
                    .join(" ") || order.user.email}
                </Link>
                <a
                  href={`mailto:${order.user.email}`}
                  className="text-cream-400 hover:text-cream-100"
                >
                  {order.user.email}
                </a>
                <p className="text-xs text-cream-400">
                  {order.user._count.orders} order
                  {order.user._count.orders === 1 ? "" : "s"} · customer since{" "}
                  {formatDate(order.user.createdAt, { day: undefined })}
                </p>
              </div>
            ) : (
              <div className="grid gap-2 text-sm">
                <p className="text-cream-100">{order.shippingName}</p>
                <a
                  href={`mailto:${order.email}`}
                  className="text-cream-400 hover:text-cream-100"
                >
                  {order.email}
                </a>
                <Pill>Guest checkout</Pill>
              </div>
            )}

            {order.phone ? (
              <a
                href={`tel:${order.phone}`}
                className="mt-3 block text-sm text-cream-300 hover:text-gold-300"
              >
                {order.phone}
              </a>
            ) : null}
          </Card>

          <Card title="Delivery address">
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

            <button
              type="button"
              className="mt-4 text-xs text-cream-400 underline underline-offset-4 hover:text-cream-100"
              // Progressive enhancement: copying is a convenience, and the
              // address is fully readable above without it.
              data-copy={[
                order.shippingName,
                order.shippingLine1,
                order.shippingLine2,
                `${order.shippingCity}, ${order.shippingState} ${order.shippingPostalCode}`,
                order.shippingCountry,
                order.shippingPhone,
              ]
                .filter(Boolean)
                .join("\n")}
            >
              Select to copy
            </button>
          </Card>

          <Card title="Payment">
            <dl className="grid gap-2.5 text-sm">
              <Row
                label="Method"
                value={
                  order.paymentProvider === "cod" ? "Cash on delivery" : "Razorpay"
                }
              />
              <Row label="Status" value={order.paymentStatus} />
              {order.paymentRef ? (
                <div>
                  <dt className="text-cream-400">Reference</dt>
                  <dd className="mt-0.5 break-all font-mono text-xs text-cream-200">
                    {order.paymentRef}
                  </dd>
                </div>
              ) : null}
              {order.paymentOrderId ? (
                <div>
                  <dt className="text-cream-400">Gateway order</dt>
                  <dd className="mt-0.5 break-all font-mono text-xs text-cream-200">
                    {order.paymentOrderId}
                  </dd>
                </div>
              ) : null}
            </dl>
          </Card>

          {order.notes ? (
            <Card title="Customer note">
              <p className="text-sm leading-relaxed text-cream-300">{order.notes}</p>
            </Card>
          ) : null}
        </div>
      </div>
    </>
  );
}
function Row({ label, value }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-cream-400">{label}</dt>
      <dd className="tabular-nums capitalize text-cream-200">{value}</dd>
    </div>
  );
}
