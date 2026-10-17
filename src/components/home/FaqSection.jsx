import Link from "next/link";
import { Accordion } from "@/components/ui/Accordion";
export function FaqSection({ title, subtitle, faqs, showAllLink = true }) {
  if (!faqs.length) return null;
  return (
    <section id="faq" className="bg-ink-900 py-10 md:py-14">
      <div className="mx-auto max-w-3xl gutter">
        <div className="text-center">
          <h2 className="text-2xl text-cream-50 md:text-3xl">{title}</h2>
          {subtitle ? <p className="mt-2 text-cream-400">{subtitle}</p> : null}
        </div>
        <div className="mt-8 rounded-3xl border border-border-subtle bg-ink px-5 py-2 md:px-8">
          <Accordion
            items={faqs.map((faq) => ({
              id: faq.id,
              question: faq.question,
              answer: <p>{faq.answer}</p>,
            }))}
            defaultOpen={faqs[0] ? [faqs[0].id] : []}
          />
        </div>
        {showAllLink ? (
          <p className="mt-6 text-center">
            <Link
              href="/faq"
              className="inline-flex h-11 items-center rounded-full border-2 border-emerald-500 px-6 text-sm font-bold text-emerald-500 transition-colors hover:bg-emerald-500 hover:text-on-accent"
            >
              See all questions
            </Link>
          </p>
        ) : null}
      </div>
    </section>
  );
}
