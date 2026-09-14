/**
 * The line the company puts under a milestone when it wants to say what
 * changed.
 *
 * These are MiracleTree's own, taken from the timeline document — the arrows
 * and all. They are kept out of the database on purpose: a motto belongs to
 * how the story is *told* rather than to the record itself, and adding a
 * column for it would mean a schema change and a migration on a live volume
 * for what is presentation.
 *
 * Keyed by milestone title. A milestone without one renders without one.
 */
export const MOTTOS = {
  "The Moringa journey begins": "From the farm, the journey began",
  "Farmer education and knowledge transfer": "Demonstrate → Educate → Transfer → Grow",
  "ULTCD drying technology": "From moringa farming → to moringa processing technology",
  "Moringa enters modern functional food": "Moringa leaf → nutritional ingredient → ready-to-eat food",
  "Moringa becomes skin food": "From nutrition → to natural personal care",
  "CLHPD processing technology": "ULTCD → CLHPD → premium plant processing",
  "60+ moringa innovations":
    "Food · Nutrition · Wellness · Supplements · Beverages · Personal care · Ingredients",
  "Building the moringa economy": "The next generation of moringa",
};

export function mottoFor(title) {
  return MOTTOS[title] ?? null;
}
