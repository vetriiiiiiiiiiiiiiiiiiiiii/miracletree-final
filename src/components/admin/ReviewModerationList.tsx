"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Rating } from "@/components/ui/Rating";
import { Card, Pill } from "@/components/admin/ui";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { deleteReviewAction, moderateReviewAction } from "@/app/actions/admin/content";
import { cn } from "@/lib/utils";

export type ModerationReview = {
  id: string;
  authorName: string;
  authorEmail: string | null;
  rating: number;
  title: string | null;
  body: string;
  status: "pending" | "approved" | "rejected";
  isVerified: boolean;
  isFeatured: boolean;
  createdAt: string;
  hasAccount: boolean;
  product: { id: string; name: string; slug: string };
};

export function ReviewModerationList({ reviews }: { reviews: ModerationReview[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<ModerationReview | null>(null);
  const [, startTransition] = useTransition();

  const run = async (
    id: string,
    fn: () => Promise<{ ok: boolean; error?: string }>,
  ) => {
    setBusy(id);
    setError(null);
    const result = await fn();
    setBusy(null);
    if (!result.ok) {
      setError(result.error ?? "That didn't work.");
      return;
    }
    startTransition(() => router.refresh());
  };

  return (
    <div className="grid gap-4">
      {error ? (
        <p className="border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-[#f0b3b0]" role="alert">
          {error}
        </p>
      ) : null}

      {reviews.map((review) => (
        <Card key={review.id}>
          <div className="grid gap-5 lg:grid-cols-[1fr_15rem] lg:gap-8">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-3">
                <Rating value={review.rating} count={1} showCount={false} size="sm" />
                <Pill
                  tone={
                    review.status === "approved"
                      ? "success"
                      : review.status === "rejected"
                        ? "danger"
                        : "warning"
                  }
                >
                  {review.status}
                </Pill>
                {review.isVerified ? <Pill tone="success">Verified purchase</Pill> : null}
                {review.isFeatured ? <Pill tone="info">Featured</Pill> : null}
                {!review.hasAccount ? <Pill>Guest</Pill> : null}
              </div>

              {review.title ? (
                <h3 className="mt-4 text-[1.05rem] text-cream-50">{review.title}</h3>
              ) : null}

              <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-cream-300">
                {review.body}
              </p>

              <p className="mt-4 text-xs text-cream-400">
                {review.authorName}
                {review.authorEmail ? ` · ${review.authorEmail}` : ""} · {review.createdAt}
                {" · on "}
                <Link
                  href={`/admin/products/${review.product.id}`}
                  className="underline underline-offset-4 hover:text-cream-100"
                >
                  {review.product.name}
                </Link>
              </p>
            </div>

            <div className="grid gap-2 lg:border-l lg:border-white/10 lg:pl-8">
              {review.status !== "approved" ? (
                <Action
                  busy={busy === review.id}
                  tone="primary"
                  onClick={() =>
                    run(review.id, () =>
                      moderateReviewAction({ reviewId: review.id, status: "approved" }),
                    )
                  }
                >
                  Approve &amp; publish
                </Action>
              ) : (
                <Action
                  busy={busy === review.id}
                  onClick={() =>
                    run(review.id, () =>
                      moderateReviewAction({ reviewId: review.id, status: "pending" }),
                    )
                  }
                >
                  Unpublish
                </Action>
              )}

              {review.status !== "rejected" ? (
                <Action
                  busy={busy === review.id}
                  onClick={() =>
                    run(review.id, () =>
                      moderateReviewAction({ reviewId: review.id, status: "rejected" }),
                    )
                  }
                >
                  Reject
                </Action>
              ) : null}

              <Action
                busy={busy === review.id}
                onClick={() =>
                  run(review.id, () =>
                    moderateReviewAction({
                      reviewId: review.id,
                      isFeatured: !review.isFeatured,
                    }),
                  )
                }
              >
                {review.isFeatured ? "Unfeature" : "Feature on homepage"}
              </Action>

              {!review.isVerified ? (
                <Action
                  busy={busy === review.id}
                  onClick={() =>
                    run(review.id, () =>
                      moderateReviewAction({ reviewId: review.id, isVerified: true }),
                    )
                  }
                >
                  Mark verified
                </Action>
              ) : null}

              <button
                type="button"
                onClick={() => setDeleting(review)}
                className="mt-1 text-xs text-cream-400 underline underline-offset-4 transition-colors hover:text-danger"
              >
                Delete permanently
              </button>
            </div>
          </div>
        </Card>
      ))}

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete this review?"
        body="It is removed permanently. If you only want it off the storefront, reject it instead — rejected reviews stay in your records."
        confirmLabel="Delete permanently"
        tone="danger"
        onCancel={() => setDeleting(null)}
        onConfirm={() => {
          const target = deleting;
          setDeleting(null);
          if (target) void run(target.id, () => deleteReviewAction(target.id));
        }}
      />
    </div>
  );
}

function Action({
  children,
  onClick,
  busy,
  tone,
}: {
  children: React.ReactNode;
  onClick: () => void;
  busy: boolean;
  tone?: "primary";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      className={cn(
        "w-full px-4 py-2.5 text-[0.66rem] uppercase tracking-[0.12em] transition-colors disabled:opacity-50",
        tone === "primary"
          ? "bg-emerald-500 text-cream-50 hover:bg-emerald-400"
          : "border border-white/18 text-cream-200 hover:border-cream-100",
      )}
    >
      {children}
    </button>
  );
}
