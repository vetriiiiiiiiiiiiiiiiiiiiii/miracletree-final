/**
 * The company's own history.
 *
 * Superseded an earlier version assembled from press coverage and trade
 * listings. This one comes from MiracleTree's own records — the company
 * history document and the current organic scope certificates — so the dates,
 * the technology names and the numbers are the business's own rather than a
 * third party's summary of them.
 *
 * The rule is unchanged: on a food brand an unverifiable certification is a
 * legal exposure, not a copy problem. Every certification below carries its
 * certificate number and expiry, which is what makes it checkable.
 *
 * Sources:
 *   Company  — MiracleTree company history & timeline document (2026)
 *   Scope    — TN Organic Certification Dept scope certificate ORG/SC/2510/001122
 *   Farm     — TN Organic Certification Dept scope certificate ORG/SC/1303/000459
 */

const COMPANY = "MiracleTree company records";

export const MILESTONES = [
  {
    year: "2009",
    title: "The Moringa journey begins",
    body: "MiracleTree starts with a single crop and a single idea: work only on Moringa oleifera, grow it sustainably, and find out what the whole tree is actually capable of.",
    source: COMPANY,
    sourceUrl: null,
  },
  {
    year: "2010",
    title: "Rethinking how moringa is planted",
    body: "Field trials across four cultivation models — 12×12 ft, 8×8 ft, 4×4 ft and high density at around 3,800 plants an acre. The point was that moringa farming does not have one correct spacing; it depends on whether you are growing for leaf, for seed or for biomass.",
    source: COMPANY,
    sourceUrl: null,
  },
  {
    year: "2010–2017",
    title: "The farm becomes a classroom",
    body: "Farmers visit to see the planting models side by side, and the practices are written up as SOPs so the knowledge travels. Moringa under cultivation in Tamil Nadu grew from roughly 1,800 acres in 2010 to about 9,000 by 2017.",
    source: COMPANY,
    sourceUrl: null,
  },
  {
    year: "2014",
    title: "ULTCD drying",
    body: "Ultra Low Temperature Closed Chamber Drying. Fresh moringa leaf is highly perishable and ordinary drying costs it colour and quality, so the company moved to controlled low-temperature closed-chamber dehydration. This is the point it stopped being only a farm.",
    source: COMPANY,
    sourceUrl: null,
  },
  {
    year: "2015",
    title: "The first moringa energy bar",
    body: "A moringa-leaf-loaded energy bar shown at Agri Intex, Coimbatore — what the company records as the world's first. It later became MOGO®. The idea was that people should not have to change their habits to eat moringa.",
    source: COMPANY,
    sourceUrl: null,
  },
  {
    year: "2018",
    title: "Beauty Drops, from the seed",
    body: "Cold-pressed moringa seed oil developed into a skin-food product, taking the value chain past food and into personal care — and proving the seed was worth as much as the leaf.",
    source: COMPANY,
    sourceUrl: null,
  },
  {
    year: "2019",
    title: "CLHPD, and filler-free tablets",
    body: "Controlled Low Heat Process Drying for premium moringa and other herbs, and a range of filler-free tablets made from leaf, flower and seed. The drying work has since been applied well beyond moringa.",
    source: COMPANY,
    sourceUrl: null,
  },
  {
    year: "2021–2023",
    title: "Saudi Arabia, with NADEC",
    body: "Moringa cultivation and value-addition expertise transferred to the National Agricultural Development Company. The first time the company worked as a technology partner rather than a producer, and the first test of whether Indian field knowledge holds up in an arid climate.",
    source: COMPANY,
    sourceUrl: null,
  },
  {
    year: "2025",
    title: "35,000 bars for Isha Life",
    body: "A single order of roughly thirty-five thousand moringa energy bars, after corporate supply including PayPal India. Fifteen years of R&D turning into commercial-scale manufacturing.",
    source: COMPANY,
    sourceUrl: null,
  },
  {
    year: "2025–2026",
    title: "Thumrait, Oman",
    body: "Technology partner for an integrated moringa farm and processing campus in Dhofar: 580 acres in phase one, around 1.7 million trees, and a leaf-processing facility designed for 44 tonnes of fresh leaf a day.",
    source: COMPANY,
    sourceUrl: null,
  },
  {
    year: "Today",
    title: "Sixty products, fourteen countries",
    body: "More than sixty moringa products and formulations across food, nutrition, supplements, beverages, seed oil and personal care, exported to Australia, the USA, Canada, Spain, Saudi Arabia, Germany, Oman, the UK and the UAE — from one tree.",
    source: COMPANY,
    sourceUrl: null,
  },
];

