import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { PageHeader } from "@/components/admin/ui";
import { ArticleEditor } from "@/components/admin/ArticleEditor";
import { formatDate } from "@/lib/utils";
export const dynamic = "force-dynamic";
export default async function EditArticlePage({ params }) {
  await requireAdmin();
  const { id } = await params;
  const [article, categories] = await Promise.all([
    prisma.article.findUnique({ where: { id } }),
    prisma.articleCategory.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);
  if (!article) notFound();
  const draft = {
    id: article.id,
    title: article.title,
    slug: article.slug,
    excerpt: article.excerpt ?? "",
    content: article.content,
    heroImageUrl: article.heroImageUrl ?? "",
    authorName: article.authorName,
    categoryId: article.categoryId ?? "",
    tags: article.tags ?? "",
    status: article.status,
    seoTitle: article.seoTitle ?? "",
    seoDescription: article.seoDescription ?? "",
  };
  return (
    <>
      <PageHeader
        title={article.title}
        description={
          article.publishedAt
            ? `Published ${formatDate(article.publishedAt)} · updated ${formatDate(article.updatedAt)}`
            : `Draft · updated ${formatDate(article.updatedAt)}`
        }
        breadcrumb={[
          { label: "Journal", href: "/admin/journal" },
          { label: article.title },
        ]}
      />
      <ArticleEditor draft={draft} categories={categories} />
    </>
  );
}
