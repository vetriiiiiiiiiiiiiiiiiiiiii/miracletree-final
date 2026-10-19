"use client";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { ReviewForm } from "@/components/product/ProductReviews";
/** "Review MiracleTree" — a review of the brand as a whole, on /reviews. */
export function StoreReviewPrompt() {
  const [open, setOpen] = useState(false);
  if (!open) {
    return (
      <Button variant="primary" size="md" onClick={() => setOpen(true)}>
        Review MiracleTree
      </Button>
    );
  }
  return (
    <div className="mt-2">
      <ReviewForm productId="store" productName="MiracleTree" user={null} onDone={() => setOpen(false)} />
    </div>
  );
}
