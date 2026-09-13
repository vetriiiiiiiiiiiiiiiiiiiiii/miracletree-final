/**
 * The company fact sheet shown on /leadership.
 *
 * Kept as source rather than as rows: unlike a leader's record these are
 * headline numbers that change rarely, and each one carries the link that
 * backs it. If they start changing often they belong in the database with
 * the rest of the story content.
 *
 * Sources:
 *   GoTN      — https://www.gotn.in/miracletree-marketing-the-moringa/
 *   IndiaMART — https://www.indiamart.com/miracletreelifescience/about-us.html
 *   MABIF     — https://www.mabif.com/incubatees/miracle-tree-life-sciences/
 */

/**
 * These come from MiracleTree's own company history document and its current
 * organic scope certificates, so there is no external page to link to. The
 * certificate numbers are the citation: each is checkable with the issuing
 * body, which matters more on a food brand than a link would.
 */
const COMPANY_RECORD = "";

export type CompanyFact = {
  label: string;
  value: string;
  note?: string;
  /** Empty where the source is the company's own record rather than a page. */
  sourceUrl: string;
};

/**
 * Facts about the business itself, shown as a fact sheet beside the profiles.
 * Numbers a buyer or a distributor would ask for before a first order.
 */
export const COMPANY_FACTS: CompanyFact[] = [
  {
    label: "Working with moringa since",
    value: "2009",
    note: "One crop, exclusively",
    sourceUrl: COMPANY_RECORD,
  },
  {
    label: "Products and formulations",
    value: "60+",
    note: "Food, nutrition, supplements, seed oil, personal care",
    sourceUrl: COMPANY_RECORD,
  },
  {
    label: "Export markets",
    value: "14+ countries",
    note: "Australia, USA, Canada, Spain, Saudi Arabia, Germany, Oman, UK, UAE",
    sourceUrl: COMPANY_RECORD,
  },
  {
    label: "Drying technologies",
    value: "ULTCD & CLHPD",
    note: "Developed in-house, 2014 and 2019",
    sourceUrl: COMPANY_RECORD,
  },
  {
    label: "Land farmed",
    value: "~405 acres",
    note: "6-acre research farm, 87 in production, ~312 under contract",
    sourceUrl: COMPANY_RECORD,
  },
  {
    label: "Processing licence",
    value: "0.5 MT/day",
    note: "FSSAI 12418012002283, Madurai",
    sourceUrl: COMPANY_RECORD,
  },
];
