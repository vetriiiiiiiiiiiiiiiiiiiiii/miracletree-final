"use client";
import Image from "next/image";
import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Rating, RatingInput } from "@/components/ui/Rating";
import { Input, Textarea, FormMessage } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { submitReviewAction } from "@/app/actions/reviews";
import { formatDate } from "@/lib/utils";
const INITIAL = { status: "idle" };
export function ProductReviews({
  productId,
  productName,
  reviews,
  average,
  count,
  breakdown,
  user,
  canReview,
}) {
  const [writing, setWriting] = useState(false);
  const [visible, setVisible] = useState(4);
  const verifiedCount = reviews.filter((r) => r.isVerified).length;
  return (
    <div className="grid gap-12 lg:grid-cols-[20rem_1fr] lg:gap-16">
      {/* Summary */}
      <div className="lg:sticky lg:top-28 lg:self-start">
        {count > 0 ? (
          <>
            <p className="flex items-baseline gap-3">
              <span
                className="text-[3rem] leading-none text-cream-50"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {average?.toFixed(1)}
              </span>
              <span className="text-sm text-cream-400">out of 5</span>
            </p>

            <div className="mt-3">
              <Rating
                value={average}
                count={count}
                size="md"
                showCount={false}
              />
              {/* "6 verified reviews" over six reviews of which one carries a
                  purchase badge is a claim, not a count. The count is the
                  count; how many are verified purchases is stated separately,
                  and only when some are. */}
              <p className="mt-2 text-xs text-cream-400">
                {count} {count === 1 ? "review" : "reviews"}
                {verifiedCount > 0 ? (
                  <>
                    {" · "}
                    {verifiedCount} verified{" "}
                    {verifiedCount === 1 ? "purchase" : "purchases"}
                  </>
                ) : null}
              </p>
            </div>

            <ul className="mt-7 grid gap-2">
              {breakdown.map((row) => (
                <li key={row.star} className="flex items-center gap-3 text-xs">
                  <span className="w-8 tabular-nums text-cream-400">
                    {row.star}★
                  </span>
                  <span className="h-1 flex-1 bg-border-subtle">
                    <span
                      className="block h-1 bg-gold-400"
                      style={{
                        width: count ? `${(row.count / count) * 100}%` : "0%",
                      }}
                    />
                  </span>
                  <span className="w-6 text-right tabular-nums text-cream-400">
                    {row.count}
                  </span>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <div>
            <p className="text-title text-cream-50">No reviews yet</p>
            <p className="mt-4 text-sm leading-relaxed text-cream-400">
              We publish reviews only after checking them, and we never write
              our own. If you have used this product, yours would be the first.
            </p>
          </div>
        )}

        {!writing && canReview ? (
          <Button
            variant="secondary"
            size="md"
            className="mt-8 w-full"
            onClick={() => setWriting(true)}
          >
            Write a review
          </Button>
        ) : null}
      </div>

      {/* List + form */}
      <div>
        {writing ? (
          <ReviewForm
            productId={productId}
            productName={productName}
            user={user}
            onDone={() => setWriting(false)}
          />
        ) : null}

        {reviews.length ? (
          <>
            <ul className="grid gap-0 divide-y divide-border-subtle border-t border-border-subtle">
              {reviews.slice(0, visible).map((review) => (
                <li key={review.id} className="py-8">
                  <div className="flex flex-wrap items-center gap-3">
                    <Rating
                      value={review.rating}
                      count={1}
                      showCount={false}
                      size="sm"
                    />
                    {review.isVerified ? (
                      <span className="border border-emerald-400/30 px-2 py-0.5 text-[0.58rem] uppercase tracking-[0.12em] text-leaf-300">
                        Verified purchase
                      </span>
                    ) : null}
                  </div>

                  {review.title ? (
                    <h3 className="mt-4 text-[1.1rem] text-cream-50">
                      {review.title}
                    </h3>
                  ) : null}

                  <p className="mt-3 leading-relaxed text-cream-300">
                    {review.body}
                  </p>

                  {review.imageUrl ? (
                    <div className="mt-4">
                      <Image
                        src={review.imageUrl}
                        alt="Customer photo"
                        width={120}
                        height={120}
                        className="rounded-sm object-cover"
                        unoptimized={
                          typeof review.imageUrl === "string"
                            ? review.imageUrl.startsWith("/uploads/")
                            : undefined
                        }
                      />
                    </div>
                  ) : null}

                  <p className="mt-4 text-xs text-cream-400">
                    {review.authorName} · {formatDate(review.createdAt)}
                  </p>
                </li>
              ))}
            </ul>

            {visible < reviews.length ? (
              <Button
                variant="ghost"
                size="md"
                className="mt-6"
                onClick={() => setVisible((v) => v + 6)}
              >
                Show more reviews
              </Button>
            ) : null}
          </>
        ) : null}
      </div>
    </div>
  );
}
function ReviewForm({ productId, productName, user, onDone }) {
  const [state, action] = useActionState(submitReviewAction, INITIAL);
  const [rating, setRating] = useState(0);
  const [imageUrl, setImageUrl] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);

  const handleUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadError(null);

    const body = new FormData();
    body.set("file", file);

    try {
      const response = await fetch("/api/upload", { method: "POST", body });
      const data = await response.json();

      if (!response.ok) {
        setUploadError(data.error ?? "Upload failed.");
      } else {
        setImageUrl(data.url);
      }
    } catch {
      setUploadError("Could not upload image. Check your connection.");
    } finally {
      setUploading(false);
    }
  };

  if (state.status === "success") {
    return (
      <div className="mb-10 border border-emerald-400/30 bg-emerald-500/8 p-6">
        <FormMessage tone="success">{state.message}</FormMessage>
        <Button variant="ghost" size="sm" className="mt-4" onClick={onDone}>
          Close
        </Button>
      </div>
    );
  }
  return (
    <form
      action={action}
      className="mb-12 grid gap-5 border border-border-subtle p-6 md:p-8"
    >
      <input type="hidden" name="productId" value={productId} />
      <input type="hidden" name="rating" value={rating} />
      {imageUrl ? (
        <input type="hidden" name="imageUrl" value={imageUrl} />
      ) : null}

      <div>
        <h3 className="text-title text-cream-50">Review {productName}</h3>
        <p className="mt-2 text-sm text-cream-400">
          Reviews are checked before they appear. Please describe your own
          experience.
        </p>
      </div>

      {state.status === "error" ? (
        <FormMessage>{state.message}</FormMessage>
      ) : null}

      <div>
        <p className="eyebrow mb-2 text-cream-400">Your rating *</p>
        <RatingInput name="rating-input" value={rating} onChange={setRating} />
        {state.status === "error" && state.errors?.rating ? (
          <p className="mt-1 text-xs text-danger" role="alert">
            {state.errors.rating}
          </p>
        ) : null}
      </div>

      <Input
        label="Headline"
        name="title"
        placeholder="Sum it up in a few words"
        maxLength={120}
      />

      <Textarea
        label="Your review"
        name="body"
        required
        rows={5}
        placeholder="How did you use it? What did you notice?"
        error={state.status === "error" ? state.errors?.body : undefined}
      />

      <div>
        <p className="eyebrow mb-2 text-cream-400">Photo (optional)</p>
        {imageUrl ? (
          <div className="relative inline-block">
            <Image
              src={imageUrl}
              alt="Uploaded photo"
              width={100}
              height={100}
              className="rounded-sm object-cover"
              unoptimized={
                typeof imageUrl === "string"
                  ? imageUrl.startsWith("/uploads/")
                  : undefined
              }
            />
            <button
              type="button"
              onClick={() => setImageUrl(null)}
              className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-ink text-cream-50 border border-border-subtle"
              aria-label="Remove photo"
            >
              ×
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <label className="cursor-pointer border border-border-subtle px-4 py-2 text-sm text-cream-100 hover:bg-ink-700/60 transition-colors">
              {uploading ? "Uploading..." : "Add photo"}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/avif"
                className="hidden"
                onChange={handleUpload}
                disabled={uploading}
              />
            </label>
            {uploadError ? (
              <p className="text-xs text-danger">{uploadError}</p>
            ) : null}
          </div>
        )}
      </div>

      {user ? (
        <>
          <input
            type="hidden"
            name="authorName"
            value={[user.firstName, user.lastName].filter(Boolean).join(" ")}
          />
          <input type="hidden" name="authorEmail" value={user.email} />
        </>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2">
          <Input
            label="Your name"
            name="authorName"
            required
            error={
              state.status === "error" ? state.errors?.authorName : undefined
            }
          />
          <Input
            label="Email"
            name="authorEmail"
            type="email"
            hint="Not published. Used only to verify your order."
          />
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <SubmitReview />
        <Button type="button" variant="ghost" size="md" onClick={onDone}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
function SubmitReview() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="md" loading={pending}>
      Submit review
    </Button>
  );
}