export const ACCOLADES = [
  {
    kind: "certification",
    title: "Organic processing — NPOP",
    issuer: "Tamil Nadu Organic Certification Department",
    year: "Valid to 12 Oct 2026",
    body: "Scope certificate ORG/SC/2510/001122 under India's National Programme for Organic Production, held equivalent to EC 834/2007 and the Swiss Organic Farming Ordinance. Covers moringa leaf powder, tea, capsules, dried flower and seed oil. Accreditation NPOP/NAB/0019.",
    source: "Scope certificate",
    sourceUrl: null,
  },
  {
    kind: "certification",
    title: "Organic production — the farm",
    issuer: "Tamil Nadu Organic Certification Department",
    year: "Valid to 16 Aug 2027",
    body: "Scope certificate ORG/SC/1303/000459 covering the family farm at Kilakarai, Vadipatti — 2.4 hectares of moringa, coconut, palmyra and orchard crops grown to NPOP organic standards.",
    source: "Scope certificate",
    sourceUrl: null,
  },
  {
    kind: "certification",
    title: "FSSAI licence 12418012002283",
    issuer: "Food Safety and Standards Authority of India",
    body: "The processing unit at Milagaranai, Alanganallur Main Road, Madurai, licensed at 0.5 MT a day.",
    source: "Scope certificate",
    sourceUrl: null,
  },
  {
    kind: "certification",
    title: "ISO 9001:2015",
    issuer: "UK certified",
    body: "Quality management across the company, as stated on its published material.",
    source: COMPANY,
    sourceUrl: null,
  },
  {
    kind: "certification",
    title: "Good Manufacturing Practice",
    issuer: "GMP",
    body: "Applied to the processing facility.",
    source: COMPANY,
    sourceUrl: null,
  },
  {
    kind: "certification",
    title: "HACCP",
    issuer: "Hazard Analysis and Critical Control Points",
    body: "Food safety management across the processing line.",
    source: COMPANY,
    sourceUrl: null,
  },
  {
    kind: "award",
    title: "Best Agriculturist through scientific means",
    issuer: "Government of Tamil Nadu, 2022–23",
    body: "For applying scientific method to cultivation and processing. Reported by GoTN rather than listed in the company's own history document, so it carries the press citation.",
    source: "GoTN.in",
    sourceUrl: "https://www.gotn.in/miracletree-marketing-the-moringa/",
  },
  {
    kind: "recognition",
    title: "ULTCD and CLHPD drying",
    issuer: "Developed in-house, 2014 and 2019",
    body: "Two generations of controlled low-temperature drying, developed for moringa and since applied to other herbs and vegetables.",
    source: COMPANY,
    sourceUrl: null,
  },
  {
    kind: "recognition",
    title: "World's first moringa-leaf energy bar",
    issuer: "Agri Intex, Coimbatore, 2015",
    body: "As recorded by the company. The format became MOGO® and later supplied corporate programmes including PayPal India.",
    source: COMPANY,
    sourceUrl: null,
  },
  {
    kind: "recognition",
    title: "Moringa technology partner, Oman",
    issuer: "Thumrait, Dhofar — 2025–2026",
    body: "Cultivation planning, nursery development, irrigation strategy and processing design for approximately 1.7 million trees across a 580-acre first phase.",
    source: COMPANY,
    sourceUrl: null,
  },
  {
    kind: "recognition",
    title: "Knowledge transfer, Saudi Arabia",
    issuer: "NADEC — 2021–2023",
    body: "Moringa cultivation and value-addition expertise transferred to the National Agricultural Development Company.",
    source: COMPANY,
    sourceUrl: null,
  },
  {
    kind: "recognition",
    title: "Incubated at NABARD MABIF",
    issuer: "MABIF agribusiness incubator",
    body: "Miracle Tree Life Sciences is an incubatee of the MABIF programme.",
    source: COMPANY,
    sourceUrl: null,
  },
];

export const CREDITS = [
  {
    name: "Sujatha Rajendran",
    role: "Co-founder",
    body: "Conceived the product line. The rule she set — moringa has to arrive as food people already eat — is why the range is bars, teas and laddus rather than capsules.",
    group: "team",
    url: null,
  },
  {
    name: "R. Saravanakumaran",
    role: "Co-founder & Chief Executive",
    body: "Engineer-agriculturist. Built the ULTCD and CLHPD drying processes, and leads the company's international moringa projects in Saudi Arabia and Oman.",
    group: "team",
    url: null,
  },
  {
    name: "Vedha Farms",
    role: "Parent group",
    body: "MiracleTree™ is a division of Vedha Farms, an organic farming group based in Madurai.",
    group: "partner",
    url: null,
  },
  {
    name: "NABARD MABIF",
    role: "Agribusiness incubator",
    body: "Miracle Tree Life Sciences is an incubatee of the MABIF programme.",
    group: "partner",
    url: "https://www.mabif.com/incubatees/miracle-tree-life-sciences/",
  },
  {
    name: "The growing families",
    role: "Across south Tamil Nadu",
    body: "Around 312 acres under contract beyond the company's own farms, and the reason the planting trials and SOPs were shared rather than kept.",
    group: "grower",
    url: null,
  },
  {
    name: "sketch-portfolio",
    role: "Design reference",
    body: "The notebook this page is built as — ruled paper, marginalia, hand-drawn underlines that draw themselves as you scroll — follows a portfolio by Shajith. The effect here is rebuilt rather than copied: the original animates handwriting with Vara.js, which injects SVG outside React's control, so the same idea is done with stroke-dasharray instead.",
    group: "design",
    url: "https://github.com/shajith23/sketch-portfolio",
  },
];
