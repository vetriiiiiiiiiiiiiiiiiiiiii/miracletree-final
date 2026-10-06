"use client";

import { useActionState, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createReviewAction } from "@/app/actions/admin/content";
import { Input, Textarea, Select } from "@/components/ui/Field";

const INITIAL = { status: "idle" };

export function ReviewEditor({ products }) {
  const router = useRouter();
  const [state, action] = useActionState(createReviewAction, INITIAL);
  const [busy, setBusy] = useState(false);
  const [, startTransition] = useTransition();

  if (state.status === "success" && !busy) {
    startTransition(() => {
      router.push("/admin/reviews");
    });
  }

  return (
    <div className="max-w-2xl">
      <form
        action={(fd) => {
          setBusy(true);
          action(fd);
        }}
        className="grid gap-6"
      >
        {state.status === "error" ? (
          <p className="border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-[#f0b3b0]">
            {state.message}
          </p>
        ) : null}

        <Select 
          label="Product" 
          name="productId" 
          required
          options={[
            { label: "Select a product...", value: "" },
            ...products.map(p => ({ label: p.name, value: p.id }))
          ]}
        />

        <div className="grid gap-6 sm:grid-cols-2">
          <Input 
            label="Author Name" 
            name="authorName" 
            required 
            error={state.errors?.authorName} 
          />
          <Input 
            label="Author Email" 
            name="authorEmail" 
            type="email" 
          />
        </div>

        <Input 
          label="Rating (1-5)" 
          name="rating" 
          type="number" 
          min="1" 
          max="5" 
          defaultValue="5" 
          required 
        />

        <Input 
          label="Headline" 
          name="title" 
        />

        <Textarea 
          label="Review Body" 
          name="body" 
          required 
          rows={5} 
          error={state.errors?.body} 
        />

        <div className="flex gap-4 border-t border-border-subtle pt-6">
          <button
            type="submit"
            disabled={busy}
            className="inline-flex h-8 items-center bg-gold-400 px-4 text-[0.68rem] uppercase tracking-[0.14em] text-ink transition-colors hover:bg-gold-300 disabled:opacity-50"
          >
            {busy ? "Creating..." : "Create Review"}
          </button>
        </div>
      </form>
    </div>
  );
}
