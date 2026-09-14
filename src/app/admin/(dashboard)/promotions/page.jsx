import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { formatPrice } from "@/lib/money";
import { formatDate } from "@/lib/utils";
import { PageHeader, Card, StatCard } from "@/components/admin/ui";
import { RecordManager } from "@/components/admin/RecordManager";
import { deleteCouponAction, saveCouponAction } from "@/app/actions/admin/content";
export const dynamic = "force-dynamic";
const FIELDS = [
  {
    name: "code",
    label: "Code",
    type: "text",
    required: true,
    half: true,
    placeholder: "FIRSTLEAF",
    hint: "Letters, numbers, hyphen and underscore. Saved in upper case.",
  },
  {
    name: "kind",
    label: "Type",
    type: "select",
    half: true,
    options: [
      { value: "percentage", label: "Percentage off" },
      { value: "fixed", label: "Fixed amount off (₹)" },
      { value: "free_shipping", label: "Free shipping" },
    ],
  },
  {
    name: "description",
    label: "Description",
    type: "text",
    maxLength: 200,
    hint: "Shown in the cart when the code is applied.",
  },
  {
    name: "value",
    label: "Value",
    type: "number",
    half: true,
    hint: "Percent (1–100) or rupees, depending on the type. Ignored for free shipping.",
  },
  {
    name: "maxDiscount",
    label: "Maximum discount (₹)",
    type: "number",
    half: true,
    hint: "Optional cap on a percentage discount.",
  },
  {
    name: "minSubtotal",
    label: "Minimum cart value (₹)",
    type: "number",
    half: true,
  },
  {
    name: "appliesTo",
    label: "Applies to",
    type: "select",
    half: true,
    options: [
      { value: "all", label: "Any order" },
      { value: "first_order", label: "First order only" },
      { value: "product", label: "Specific products" },
      { value: "category", label: "Specific categories" },
    ],
  },
  {
    name: "appliesToIds",
    label: "Product or category IDs",
    type: "text",
    hint: "Comma separated. Only used for the two 'specific' options above.",
  },
  { name: "usageLimit", label: "Total uses allowed", type: "number", half: true },
  { name: "perUserLimit", label: "Uses per customer", type: "number", half: true },
  { name: "startsAt", label: "Starts", type: "date", half: true },
  { name: "endsAt", label: "Ends", type: "date", half: true },
  { name: "isActive", label: "Active", type: "checkbox" },
];
export default async function AdminPromotionsPage() {
  await requireAdmin();
  const [coupons, redeemed] = await Promise.all([
    prisma.coupon.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.order.aggregate({
      where: { couponCode: { not: null }, paymentStatus: "paid" },
      _sum: { discountTotal: true },
      _count: { _all: true },
    }),
  ]);
  const active = coupons.filter((coupon) => coupon.isActive).length;
  return (
    <>
      <PageHeader
        title="Promotions"
        description="Discount codes customers enter in the cart. Every code is validated server-side against its own rules before any discount is applied."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Codes" value={String(coupons.length)} />
        <StatCard label="Active" value={String(active)} />
        <StatCard label="Orders with a code" value={String(redeemed._count._all)} />
        <StatCard
          label="Discount given"
          value={formatPrice(redeemed._sum.discountTotal ?? 0)}
          hint="On paid orders"
        />
      </div>

      <Card className="mt-8 mb-6">
        <p className="text-sm leading-relaxed text-cream-300">
          A code that has already been redeemed is deactivated rather than deleted, so
          the discount stays attached to the orders that used it.
        </p>
      </Card>

      <RecordManager
        title="Discount codes"
        addLabel="Create a code"
        emptyMessage="No discount codes yet."
        deleteWarning="Unused codes are deleted outright. Codes that have already been redeemed are deactivated instead, so your order records stay intact."
        fields={FIELDS}
        saveAction={saveCouponAction}
        deleteAction={deleteCouponAction}
        records={coupons.map((coupon) => ({
          id: coupon.id,
          title: coupon.code,
          subtitle: [
            coupon.description,
            coupon.kind === "percentage"
              ? `${coupon.value}% off`
              : coupon.kind === "fixed"
                ? `${formatPrice(coupon.value)} off`
                : "Free shipping",
            coupon.minSubtotal > 0 ? `over ${formatPrice(coupon.minSubtotal)}` : null,
            coupon.endsAt ? `until ${formatDate(coupon.endsAt)}` : null,
          ]
            .filter(Boolean)
            .join(" · "),
          badges: [
            coupon.isActive
              ? { label: "Active", tone: "success" }
              : { label: "Inactive", tone: "neutral" },
            ...(coupon.usageCount > 0
              ? [
                  {
                    label: `Used ${coupon.usageCount}${coupon.usageLimit ? `/${coupon.usageLimit}` : ""}`,
                    tone: "info",
                  },
                ]
              : []),
          ],
          values: {
            code: coupon.code,
            kind: coupon.kind,
            description: coupon.description ?? "",
            // Percentages are stored raw; money is stored in paise.
            value: coupon.kind === "percentage" ? coupon.value : coupon.value / 100,
            maxDiscount: coupon.maxDiscount ? coupon.maxDiscount / 100 : "",
            minSubtotal: coupon.minSubtotal / 100,
            appliesTo: coupon.appliesTo,
            appliesToIds: coupon.appliesToIds ?? "",
            usageLimit: coupon.usageLimit ?? "",
            perUserLimit: coupon.perUserLimit ?? "",
            startsAt: coupon.startsAt ? coupon.startsAt.toISOString().slice(0, 10) : "",
            endsAt: coupon.endsAt ? coupon.endsAt.toISOString().slice(0, 10) : "",
            isActive: coupon.isActive,
          },
        }))}
      />
    </>
  );
}
