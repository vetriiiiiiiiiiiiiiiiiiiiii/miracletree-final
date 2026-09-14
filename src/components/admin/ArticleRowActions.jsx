"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deleteArticleAction } from "@/app/actions/admin/content";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
export function ArticleRowActions({ articleId, slug, status }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState(null);
  const [, startTransition] = useTransition();
  const remove = async () => {
    setConfirming(false);
    const result = await deleteArticleAction(articleId);
    if (!result.ok) {
      setError(result.error ?? "Could not delete that article.");
      return;
    }
    startTransition(() => router.refresh());
  };
  return (
    <div className="flex items-center justify-end gap-3">
      <Link
        href={`/admin/journal/${articleId}`}
        className="text-xs text-cream-300 underline underline-offset-4 hover:text-cream-50"
      >
        Edit
      </Link>

      {status === "published" ? (
        <Link
          href={`/journal/${slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-cream-400 underline underline-offset-4 hover:text-cream-100"
        >
          View
        </Link>
      ) : null}

      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="text-xs text-cream-400 underline underline-offset-4 hover:text-danger"
      >
        Delete
      </button>

      {error ? (
        <span role="alert" className="text-xs text-[#e0a19c]">
          {error}
        </span>
      ) : null}

      <ConfirmDialog
        open={confirming}
        title="Delete this article?"
        body="The article and its URL are removed permanently. If you only want it off the site, set its status to Draft instead."
        confirmLabel="Delete permanently"
        tone="danger"
        onCancel={() => setConfirming(false)}
        onConfirm={() => void remove()}
      />
    </div>
  );
}
