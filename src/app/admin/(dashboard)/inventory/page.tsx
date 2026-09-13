import Link from "next/link";
import { prisma, insensitive } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { formatDate } from "@/lib/utils";
import { Card, EmptyRow, PageHeader, Pill, StatCard, Table, Td, Tr } from "@/components/admin/ui";
import { InventoryRow } from "@/components/admin/InventoryRow";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminInventoryPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string; q?: string }>;
}) {
  await requireAdmin();
  const params = await searchParams;

  const rows = await prisma.inventory.findMany({
    where: {
      ...(params.q
        ? {
            variant: {
              OR: [
                { name: { contains: params.q, ...insensitive } },
                { sku: { contains: params.q, ...insensitive } },
                { product: { name: { contains: params.q, ...insensitive } } },
              ],
            },
          }
        : {}),
    },
    // Lowest stock first, because that is what needs attention. The SKU is the
    // tiebreaker: dozens of variants sit on the same opening quantity, and
    // without it the database is free to return them in a different order on
    // every refresh, so the table reshuffled under the cursor after each
    // adjustment.
    orderBy: [{ onHand: "asc" }, { variant: { sku: "asc" } }],
    select: {
      id: true,
      onHand: true,
      reserved: true,
      lowStockAt: true,
      trackInventory: true,
      updatedAt: true,
      variant: {
        select: {
          id: true,
          name: true,
          sku: true,
          isActive: true,
          product: { select: { id: true, name: true, status: true } },
        },
      },
      movements: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { delta: true, reason: true, createdAt: true },
      },
    },
  });

  const filtered = rows.filter((row) => {
    const available = row.onHand - row.reserved;
    if (params.filter === "low") return row.trackInventory && available <= row.lowStockAt;
    if (params.filter === "out") return row.trackInventory && available <= 0;
    return true;
  });

  const totalUnits = rows.reduce((sum, row) => sum + row.onHand, 0);
  const reservedUnits = rows.reduce((sum, row) => sum + row.reserved, 0);
  const lowCount = rows.filter(
    (row) => row.trackInventory && row.onHand - row.reserved <= row.lowStockAt,
  ).length;
  const outCount = rows.filter(
    (row) => row.trackInventory && row.onHand - row.reserved <= 0,
  ).length;

  return (
    <>
      <PageHeader
        title="Inventory"
        description="Available stock is on-hand minus units reserved by open orders. Every adjustment is recorded with a reason."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Units on hand" value={String(totalUnits)} />
        <StatCard label="Reserved" value={String(reservedUnits)} hint="Held by open orders" />
        <StatCard
          label="Low stock"
          value={String(lowCount)}
          tone={lowCount > 0 ? "warning" : "default"}
        />
        <StatCard
          label="Out of stock"
          value={String(outCount)}
          tone={outCount > 0 ? "danger" : "default"}
        />
      </div>

      <nav aria-label="Filter inventory" className="mt-8 flex flex-wrap gap-1">
        <FilterLink href="/admin/inventory" active={!params.filter}>
          All variants
        </FilterLink>
        <FilterLink href="/admin/inventory?filter=low" active={params.filter === "low"}>
          Low stock
        </FilterLink>
        <FilterLink href="/admin/inventory?filter=out" active={params.filter === "out"}>
          Out of stock
        </FilterLink>
      </nav>

      <Card className="mt-6" padded={false}>
        <Table
          head={[
            "Product",
            "Variant",
            "SKU",
            { label: "On hand", align: "right" },
            { label: "Reserved", align: "right" },
            { label: "Available", align: "right" },
            "Last movement",
            { label: "Adjust", align: "right", width: "18rem" },
          ]}
        >
          {filtered.length === 0 ? (
            <EmptyRow colSpan={8}>
              {params.filter === "low"
                ? "Nothing is running low. "
                : params.filter === "out"
                  ? "Nothing is out of stock. "
                  : "No variants yet."}
              {params.filter ? (
                <Link href="/admin/inventory" className="underline underline-offset-4">
                  View all
                </Link>
              ) : null}
            </EmptyRow>
          ) : (
            filtered.map((row) => {
              const available = row.onHand - row.reserved;
              const last = row.movements[0];

              return (
                <Tr key={row.id}>
                  <Td>
                    <Link
                      href={`/admin/products/${row.variant.product.id}`}
                      className="text-cream-50 hover:text-gold-300"
                    >
                      {row.variant.product.name}
                    </Link>
                    {row.variant.product.status !== "published" ? (
                      <Pill className="ml-2">{row.variant.product.status}</Pill>
                    ) : null}
                  </Td>

                  <Td>
                    {row.variant.name}
                    {!row.variant.isActive ? (
                      <Pill className="ml-2">Hidden</Pill>
                    ) : null}
                  </Td>

                  <Td className="text-xs text-cream-400">{row.variant.sku ?? "—"}</Td>

                  <Td align="right" className="tabular-nums">
                    {row.trackInventory ? row.onHand : "—"}
                  </Td>

                  <Td align="right" className="tabular-nums text-cream-400">
                    {row.reserved}
                  </Td>

                  <Td align="right">
                    {!row.trackInventory ? (
                      <Pill>Untracked</Pill>
                    ) : (
                      <Pill
                        tone={
                          available <= 0
                            ? "danger"
                            : available <= row.lowStockAt
                              ? "warning"
                              : "success"
                        }
                      >
                        {available}
                      </Pill>
                    )}
                  </Td>

                  <Td className="text-xs text-cream-400">
                    {last ? (
                      <>
                        <span className={last.delta > 0 ? "text-leaf-300" : "text-[#e0a19c]"}>
                          {last.delta > 0 ? "+" : ""}
                          {last.delta}
                        </span>{" "}
                        {last.reason}
                        <span className="mt-0.5 block">{formatDate(last.createdAt)}</span>
                      </>
                    ) : (
                      "—"
                    )}
                  </Td>

                  <Td align="right">
                    <InventoryRow variantId={row.variant.id} onHand={row.onHand} />
                  </Td>
                </Tr>
              );
            })
          )}
        </Table>
      </Card>
    </>
  );
}

function FilterLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
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
    </Link>
  );
}
