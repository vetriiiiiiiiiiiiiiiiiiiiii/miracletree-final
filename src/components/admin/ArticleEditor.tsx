"use client";

import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { Input, Textarea, Select, FormMessage } from "@/components/ui/Field";
import { Card, FieldGroup } from "@/components/admin/ui";
import { RichTextEditor } from "@/components/admin/RichTextEditor";
import { saveArticleAction } from "@/app/actions/admin/content";
import type { FormState } from "@/app/actions/marketing";
import { readingMinutes, slugify } from "@/lib/utils";

const INITIAL: FormState = { status: "idle" };

export type ArticleDraft = {
  id: string | null;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  heroImageUrl: string;
  authorName: string;
  categoryId: string;
  tags: string;
  status: "draft" | "published";
  seoTitle: string;
  seoDescription: string;
};

export function ArticleEditor({
  draft,
  categories,
}: {
  draft: ArticleDraft;
  categories: { id: string; name: string }[];
}) {
  const [state, action] = useActionState(saveArticleAction, INITIAL);
  const [title, setTitle] = useState(draft.title);
  const [slug, setSlug] = useState(draft.slug);
  const [slugTouched, setSlugTouched] = useState(Boolean(draft.slug));
  const [content, setContent] = useState(draft.content);
  const [excerpt, setExcerpt] = useState(draft.excerpt);

  useEffect(() => {
    if (!slugTouched) setSlug(slugify(title));
  }, [title, slugTouched]);

  const errors = state.status === "error" ? (state.errors ?? {}) : {};
  const minutes = readingMinutes(content);

  return (
    <form action={action} className="grid gap-6 xl:grid-cols-[1fr_18rem] xl:items-start">
      {draft.id ? <input type="hidden" name="id" value={draft.id} /> : null}
      <input type="hidden" name="content" value={content} />

      <div className="grid gap-6">
        {state.status === "error" ? <FormMessage>{state.message}</FormMessage> : null}
        {state.status === "success" ? (
          <FormMessage tone="success">{state.message}</FormMessage>
        ) : null}

        <Card>
          <FieldGroup title="The article">
            <Input
              label="Title"
              name="title"
              required
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              error={errors.title}
            />

            <Input
              label="URL slug"
              name="slug"
              required
              value={slug}
              onChange={(event) => {
                setSlugTouched(true);
                setSlug(event.target.value);
              }}
              hint={`Published at /journal/${slug || "…"}`}
              error={errors.slug}
            />

            <Textarea
              label="Excerpt"
              name="excerpt"
              rows={3}
              maxLength={400}
              value={excerpt}
              onChange={(event) => setExcerpt(event.target.value)}
              hint="Shown on the journal index and in link previews."
              error={errors.excerpt}
            />
          </FieldGroup>
        </Card>

        <Card title="Body" description={`About ${minutes} minute${minutes === 1 ? "" : "s"} to read.`}>
          <RichTextEditor label="Content" value={content} onChange={setContent} rows={22} />
          {errors.content ? (
            <p className="mt-2 text-xs text-danger" role="alert">
              {errors.content}
            </p>
          ) : null}
        </Card>

        <Card title="Search appearance">
          <FieldGroup
            title="SEO"
            description="Leave blank to fall back to the title and excerpt."
          >
            <Input
              label="SEO title"
              name="seoTitle"
              maxLength={70}
              defaultValue={draft.seoTitle}
            />
            <Textarea
              label="Meta description"
              name="seoDescription"
              rows={2}
              maxLength={180}
              defaultValue={draft.seoDescription}
            />
          </FieldGroup>
        </Card>
      </div>

      <aside className="grid gap-4 xl:sticky xl:top-24">
        <Card title="Publish">
          <div className="grid gap-4">
            <Select
              label="Status"
              name="status"
              defaultValue={draft.status}
              options={[
                { value: "draft", label: "Draft — not on the site" },
                { value: "published", label: "Published — live and indexed" },
              ]}
            />
            <Save isNew={!draft.id} />
            {draft.id && draft.status === "published" ? (
              <Link
                href={`/journal/${draft.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-center text-xs text-cream-400 underline underline-offset-4 hover:text-cream-100"
              >
                View on site
              </Link>
            ) : null}
          </div>
        </Card>

        <Card title="Details">
          <div className="grid gap-4">
            <Select
              label="Category"
              name="categoryId"
              defaultValue={draft.categoryId}
              options={[
                { value: "", label: "Uncategorised" },
                ...categories.map((c) => ({ value: c.id, label: c.name })),
              ]}
            />
            <Input label="Author" name="authorName" defaultValue={draft.authorName} />
            <Input
              label="Tags"
              name="tags"
              defaultValue={draft.tags}
              hint="Comma separated."
            />
            <Input
              label="Hero image URL"
              name="heroImageUrl"
              defaultValue={draft.heroImageUrl}
              hint="Also used as the social share image."
            />
          </div>
        </Card>
      </aside>
    </form>
  );
}

function Save({ isNew }: { isNew: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full bg-emerald-500 px-5 py-3 text-[0.7rem] font-medium uppercase tracking-[0.14em] text-cream-50 transition-colors hover:bg-emerald-400 disabled:opacity-60"
    >
      {pending ? "Saving…" : isNew ? "Create article" : "Save changes"}
    </button>
  );
}
