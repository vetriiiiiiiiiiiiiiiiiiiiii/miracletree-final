import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { formatPrice } from "@/lib/money";
import { formatDate } from "@/lib/utils";
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
import { CustomerControls } from "@/components/admin/CustomerControls";
export const dynamic = "force-dynamic";
export default async function AdminCustomerPage({ params }) {
  const admin = await requireAdmin();
  const { id } = await params;
  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      orders: {
        orderBy: { placedAt: "desc" },
        select: {
          id: true,
          orderNumber: true,
          placedAt: true,
          status: true,
          paymentStatus: true,
          grandTotal: true,
          items: { select: { quantity: true } },
        },
      },
      addresses: { orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }] },
      notes: { orderBy: { createdAt: "desc" } },
      reviews: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          rating: true,
          status: true,
          createdAt: true,
          product: { select: { name: true, id: true } },
        },
      },
      wishlistItems: {
        select: { product: { select: { id: true, name: true } } },
      },
    },
  });
  if (!user) notFound();
  const paidOrders = user.orders.filter((order) => order.paymentStatus === "paid");
  const spend = paidOrders.reduce((sum, order) => sum + order.grandTotal, 0);
  const averageOrder = paidOrders.length ? Math.round(spend / paidOrders.length) : 0;
  const name = [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email;
  return (
    <>
      <PageHeader
        title={name}
        description={user.email}
        breadcrumb={[{ label: "Customers", href: "/admin/customers" }, { label: name }]}
        actions={
          <Pill
            tone={
              user.role === "admin"
                ? "warning"
                : user.role === "staff"
                  ? "info"
                  : "neutral"
            }
          >
            {user.role}
          </Pill>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Orders" value={String(user.orders.length)} />
        <StatCard label="Lifetime spend" value={formatPrice(spend)} />
        <StatCard label="Average order" value={formatPrice(averageOrder)} />
        <StatCard
          label="Customer since"
          value={formatDate(user.createdAt, { day: undefined })}
          hint={
            user.lastLoginAt
              ? `Last seen ${formatDate(user.lastLoginAt)}`
              : "Never signed in"
          }
        />
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[1.6fr_1fr] xl:items-start">
        <div className="grid gap-6">
          <Card title="Order history" padded={false}>
            <Table
              head={[
                "Order",
                { label: "Items", align: "right" },
                { label: "Status", align: "center" },
                { label: "Payment", align: "center" },
                { label: "Total", align: "right" },
              ]}
            >
              {user.orders.length === 0 ? (
                <EmptyRow colSpan={5}>This customer hasn&rsquo;t ordered yet.</EmptyRow>
              ) : (
                user.orders.map((order) => (
                  <Tr key={order.id}>
                    <Td>
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="tabular-nums text-cream-50 hover:text-gold-300"
                      >
                        {order.orderNumber}
                      </Link>
                      <span className="mt-0.5 block text-xs text-cream-400">
                        {formatDate(order.placedAt)}
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
                        tone={order.paymentStatus === "paid" ? "success" : "neutral"}
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

          {user.reviews.length ? (
            <Card title="Reviews" padded={false}>
              <Table
                head={[
                  "Product",
                  { label: "Rating", align: "center" },
                  { label: "Status", align: "center" },
                  "Date",
                ]}
              >
                {user.reviews.map((review) => (
                  <Tr key={review.id}>
                    <Td>
                      <Link
                        href={`/admin/products/${review.product.id}`}
                        className="text-cream-100 hover:text-gold-300"
                      >
                        {review.product.name}
                      </Link>
                    </Td>
                    <Td align="center" className="tabular-nums">
                      {review.rating}/5
                    </Td>
                    <Td align="center">
                      <Pill tone={review.status === "approved" ? "success" : "warning"}>
                        {review.status}
                      </Pill>
                    </Td>
                    <Td className="text-xs text-cream-400">
                      {formatDate(review.createdAt)}
                    </Td>
                  </Tr>
                ))}
              </Table>
            </Card>
          ) : null}
        </div>

        <div className="grid gap-6">
          <CustomerControls
            userId={user.id}
            role={user.role}
            canChangeRole={admin.role === "admin" && admin.id !== user.id}
            notes={user.notes.map((note) => ({
              id: note.id,
              body: note.body,
              createdAt: formatDate(note.createdAt),
            }))}
          />

          <Card title="Addresses">
            {user.addresses.length === 0 ? (
              <p className="text-sm text-cream-400">No saved addresses.</p>
            ) : (
              <ul className="grid gap-5">
                {user.addresses.map((address) => (
                  <li key={address.id} className="text-sm">
                    {address.isDefault ? <Pill tone="warning">Default</Pill> : null}
                    <address className="mt-2 not-italic leading-relaxed text-cream-300">
                      {address.firstName} {address.lastName}
                      <br />
                      {address.line1}
                      {address.line2 ? `, ${address.line2}` : ""}
                      <br />
                      {address.city}, {address.state} {address.postalCode}
                      <br />
                      <span className="text-cream-400">{address.phone}</span>
                    </address>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {user.wishlistItems.length ? (
            <Card title="Saved products">
              <ul className="grid gap-2 text-sm">
                {user.wishlistItems.map((item) => (
                  <li key={item.product.id}>
                    <Link
                      href={`/admin/products/${item.product.id}`}
                      className="text-cream-300 hover:text-gold-300"
                    >
                      {item.product.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </Card>
          ) : null}

          <Card title="Marketing">
            <p className="text-sm text-cream-300">
              {user.marketingOptIn
                ? "Opted in to the newsletter."
                : "Not subscribed to the newsletter."}
            </p>
            <p className="mt-2 text-xs text-cream-400">
              Preference is set by the customer and can only be changed by them, or by
              unsubscribing on their behalf on request.
            </p>
          </Card>
        </div>
      </div>
    </>
  );
}
