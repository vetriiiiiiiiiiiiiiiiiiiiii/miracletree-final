"use client";
import { useEffect, useRef } from "react";
import { Container, SectionHeading } from "@/components/layout/Section";
import { ProductCard } from "@/components/product/ProductCard";
import { LinkButton } from "@/components/ui/Button";
import { horizontalRail, initMotion } from "@/lib/motion";
import { analytics } from "@/lib/analytics";
/**
 * The collection, presented as a horizontal rail driven by vertical scroll on
 * desktop. On touch it becomes a native swipe carousel with snap points — the
 * pinned version would fight the browser's own gesture handling and cost more
 * than it adds.
 */
export function CollectionRail({ title, subtitle, ctaLabel, ctaHref, products }) {
  const sectionRef = useRef(null);
  const trackRef = useRef(null);
  const reported = useRef(false);
  useEffect(() => {
    initMotion();
    const section = sectionRef.current;
    const track = trackRef.current;
    if (!section || !track) return;
    // The section is tall and its stage is `position: sticky`; the rail only
    // maps scroll progress onto translateX. Nothing is pinned, so no wrapper
    // element is injected into DOM that React owns.
    const trigger = horizontalRail(section, track);
    return () => trigger?.kill();
  }, [products]);
  useEffect(() => {
    const node = sectionRef.current;
    if (!node || reported.current || !products.length) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting || reported.current) return;
        reported.current = true;
        analytics.viewItemList(
          "Homepage collection",
          products.map((p, index) => ({
            item_id: p.id,
            item_name: p.name,
            item_category: p.category?.name,
            price: p.price / 100,
            index,
          })),
        );
        observer.disconnect();
      },
      { threshold: 0.15 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [products]);
  if (!products.length) return null;
  return (
    <section
      ref={sectionRef}
      id="collection"
      className="grain relative bg-ink py-24 md:py-32 lg:h-[320svh] lg:py-0"
      aria-label={title}
    >
      <div className="lg:sticky lg:top-0 lg:flex lg:h-[100svh] lg:flex-col lg:justify-center lg:overflow-hidden">
        <Container className="lg:pb-14">
          <div className="flex flex-wrap items-end justify-between gap-8">
            <SectionHeading
              title={title}
              lede={subtitle ?? undefined}
              className="max-w-2xl"
            />
            {ctaLabel && ctaHref ? (
              <LinkButton href={ctaHref} variant="secondary" magnetic>
                {ctaLabel}
              </LinkButton>
            ) : null}
          </div>
        </Container>

        <div
          className="
            overflow-x-auto pb-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden
            lg:overflow-visible lg:pb-0
          "
        >
          <div
            ref={trackRef}
            className="
              flex w-max gap-6 px-[var(--spacing-gutter)] snap-x snap-mandatory
              md:gap-8 lg:snap-none
            "
          >
            {products.map((product, index) => (
              <div
                key={product.id}
                className="w-[68vw] shrink-0 snap-start sm:w-[42vw] lg:w-[24rem]"
              >
                <ProductCard
                  product={product}
                  index={index}
                  listName="Homepage collection"
                  priority={index < 2}
                />
              </div>
            ))}

            {/* Rail end-cap: the last card is a route into the full catalogue
            rather than a dead stop. */}
            <div className="flex w-[68vw] shrink-0 items-center sm:w-[42vw] lg:w-[24rem]">
              <div className="w-full border border-border-subtle p-10 text-center">
                <p className="text-title text-cream-50">Twenty-seven in all</p>
                <p className="mt-4 text-sm leading-relaxed text-cream-400">
                  Powders, teas, tablets, mixes, bars and oil — every one of them from
                  the same tree.
                </p>
                <LinkButton href="/shop" size="md" className="mt-8 w-full" magnetic>
                  View the full catalogue
                </LinkButton>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
