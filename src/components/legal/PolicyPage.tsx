import { Container } from "@/components/layout/Section";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { JsonLd } from "@/components/seo/JsonLd";
import { prisma } from "@/lib/prisma";
import { sanitizeHtml } from "@/lib/sanitize";
import { breadcrumbSchema } from "@/lib/seo";
import { formatDate } from "@/lib/utils";

/**
 * Policy pages are stored in SiteSetting under `policy.<key>` so the business
 * can revise them from admin without a deploy. The defaults below reproduce
 * what the existing store publishes; anything the store did not publish is
 * marked clearly rather than invented.
 */
export async function PolicyPage({
  slug,
  title,
  path,
  intro,
  fallback,
}: {
  slug: string;
  title: string;
  path: string;
  intro?: string;
  fallback: string;
}) {
  const [setting, updated] = await Promise.all([
    prisma.siteSetting.findUnique({ where: { key: `policy.${slug}` } }),
    prisma.siteSetting.findUnique({ where: { key: `policy.${slug}.updatedAt` } }),
  ]);

  const body = sanitizeHtml(setting?.value ?? fallback);

  const crumbs = [
    { name: "Home", path: "/" },
    { name: title, path },
  ];

  return (
    <>
      <JsonLd id={`${slug}-breadcrumb`} data={breadcrumbSchema(crumbs)} />

      <div className="grain bg-ink pb-24 pt-12 md:pt-16">
        <Container size="narrow">
          <Breadcrumbs items={crumbs} />

          <header className="mt-8">
            <h1 className="text-display text-cream-50">{title}</h1>
            {intro ? (
              <p className="mt-5 leading-relaxed text-cream-300">{intro}</p>
            ) : null}
            <p className="mt-6 border-t border-border-subtle pt-5 text-xs text-cream-400">
              Last updated{" "}
              {updated?.value
                ? formatDate(updated.value)
                : formatDate(setting?.updatedAt ?? new Date())}
            </p>
          </header>

          <div
            className="prose-botanical mt-12"
            dangerouslySetInnerHTML={{ __html: body }}
          />
        </Container>
      </div>
    </>
  );
}
