import { buildMetadata } from "@/lib/seo";
import { ServicePage } from "@/components/services/ServicePage";
export const metadata = buildMetadata({
  title: "International Farm Consultancy",
  description:
    "Moringa farm consultancy from MiracleTree: cultivation models, high-density planting, nursery, low-temperature drying and processing — the experience behind projects in Saudi Arabia and Oman.",
  path: "/international-farm-consultancy",
});
/** Moringa farm and project consultancy, built on the company's own record. */
export default function FarmConsultancyPage() {
  return (
    <ServicePage
      slug="international-farm-consultancy"
      eyebrow="International Farm Consultancy"
      title="Moringa projects, from field to factory"
      intro="Since 2009 MiracleTree has grown, dried and processed nothing but moringa. Since 2021 that experience has gone abroad — technology transfer in Saudi Arabia and a 1.7-million-tree development in Oman. We help growers, investors and governments plan and run moringa projects of their own."
      figures={[
        { value: "15+", label: "Years on one crop", note: "Exclusively moringa since 2009" },
        { value: "~405", label: "Acres farmed", note: "Research, production and contract land" },
        { value: "4", label: "Cultivation models", note: "Trialled and written up as SOPs" },
        { value: "14+", label: "Countries reached", note: "By our products and projects" },
      ]}
      offeringsTitle="What we help with"
      offeringsLede="Every engagement is scoped to the land, the climate and what the crop is for — leaf, biomass or seed."
      offerings={[
        {
          title: "Feasibility and site assessment",
          body: "Land, water, climate and market — whether moringa suits the site, and which end product it should be grown for.",
        },
        {
          title: "Cultivation model and planting design",
          body: "Choosing between 12×12 ft, 8×8 ft, 4×4 ft and high density at up to about 3,800 plants an acre, based on our own field trials.",
        },
        {
          title: "Nursery development",
          body: "Setting up the nursery that feeds the planting programme, from seed selection to field-ready saplings.",
        },
        {
          title: "SOPs and farmer training",
          body: "Our documented cultivation SOPs, adapted to your project and taught to the people who will run it.",
        },
        {
          title: "Drying and processing",
          body: "Low-temperature drying based on our ULTCD and CLHPD processes, and planning a processing line that keeps the leaf green.",
        },
        {
          title: "Value addition",
          body: "Turning the harvest into finished products — powders, teas, foods, oils — drawing on 60+ formulations we have developed.",
        },
      ]}
      recordTitle="Where we have done it"
      record={[
        {
          when: "2025–2026",
          title: "Technology partner — Thumrait, Oman",
          body: "An integrated moringa campus: 580 acres, 1.7 million trees, and a 44-tonne-a-day processing facility.",
        },
        {
          when: "2021–2023",
          title: "Technology transfer — NADEC, Saudi Arabia",
          body: "Moringa cultivation and processing expertise transferred to NADEC.",
        },
        {
          when: "Madurai",
          title: "Four planting models, trialled and documented",
          body: "12×12 ft, 8×8 ft, 4×4 ft and high density, run on our own farm and organised into SOPs shared with visiting farmers.",
        },
        {
          when: "2014 · 2019",
          title: "Two drying technologies",
          body: "ULTCD (ultra low temperature closed chamber drying) and CLHPD (controlled low heat process drying), developed in-house.",
        },
      ]}
      steps={[
        { title: "Enquiry", body: "Tell us about the land, the goal and the timeline." },
        { title: "Assessment", body: "We review the site and the plan, and propose a scope." },
        { title: "Design", body: "Cultivation model, nursery, processing and SOPs for your project." },
        { title: "Support", body: "On-ground guidance and training through planting and the first harvests." },
      ]}
      enquirySubject="international farm consultancy"
      enquiryBody="Write to us with where the project is, how much land you have, and what you want the moringa for. We will come back with how we can help."
    />
  );
}
