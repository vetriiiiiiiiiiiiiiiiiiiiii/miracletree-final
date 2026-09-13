import Link from "next/link";
import { prisma, insensitive } from "@/lib/prisma";
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
export const dynamic = "force-dynamic";
const PAGE_SIZE = 30;
export default async function AdminCustomersPage({ searchParams }) {
  await requireAdmin();
  const params = await searchParams;
  const page = Math.max(1, Number(params.page ?? 1) || 1);
  const where = {
    ...(params.role ? { role: params.role } : {}),
    ...(params.q
      ? {
          OR: [
            { email: { contains: params.q, ...insensitive } },
            { firstName: { contains: params.q, ...insensitive } },
            { lastName: { contains: params.q, ...insensitive } },
            { phone: { contains: params.q, ...insensitive } },
          ],
        }
      : {}),
  };
  const [users, total, subscribers, newsletterCount] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        createdAt: true,
        lastLoginAt: true,
        marketingOptIn: true,
        _count: { select: { orders: true, reviews: true } },
        orders: {
          where: { paymentStatus: "paid" },
          select: { grandTotal: true },
        },
      },
    }),
    prisma.user.count({ where }),
    prisma.newsletterSubscriber.count({ where: { isActive: true } }),
    prisma.user.count({ where: { marketingOptIn: true } }),
  ]);
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  return (
    <>
      <PageHeader
        title="Customers"
        description="Accounts, order history and lifetime spend. Guest orders appear under Orders rather than here."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Accounts" value={String(total)} />
        <StatCard label="Newsletter subscribers" value={String(subscribers)} />
        <StatCard label="Marketing opt-in" value={String(newsletterCount)} />
        <StatCard
          label="With orders"
          value={String(users.filter((u) => u._count.orders > 0).length)}
          hint="on this page"
        />
      </div>

      <Card className="mt-8" padded={false}>
        <Table
          head={[
            "Customer",
            "Contact",
            { label: "Orders", align: "right" },
            { label: "Spent", align: "right" },
            { label: "Role", align: "center" },
            "Joined",
          ]}
        >
          {users.length === 0 ? (
            <EmptyRow colSpan={6}>
              {params.q
                ? `No customers matched “${params.q}”.`
                : "No customer accounts yet."}
            </EmptyRow>
          ) : (
            users.map((user) => {
              const spend = user.orders.reduce(
                (sum, order) => sum + order.grandTotal,
                0,
              );
              const name =
                [user.firstName, user.lastName].filter(Boolean).join(" ") || "—";
              return (
                <Tr key={user.id}>
                  <Td>
                    <Link
                      href={`/admin/customers/${user.id}`}
                      className="text-cream-50 hover:text-gold-300"
                    >
                      {name}
                    </Link>
                    {user.marketingOptIn ? (
                      <Pill className="ml-2">Subscribed</Pill>
                    ) : null}
                  </Td>

                  <Td>
                    <a
                      href={`mailto:${user.email}`}
                      className="block truncate text-cream-300 hover:text-cream-50"
                    >
                      {user.email}
                    </a>
                    {user.phone ? (
                      <span className="mt-0.5 block text-xs text-cream-400">
                        {user.phone}
                      </span>
                    ) : null}
                  </Td>

                  <Td align="right" className="tabular-nums">
                    {user._count.orders}
                  </Td>

                  <Td align="right" className="tabular-nums text-cream-50">
                    {formatPrice(spend)}
                  </Td>

                  <Td align="center">
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
                  </Td>

                  <Td className="text-xs text-cream-400">
                    {formatDate(user.createdAt)}
                    {user.lastLoginAt ? (
                      <span className="mt-0.5 block">
                        last seen {formatDate(user.lastLoginAt)}
                      </span>
                    ) : null}
                  </Td>
                </Tr>
              );
            })
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
              <Link
                href={`/admin/customers?page=${page - 1}`}
                className="border border-border-subtle px-4 py-2 text-xs text-cream-300 hover:border-border-strong"
              >
                Previous
              </Link>
            ) : null}
            {page < pages ? (
              <Link
                href={`/admin/customers?page=${page + 1}`}
                className="border border-border-subtle px-4 py-2 text-xs text-cream-300 hover:border-border-strong"
              >
                Next
              </Link>
            ) : null}
          </div>
        </nav>
      ) : null}
    </>
  );
}
