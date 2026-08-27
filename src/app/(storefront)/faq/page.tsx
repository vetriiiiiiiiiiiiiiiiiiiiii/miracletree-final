import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/layout/Section";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { Accordion } from "@/components/ui/Accordion";
import { JsonLd } from "@/components/seo/JsonLd";
import { getFaqs } from "@/lib/queries";
import { breadcrumbSchema, buildMetadata, faqSchema } from "@/lib/seo";
import { FAQ_CATEGORIES } from "@/lib/constants";

export const revalidate = 600;

export const metadata: Metadata = buildMetadata({
  title: "Questions, answered",
  description:
    "Moringa, our products, how to use them, shipping, returns, orders and payments — answered plainly.",
  path: "/faq",
});

const CATEGORY_LABELS: Record<string, string> = {
  moringa: "About moringa",
  products: "Our products",
  usage: "How to use",
  ingredients: "Ingredients",
  storage: "Storage",
  shipping: "Shipping",
  orders: "Orders",
  payments: "Payments",
  returns: "Returns & refunds",
  general: "General",
};

export default async function FaqPage() {
  const faqs = await getFaqs();

  // Group by category, preserving the canonical category order.
  const grouped = FAQ_CATEGORIES.map((category) => ({
    category,
    label: CATEGORY_LABELS[category] ?? category,
    items: faqs.filter((f) => f.category === category),
  })).filter((group) => group.items.length > 0);

  const crumbs = [
    { name: "Home", path: "/" },
    { name: "FAQ", path: "/faq" },
  ];

  return (
    <>
      <JsonLd id="faq-breadcrumb" data={breadcrumbSchema(crumbs)} />
      {/* Only real, published questions are marked up — never padded to qualify. */}
      <JsonLd id="faq" data={faqSchema(faqs)} />

      <div className="grain bg-ink pb-24 pt-12 md:pt-16">
        <Container>
          <Breadcrumbs items={crumbs} />

          <header className="mt-8 max-w-3xl">
            <p className="eyebrow mb-5 text-gold-400">FAQ</p>
            <h1 className="text-display text-cream-50">Questions, answered.</h1>
            <p className="mt-5 max-w-[52ch] leading-relaxed text-cream-300/80">
              If what you need isn't here, write to us — we answer within one working
              day.
            </p>
          </header>

          <div className="mt-14 grid gap-12 lg:grid-cols-[14rem_1fr] lg:gap-20">
            {/* Category jump list */}
            <nav aria-label="FAQ categories" className="lg:sticky lg:top-28 lg:self-start">
              <ul className="flex flex-wrap gap-x-5 gap-y-2 lg:grid lg:gap-2.5">
                {grouped.map((group) => (
                  <li key={group.category}>
                    <a
                      href={`#faq-${group.category}`}
                      className="text-sm text-cream-400 transition-colors hover:text-cream-50"
                    >
                      {group.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>

            <div className="grid gap-16">
              {grouped.map((group) => (
                <section key={group.category} id={`faq-${group.category}`}>
                  <h2 className="mb-6 text-title text-cream-50">{group.label}</h2>
                  <Accordion
                    allowMultiple
                    items={group.items.map((faq) => ({
                      id: faq.id,
                      question: faq.question,
                      answer: <p>{faq.answer}</p>,
                    }))}
                  />
                </section>
              ))}
            </div>
          </div>

          <div className="mt-20 border-t border-white/10 pt-10">
            <h2 className="text-title text-cream-50">Still stuck?</h2>
            <p className="mt-3 max-w-[48ch] text-sm leading-relaxed text-cream-400">
              Call us Monday to Saturday, 10am–5pm, or send a message and we'll come
              back to you.
            </p>
            <Link
              href="/contact"
              className="mt-6 inline-block text-[0.72rem] uppercase tracking-[0.16em] text-gold-300 underline underline-offset-4"
            >
              Contact us
            </Link>
          </div>
        </Container>
      </div>
    </>
  );
}
