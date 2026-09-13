import type { Metadata } from "next";
import { breadcrumbSchema, buildMetadata } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";
import { Container, Section, SectionHeading } from "@/components/layout/Section";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { LinkButton } from "@/components/ui/Button";
import { Reveal } from "@/components/motion/Reveal";
import { PHOTO_GROUPS } from "@/lib/photos";
import { PhotoGrid, GroupNav } from "./PhotoGrid";

export const revalidate = 3600;

export const metadata: Metadata = buildMetadata({
  title: "Gallery",
  description:
    "Awards, visiting officials, exhibitions and the Miracle Tree Life Science premises in Madurai — photographs from fifteen years of working with moringa.",
  path: "/gallery",
});

/**
 * The photograph gallery.
 *
 * Grouped rather than presented as one long wall, because the photographs do
 * four different jobs — awards, visitors, the premises, exhibitions — and a
 * distributor checking the company out is usually after one of them
 * specifically.
 */
export default function GalleryPage() {
  const crumbs = [
    { name: "Home", path: "/" },
    { name: "Gallery", path: "/gallery" },
  ];

  return (
    <>
      <JsonLd id="gallery-breadcrumb" data={breadcrumbSchema(crumbs)} />

      <Section spacing="none" className="pt-32 md:pt-40">
        <Container>
          <Breadcrumbs items={crumbs} />

          <Reveal className="mt-10 max-w-[56ch]">
            <p className="eyebrow text-gold-400">Gallery</p>
            <h1 className="mt-5 text-display text-cream-50">
              Fifteen years, photographed
            </h1>
            <p className="mt-6 text-[1.05rem] leading-relaxed text-cream-300">
              Award ceremonies, agricultural officials and researchers who have
              visited the farm and the factory, trade stands, and the premises at
              Madurai where the range is made.
            </p>
          </Reveal>

          <Reveal className="mt-10">
            <GroupNav
              groups={PHOTO_GROUPS.map((g) => ({
                slug: g.slug,
                title: g.title,
                count: g.photos.length,
              }))}
            />
          </Reveal>
        </Container>
      </Section>

      {PHOTO_GROUPS.map((group, index) => (
        <Section
          key={group.slug}
          id={group.slug}
          spacing="default"
          tone={index % 2 === 1 ? "raised" : "default"}
          className="scroll-mt-24"
        >
          <Container>
            <Reveal>
              <SectionHeading
                title={group.title}
                lede={group.lede}
              />
            </Reveal>

            <div className="mt-14">
              <PhotoGrid photos={group.photos} />
            </div>
          </Container>
        </Section>
      ))}

      <Section tone="forest" spacing="tight">
        <Container className="flex flex-col items-start justify-between gap-8 md:flex-row md:items-center">
          <div>
            <h2 className="text-title text-cream-50">The record behind the pictures</h2>
            <p className="mt-4 max-w-[48ch] text-cream-300">
              The timeline, the certifications and their numbers, and the people
              who built it.
            </p>
          </div>
          <div className="flex flex-wrap gap-4">
            <LinkButton href="/about" variant="secondary">
              Our story
            </LinkButton>
            <LinkButton href="/leadership">Leadership</LinkButton>
          </div>
        </Container>
      </Section>
    </>
  );
}
