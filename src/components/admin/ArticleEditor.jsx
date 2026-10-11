"use client";
import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { Input, Textarea, FormMessage } from "@/components/ui/Field";
import { Card, FieldGroup } from "@/components/admin/ui";
import { RichTextEditor } from "@/components/admin/RichTextEditor";
import SearchableSelect from "@/components/ui/SearchableSelect";
import {
  saveArticleAction,
  createArticleCategoryInlineAction,
  deleteArticleCategoryInlineAction,
} from "@/app/actions/admin/content";
import { readingMinutes, slugify } from "@/lib/utils";
const INITIAL = { status: "idle" };
export function ArticleEditor({ draft, categories }) {
  const [state, action] = useActionState(saveArticleAction, INITIAL);
  const [title, setTitle] = useState(draft.title);
  const [slug, setSlug] = useState(draft.slug);
  const [slugTouched, setSlugTouched] = useState(Boolean(draft.slug));
  const [content, setContent] = useState(draft.content);
  const [excerpt, setExcerpt] = useState(draft.excerpt);
  const [categoryId, setCategoryId] = useState(draft.categoryId ?? "");
  const [categoryList, setCategoryList] = useState(categories || []);

  useEffect(() => {
    setCategoryList(categories || []);
  }, [categories]);

  const handleAddNewCategory = async (name) => {
    const res = await createArticleCategoryInlineAction(name);
    if (res?.success && res.data) {
      setCategoryList((prev) => {
        if (prev.some((c) => c.id === res.data.id)) return prev;
        return [...prev, res.data];
      });
    }
    return res;
  };

  const handleDeleteCategory = async (cat) => {
    const res = await deleteArticleCategoryInlineAction(cat.id);
    if (res?.success) {
      setCategoryList((prev) => prev.filter((c) => c.id !== cat.id));
      if (categoryId === cat.id) {
        setCategoryId("");
      }
      return { success: true };
    }
    return { success: false, error: res?.error || "Failed to delete category" };
  };

  useEffect(() => {
    if (!slugTouched) setSlug(slugify(title));
  }, [title, slugTouched]);
  const errors = state.status === "error" ? (state.errors ?? {}) : {};
  const minutes = readingMinutes(content);
  return (
    <form
      action={action}
      className="grid gap-6 xl:grid-cols-[1fr_18rem] xl:items-start"
    >
      {draft.id ? <input type="hidden" name="id" value={draft.id} /> : null}
      <input type="hidden" name="content" value={content} />

      <div className="grid gap-6">
        {state.status === "error" ? (
          <FormMessage>{state.message}</FormMessage>
        ) : null}
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

        <Card
          title="Body"
          description={`About ${minutes} minute${minutes === 1 ? "" : "s"} to read.`}
        >
          <RichTextEditor
            label="Content"
            value={content}
            onChange={setContent}
            rows={22}
          />
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
            <SearchableSelect
              label="Category"
              value={categoryId}
              onChange={(val) => setCategoryId(val)}
              valueKey="id"
              displayKey="name"
              placeholder="Select a category..."
              options={[
                { id: "", name: "Uncategorised", canDelete: false },
                ...categoryList,
              ]}
              fetchFn={async (search) => {
                const list = [
                  { id: "", name: "Uncategorised", canDelete: false },
                  ...categoryList,
                ];
                const filtered = list.filter((c) =>
                  c.name.toLowerCase().includes(search.toLowerCase()),
                );
                return {
                  success: true,
                  data: filtered,
                  pagination: { hasMore: false },
                };
              }}
              onAddNew={handleAddNewCategory}
              onDelete={handleDeleteCategory}
              deleteConfirmTitle={(item) => `Delete “${item.name}”?`}
              deleteConfirmBody={(item) =>
                `Are you sure you want to delete category “${item.name}”? Any articles using this metadata will be replaced with Uncategorised.`
              }
              error={errors.categoryId}
            />
            <input
              type="hidden"
              name="categoryId"
              value={categoryId || ""}
            />
            <Input
              label="Author"
              name="authorName"
              defaultValue={draft.authorName}
            />
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
function Save({ isNew }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full bg-emerald-500 px-5 py-3 text-[0.7rem] font-medium uppercase tracking-[0.14em] text-on-accent transition-colors hover:bg-emerald-400 disabled:opacity-60"
    >
      {pending ? "Saving…" : isNew ? "Create article" : "Save changes"}
    </button>
  );
}
