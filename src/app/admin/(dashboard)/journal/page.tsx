import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { formatDate } from "@/lib/utils";
import { Card, EmptyRow, PageHeader, Pill, StatCard, Table, Td, Tr } from "@/components/admin/ui";
import { ArticleRowActions } from "@/components/admin/ArticleRowActions";

export const dynamic = "force-dynamic";

export default async function AdminJournalPage() {
  await requireAdmin();

  const [articles, published, drafts] = await Promise.all([
    prisma.article.findMany({
      orderBy: [{ status: "asc" }, { publishedAt: "desc" }, { createdAt: "desc" }],
      select: {
        id: true,
        title: true,
        slug: true,
        status: true,
        excerpt: true,
        heroImageUrl: true,
        readingMinutes: true,
        publishedAt: true,
        updatedAt: true,
        authorName: true,
        category: { select: { name: true } },
      },
    }),
    prisma.article.count({ where: { status: "published" } }),
    prisma.article.count({ where: { status: "draft" } }),
  ]);

  return (
    <>
      <PageHeader
        title="Journal"
        description="Editorial content. Published articles are indexed, linked from the homepage, and are the site's main route to organic search traffic."
        actions={
          <Link
            href="/admin/journal/new"
            className="inline-flex items-center bg-emerald-500 px-5 py-2.5 text-[0.68rem] font-medium uppercase tracking-[0.14em] text-on-accent transition-colors hover:bg-emerald-400"
          >
            New article
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Published" value={String(published)} />
        <StatCard label="Drafts" value={String(drafts)} tone={drafts > 0 ? "warning" : "default"} />
        <StatCard label="Total" value={String(articles.length)} />
      </div>

      <Card className="mt-8" padded={false}>
        <Table
          head={[
            "Article",
            "Category",
            { label: "Status", align: "center" },
            { label: "Read", align: "right" },
            "Published",
            { label: "", align: "right", width: "3rem" },
          ]}
        >
          {articles.length === 0 ? (
            <EmptyRow colSpan={6}>
              No articles yet.{" "}
              <Link href="/admin/journal/new" className="underline underline-offset-4">
                Write the first one
              </Link>
              .
            </EmptyRow>
          ) : (
            articles.map((article) => (
              <Tr key={article.id}>
                <Td>
                  <div className="flex items-center gap-3">
                    <div className="relative h-11 w-16 shrink-0 overflow-hidden bg-ink-700">
                      {article.heroImageUrl ? (
                        <Image
                          src={article.heroImageUrl}
                          alt=""
                          fill
                          sizes="64px"
                          className="object-cover"
                        />
                      ) : null}
                    </div>
                    <div className="min-w-0">
                      <Link
                        href={`/admin/journal/${article.id}`}
                        className="block truncate text-cream-50 hover:text-gold-300"
                      >
                        {article.title}
                      </Link>
                      <span className="mt-0.5 block truncate text-xs text-cream-400">
                        /journal/{article.slug}
                      </span>
                    </div>
                  </div>
                </Td>

                <Td className="text-cream-400">{article.category?.name ?? "—"}</Td>

                <Td align="center">
                  <Pill tone={article.status === "published" ? "success" : "warning"}>
                    {article.status}
                  </Pill>
                </Td>

                <Td align="right" className="tabular-nums text-cream-400">
                  {article.readingMinutes} min
                </Td>

                <Td className="text-xs text-cream-400">
                  {article.publishedAt ? formatDate(article.publishedAt) : "—"}
                </Td>

                <Td align="right">
                  <ArticleRowActions
                    articleId={article.id}
                    slug={article.slug}
                    status={article.status as "draft" | "published"}
                  />
                </Td>
              </Tr>
            ))
          )}
        </Table>
      </Card>
    </>
  );
}
