import type { Metadata } from "next";
import { Container } from "@/components/layout/Section";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { ContactForm } from "@/components/marketing/ContactForm";
import { JsonLd } from "@/components/seo/JsonLd";
import { SITE } from "@/lib/constants";
import { breadcrumbSchema, buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Contact",
  description:
    "Reach Miracletree Life Science in Madurai — orders, products, bulk enquiries and distribution.",
  path: "/contact",
});

export default async function ContactPage({
  searchParams,
}: {
  searchParams: Promise<{ topic?: string; order?: string }>;
}) {
  const { topic, order } = await searchParams;

  const crumbs = [
    { name: "Home", path: "/" },
    { name: "Contact", path: "/contact" },
  ];

  return (
    <>
      <JsonLd id="contact-breadcrumb" data={breadcrumbSchema(crumbs)} />

      <div className="grain bg-ink pb-24 pt-12 md:pt-16">
        <Container>
          <Breadcrumbs items={crumbs} />

          <header className="mt-8 max-w-3xl">
            <p className="eyebrow mb-5 text-gold-400">Contact</p>
            <h1 className="text-display text-cream-50">Talk to us.</h1>
            <p className="mt-5 max-w-[52ch] leading-relaxed text-cream-300">
              Questions about an order, a product, bulk supply or distribution — a real
              person reads every message.
            </p>
          </header>

          <div className="mt-16 grid gap-14 lg:grid-cols-[1.1fr_0.9fr] lg:gap-20">
            <ContactForm
              defaultTopic={topic}
              defaultMessage={order ? `About order ${order}: ` : undefined}
            />

            <aside className="grid gap-10 lg:border-l lg:border-border-subtle lg:pl-14">
              <section>
                <h2 className="eyebrow mb-4 text-gold-400">Call</h2>
                <a
                  href={`tel:${SITE.phone.replace(/\s/g, "")}`}
                  className="inline-block py-1 text-[1.35rem] text-cream-50 transition-colors hover:text-gold-300"
                >
                  {SITE.phone}
                </a>
                <p className="mt-2 text-sm text-cream-400">{SITE.phoneHours}</p>
              </section>

              <section>
                <h2 className="eyebrow mb-4 text-gold-400">Email</h2>
                <a
                  href={`mailto:${SITE.email}`}
                  className="block text-cream-100 transition-colors hover:text-gold-300"
                >
                  {SITE.email}
                </a>
                <a
                  href={`mailto:${SITE.supportEmail}`}
                  className="mt-1 block py-1 text-sm text-cream-400 transition-colors hover:text-gold-300"
                >
                  {SITE.supportEmail} — order support
                </a>
              </section>

              <section>
                <h2 className="eyebrow mb-4 text-gold-400">Visit</h2>
                <address className="not-italic leading-relaxed text-cream-300">
                  {SITE.legalName}
                  <br />
                  {SITE.address.line1}
                  <br />
                  {SITE.address.line2}
                  <br />
                  {SITE.address.city}, {SITE.address.state} {SITE.address.postalCode}
                  <br />
                  {SITE.address.country}
                </address>
              </section>

              <section>
                <h2 className="eyebrow mb-4 text-gold-400">Bulk &amp; export</h2>
                <p className="text-sm leading-relaxed text-cream-400">
                  Wholesale, private label and export enquiries are handled separately.
                </p>
                <a
                  href={SITE.bulkOrders}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-block py-1.5 text-sm text-gold-300 underline underline-offset-4"
                >
                  indiamoringa.com
                </a>
              </section>

              <section>
                <h2 className="eyebrow mb-4 text-gold-400">Follow</h2>
                <ul className="grid gap-2 text-sm">
                  <li>
                    <a
                      href={SITE.social.instagram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block py-1 text-cream-300 hover:text-gold-300"
                    >
                      Instagram
                    </a>
                  </li>
                  <li>
                    <a
                      href={SITE.social.facebook}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block py-1 text-cream-300 hover:text-gold-300"
                    >
                      Facebook
                    </a>
                  </li>
                  <li>
                    <a
                      href={SITE.social.youtube}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block py-1 text-cream-300 hover:text-gold-300"
                    >
                      YouTube
                    </a>
                  </li>
                </ul>
              </section>
            </aside>
          </div>
        </Container>
      </div>
    </>
  );
}
