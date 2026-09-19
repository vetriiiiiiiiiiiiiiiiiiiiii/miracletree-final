/**
 * What MiracleTree actually invented.
 *
 * The site could describe the company as "a moringa brand from Madurai" and be
 * accurate and forgettable. The distinguishing facts are narrower and much
 * better: two drying technologies developed in-house, the first moringa-leaf
 * energy bar, a whole-tree processing philosophy, and a body of cultivation
 * research given away to farmers rather than kept.
 *
 * All of it comes from the company's own history document. Figures that appear
 * here also appear on /about and /leadership; they are defined once, here, so
 * the three pages cannot drift apart.
 */
export const INNOVATIONS = [
  {
    slug: "ultcd",
    year: "2014",
    name: "ULTCD",
    expansion: "Ultra Low Temperature Closed Chamber Drying",
    headline: "Low-temperature closed-chamber drying",
    problem:
      "Fresh moringa leaf is highly perishable, and most of it is dried in open sun because sun costs nothing. Heat takes out the colour and much of the quality, which is why a lot of moringa powder is olive rather than green.",
    body: "MiracleTree moved drying into a controlled low-temperature closed chamber — hygienic, repeatable, and held at low temperature under controlled conditions — so the leaf keeps more of what the sun would take from it.",
    outcome:
      "Moringa leaf dried under controlled low heat in a closed chamber — for better retention of its natural colour, sensory quality and nutritional characteristics.",
  },
  {
    slug: "mogo",
    year: "2015",
    name: "MOGO®",
    headline: "The world's first moringa-leaf energy bar",
    problem:
      "Moringa was sold as leaves, powder or capsules. All three ask the buyer to change their habits, and most people do not.",
    body: "A moringa-leaf-loaded energy bar, shown at Agri Intex in Coimbatore in 2015. It put moringa into a food people already eat, and the rest of the range followed that format.",
    outcome:
      "Later supplied corporate programmes including PayPal India, and a single order of roughly 35,000 bars for Isha Life.",
  },
  {
    slug: "beauty-drops",
    year: "2018",
    name: "Beauty Drops",
    headline: "Cold-pressed moringa seed oil",
    problem:
      "A business built on leaf alone uses a small part of the tree. The seed, flower and pod have commercial value that was going unused.",
    body: "Moringa seed pressed cold and developed into a skin-care product, extending the range beyond food.",
    outcome: "Leaf, flower, seed and seed oil all now go into products.",
  },
  {
    slug: "clhpd",
    year: "2019",
    name: "CLHPD",
    expansion: "Controlled Low Heat Process Drying",
    headline: "Controlled low-heat drying, generalised",
    problem:
      "ULTCD was built for moringa, but heat-sensitive plant material loses quality in the dryer across the whole herbal processing industry.",
    body: "CLHPD was developed for premium moringa and then adapted for other herbs, vegetables and plant materials.",
    outcome: "Now used on plant material beyond moringa.",
  },
];
/**
 * The five stages, as the company describes its own arc. Used as a compact
 * strip rather than a page of its own: it is the shape of the story, not the
 * story itself.
 */
export const STAGES = [
  { stage: "01", title: "Farm", body: "Growing moringa, and learning what it needs." },
  {
    stage: "02",
    title: "Process",
    body: "ULTCD and CLHPD — controlled drying developed in-house.",
  },
  {
    stage: "03",
    title: "Product",
    body: "60+ formulations across food, nutrition and personal care.",
  },
  {
    stage: "04",
    title: "Transfer",
    body: "SOPs and cultivation models given to farmers.",
  },
  {
    stage: "05",
    title: "Global",
    body: "Technology partner on international moringa projects.",
  },
];
/**
 * The numbers, in one place. These are the company's own; the press-derived
 * figures they replaced are documented in prisma/story.ts.
 */
export const FIGURES = [
  { value: "15+", label: "Years on one crop", note: "Exclusively moringa since 2009" },
  {
    value: "60+",
    label: "Products & formulations",
    note: "Food, supplements, beverages, seed oil, skin",
  },
  {
    value: "14+",
    label: "Countries reached",
    note: "Australia, USA, Canada, Spain, Germany, UK, UAE and more",
  },
  {
    value: "~405",
    label: "Acres farmed",
    note: "Research, production and contract land",
  },
  {
    value: "1.7m",
    label: "Trees planned in Oman",
    note: "Thumrait, Dhofar — phase one, 580 acres",
  },
  {
    value: "3,800",
    label: "Plants per acre",
    note: "At the densest of four cultivation models",
  },
];
/** Certification marks, with the numbers that make them checkable. */
export const CERTIFICATIONS = [
  { mark: "NPOP Organic", detail: "ORG/SC/2510/001122 · to Oct 2026" },
  { mark: "FSSAI", detail: "12418012002283" },
  { mark: "ISO 9001:2015", detail: "UK certified" },
  { mark: "GMP", detail: "Processing facility" },
  { mark: "HACCP", detail: "Food safety management" },
  { mark: "APEDA", detail: "Registered for export" },
];
