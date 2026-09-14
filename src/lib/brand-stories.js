/**
 * The sub-brand stories, as the company tells them.
 *
 * Four of MiracleTree's products are not just SKUs in the catalogue — they are
 * the company's argument about what moringa is for, which is that nutrition
 * works better inside a habit somebody already has than in a capsule beside
 * it. Chaitree puts it in chai, MOVITA in a morning drink, the Rice Mix in a
 * bowl of rice, the chutney powder next to idli. That case is worth making on
 * the page where the product is sold rather than buried in a journal entry.
 *
 * Each story is attached by slug, so a product without one simply does not
 * render the section. The text is condensed from the company's own copy; the
 * quoted line at the end of each is theirs verbatim.
 */

export const BRAND_STORIES = [
  {
    brand: "Chaitree®",
    tagline: "Chai with Joy",
    slugs: [
      "moringa-rolled-plain-tea-100-gms-50-servings-approx",
      "moringa-rolled-masala-chai-100-gms-50-servings-approx-description",
      "moringa-rolled-ginger-and-lemon-infused-tea-100-gms-50-servings-approx",
    ],
    lede: "Could India's everyday cup of chai become a more meaningful wellness experience?",
    paragraphs: [
      "Our work with moringa began on the farm. As we looked for ways to bring its nutritional value into everyday life, we found that wellness products should not always require people to change their habits. Sometimes the better approach is to bring nutrition into a habit people already love — and in India, few habits are as loved as chai.",
      "Masala chai is more than a beverage. It belongs to Indian homes, conversations, hospitality and the everyday break. So we began combining moringa with traditional Indian chai and aromatic spices, under one constraint that mattered: this could not simply be moringa added to tea. It had to remain an enjoyable cup of chai.",
      "What emerged was Chaitree® — orthodox tea, moringa and the familiar character of Indian masala chai in one cup. Rather than positioning moringa as powder, capsules or supplements, it showed another direction entirely: moringa as part of a familiar daily ritual.",
    ],
    line: "The name reflects the spirit of chai, nature and joyful living.",
  },
  {
    brand: "MOVITA®",
    tagline: "Nutrition rooted in tradition, powered by moringa",
    slugs: [
      "movita-multi-grain-health-mix-flavored",
      "movita-multi-grain-health-mix-plain",
      "movita-sprouted-multi-grain-laddus-250-gms-no-added-sugar-richness-of-moringa",
    ],
    lede: "Traditional Indian grains, pulses and moringa, as an everyday drink for the modern family.",
    paragraphs: [
      "The idea came from an old piece of nutritional wisdom: sprouting grains and pulses before eating them. Rather than develop another conventional health drink, we brought together sprouted multigrains, millets, pulses and moringa into a ready-to-mix formulation.",
      "Sprouting is what separates MOVITA from an ordinary cereal beverage. The grains and pulses germinate before processing. Sprout, process, blend, enrich with moringa, and make it easy to consume — that is the whole philosophy, and the last step matters as much as the others.",
      "A nutritious product has little value if people find it hard to fit into their routine. MOVITA was built ready-to-mix so traditional multigrain nutrition suits a modern schedule: at home, at work, or as part of the family's regular food. The pack carries what it carries — 100% natural, no added preservatives, no added sugar or salt.",
    ],
    line: "Sprouted goodness. Moringa nutrition. Made for everyday life.",
  },
  {
    brand: "Moringa Rice Mix",
    tagline: "From the farm to the family dining table",
    slugs: ["moringa-rice-mix-powder"],
    lede: "How do we make moringa part of an ordinary Indian meal without asking people to change how they eat?",
    paragraphs: [
      "Moringa leaves have always been part of South Indian cooking, but preparing fresh leaves regularly takes time. For working families, students living away from home and busy professionals, that usually means these greens quietly disappear from everyday meals.",
      "So we brought moringa into one of India's most familiar foods. Moringa leaves with peanuts, sesame, roasted gram dal, urad dal, dry red chilli and salt — a savoury blend stirred through freshly cooked rice. Add a little ghee or gingelly oil and a simple bowl of rice becomes a moringa meal.",
      "There is no new recipe to learn and no change of habit required. Someone already eating rice can add it in minutes, which is the point: traditional South Indian food wisdom meeting ready-to-eat convenience.",
    ],
    line: "We didn't want moringa to remain something people know is healthy. We wanted to make it something families could actually eat every day.",
  },
  {
    brand: "Moringa Idli–Dosa Chutney Powder",
    tagline: "Tradition on the plate, moringa in every serving",
    slugs: ["moringa-idly-chutney-powder"],
    lede: "Why not bring moringa into a food families already love and eat regularly?",
    paragraphs: [
      "Idli and dosa have been at the heart of the South Indian breakfast for generations, and the humble chutney podi beside them has always had its own place — simple, tasty, convenient, and tied to home.",
      "So the familiar podi was combined with moringa leaves and traditional ingredients: roasted pulses, chillies and sesame. Mixed with a little gingelly oil or ghee, it is ready for hot idlis and crisp dosas. The principle was straightforward — don't change people's food habits, improve what is already on their plate.",
      "The hard part of any nutritious ingredient is not producing it; it is getting people to eat it consistently. A family needs no new recipe here, a child swallows no supplement, and a busy morning gains no extra step. Moringa simply becomes part of breakfast.",
    ],
    line: "We didn't try to change the South Indian breakfast. We simply found a way to bring moringa to the breakfast table.",
  },
];

/** The story attached to a product slug, if it has one. */
export function brandStoryFor(slug) {
  return BRAND_STORIES.find((story) => story.slugs.includes(slug)) ?? null;
}
