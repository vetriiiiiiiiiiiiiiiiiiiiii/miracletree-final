import Link from "next/link";
import { Container, Section, SectionHeading } from "@/components/layout/Section";
import { Accordion } from "@/components/ui/Accordion";

export function FaqSection({
  title,
  subtitle,
  faqs,
  showAllLink = true,
}: {
  title: string;
  subtitle?: string | null;
  faqs: { id: string; question: string; answer: string }[];
  showAllLink?: boolean;
}) {
  if (!faqs.length) return null;

  return (
    <Section id="faq" tone="raised" spacing="default" className="grain">
      <Container>
        <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
          <div>
            <SectionHeading
              index="11"
              eyebrow="FAQ"
              title={title}
              lede={subtitle ?? undefined}
            />
            {showAllLink ? (
              <Link
                href="/faq"
                className="mt-8 inline-block py-1.5 text-[0.72rem] uppercase tracking-[0.16em] text-gold-300 underline underline-offset-4 hover:text-gold-300"
              >
                All questions
              </Link>
            ) : null}
          </div>

          <Accordion
            items={faqs.map((faq) => ({
              id: faq.id,
              question: faq.question,
              answer: <p>{faq.answer}</p>,
            }))}
            defaultOpen={faqs[0] ? [faqs[0].id] : []}
          />
        </div>
      </Container>
    </Section>
  );
}
