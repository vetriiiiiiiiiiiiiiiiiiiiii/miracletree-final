/**
 * Where the company's moringa actually goes.
 *
 * Two different claims live here and they are deliberately kept apart. The
 * company's record says fourteen countries; it names nine of them. Listing
 * nine under a heading that says fourteen would read as though five were being
 * withheld, and inventing the other five to round the list out would be worse.
 * So the named ones are named and the count is stated as a count.
 *
 * Source: MiracleTree company records — the "sixty products, fourteen
 * countries" milestone and the founder's international project record.
 */

/** Export destinations recorded by name. */
export const MARKETS = [
  { country: "Australia" },
  { country: "United States" },
  { country: "Canada" },
  { country: "United Kingdom" },
  { country: "Germany" },
  { country: "Spain" },
  { country: "United Arab Emirates" },
  { country: "Saudi Arabia" },
  { country: "Oman" },
];

/** The count on record, which is larger than the list above. */
export const COUNTRIES_REACHED = "14+";

/**
 * The two places the work goes past export into building the thing itself.
 * Both are the founder's own projects and both carry dates, so a reader can
 * tell a finished engagement from a running one.
 */
export const PROJECTS = [
  {
    country: "Saudi Arabia",
    partner: "NADEC",
    years: "2021 – 2023",
    status: "Completed",
    body: "Cultivation and value-addition expertise transferred to NADEC: the growing system, the processing method and the standard operating procedures, documented and handed over.",
  },
  {
    country: "Oman",
    partner: "Thumrait, Dhofar",
    years: "2025 – 2026",
    status: "In progress",
    body: "Technology partner on an integrated moringa farm and processing campus. 580 acres in phase one, approximately 1.7 million trees, and a leaf-processing facility designed around 44 tonnes of fresh leaf a day.",
  },
];
