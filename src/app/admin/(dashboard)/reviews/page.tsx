import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { formatDate } from "@/lib/utils";
import { Card, PageHeader, StatCard } from "@/components/admin/ui";
import { ReviewModerationList } from "@/components/admin/ReviewModerationList";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminReviewsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; product?: string }>;
}) {
  await requireAdmin();
  const params = await searchParams;
  const status = params.status ?? "pending";

  const [reviews, counts, ratingRows] = await Promise.all([
    prisma.review.findMany({
      where: {
        ...(status !== "all" ? { status } : {}),
        ...(params.product ? { productId: params.product } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        id: true,
        authorName: true,
        authorEmail: true,
        rating: true,
        title: true,
        body: true,
        status: true,
        isVerified: true,
        isFeatured: true,
        createdAt: true,
        product: { select: { id: true, name: true, slug: true } },
        user: { select: { id: true, email: true } },
      },
    }),
    prisma.review.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.review.groupBy({
      by: ["rating"],
      where: { status: "approved" },
      _count: { _all: true },
    }),
  ]);

  const byStatus = Object.fromEntries(
    counts.map((row) => [row.status, row._count._all]),
  ) as Record<string, number>;

  const approvedTotal = ratingRows.reduce((sum, row) => sum + row._count._all, 0);
  const average =
    approvedTotal > 0
      ? ratingRows.reduce((sum, row) => sum + row.rating * row._count._all, 0) / approvedTotal
      : null;

  return (
    <>
      <PageHeader
        title="Reviews"
        description="Nothing appears on the storefront until it is approved here. Reviews are never generated — every one was submitted by a visitor."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Awaiting moderation"
          value={String(byStatus.pending ?? 0)}
          tone={(byStatus.pending ?? 0) > 0 ? "warning" : "default"}
        />
        <StatCard label="Approved" value={String(byStatus.approved ?? 0)} />
        <StatCard label="Rejected" value={String(byStatus.rejected ?? 0)} />
        <StatCard
          label="Average rating"
          value={average ? average.toFixed(1) : "—"}
          hint={approvedTotal > 0 ? `across ${approvedTotal} published` : "none published yet"}
        />
      </div>

      <nav aria-label="Filter reviews" className="mt-8 flex flex-wrap gap-1">
        {[
          { value: "pending", label: "Pending" },
          { value: "approved", label: "Approved" },
          { value: "rejected", label: "Rejected" },
          { value: "all", label: "All" },
        ].map((option) => (
          <Link
            key={option.value}
            href={`/admin/reviews?status=${option.value}`}
            aria-current={status === option.value ? "page" : undefined}
            className={cn(
              "border px-3.5 py-2 text-[0.64rem] uppercase tracking-[0.12em] transition-colors",
              status === option.value
                ? "border-gold-400 text-cream-50"
                : "border-white/12 text-cream-400 hover:border-white/28 hover:text-cream-100",
            )}
          >
            {option.label}
            {byStatus[option.value] ? (
              <span className="ml-1.5 tabular-nums text-cream-400/70">
                {byStatus[option.value]}
              </span>
            ) : null}
          </Link>
        ))}
      </nav>

      <div className="mt-6">
        {reviews.length === 0 ? (
          <Card>
            <p className="py-10 text-center text-sm text-cream-400">
              {status === "pending"
                ? "Nothing waiting for moderation."
                : "No reviews in this view."}
            </p>
          </Card>
        ) : (
          <ReviewModerationList
            reviews={reviews.map((review) => ({
              id: review.id,
              authorName: review.authorName,
              authorEmail: review.authorEmail,
              rating: review.rating,
              title: review.title,
              body: review.body,
              status: review.status as "pending" | "approved" | "rejected",
              isVerified: review.isVerified,
              isFeatured: review.isFeatured,
              createdAt: formatDate(review.createdAt),
              hasAccount: Boolean(review.user),
              product: review.product,
            }))}
          />
        )}
      </div>
    </>
  );
}
