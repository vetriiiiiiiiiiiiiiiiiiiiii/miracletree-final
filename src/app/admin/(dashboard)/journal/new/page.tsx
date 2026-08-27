import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { PageHeader } from "@/components/admin/ui";
import { ArticleEditor, type ArticleDraft } from "@/components/admin/ArticleEditor";

export const dynamic = "force-dynamic";

const EMPTY: ArticleDraft = {
  id: null,
  title: "",
  slug: "",
  excerpt: "",
  content: "",
  heroImageUrl: "",
  authorName: "Miracle Tree",
  categoryId: "",
  tags: "",
  status: "draft",
  seoTitle: "",
  seoDescription: "",
};

export default async function NewArticlePage() {
  await requireAdmin();

  const categories = await prisma.articleCategory.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  return (
    <>
      <PageHeader
        title="New article"
        description="Write it as a draft, read it back in the preview, then publish."
        breadcrumb={[{ label: "Journal", href: "/admin/journal" }, { label: "New" }]}
      />
      <ArticleEditor draft={EMPTY} categories={categories} />
    </>
  );
}
