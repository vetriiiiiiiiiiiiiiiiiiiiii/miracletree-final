import type { Metadata } from "next";
import { breadcrumbSchema, buildMetadata } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";
import { Container, Section } from "@/components/layout/Section";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { TrackForm } from "./TrackForm";

export const metadata: Metadata = buildMetadata({
  title: "Track your order",
  description:
    "Check the status of a Miracle Tree order with your order number and the email address it was placed with.",
  path: "/track",
});

/**
 * Order tracking for shoppers who checked out as guests.
 *
 * The confirmation page is bound to the browser that placed the order, which is
 * right but expires as a route back in the moment someone closes the tab. This
 * is the durable one, and it asks for the email as well as the order number
 * precisely because order numbers are sequential.
 */
export default function TrackPage() {
  const crumbs = [
    { name: "Home", path: "/" },
    { name: "Track order", path: "/track" },
  ];

  return (
    <>
      <JsonLd id="track-breadcrumb" data={breadcrumbSchema(crumbs)} />

      <Section spacing="none" className="pb-24 pt-32 md:pt-40">
        <Container>
          <Breadcrumbs items={crumbs} />

          <header className="mt-10 max-w-[52ch]">
            <p className="eyebrow text-gold-400">Orders</p>
            <h1 className="mt-5 text-display text-cream-50">Track your order</h1>
            <p className="mt-6 text-[1.05rem] leading-relaxed text-cream-300">
              Enter the order number from your confirmation email along with the
              email address you used, and we will show you where it is.
            </p>
          </header>

          <div className="mt-16">
            <TrackForm />
          </div>
        </Container>
      </Section>
    </>
  );
}
