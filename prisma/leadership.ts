/**
 * The people, and what they have actually done.
 *
 * Rewritten from MiracleTree's own company history document and current organic
 * scope certificates, replacing an earlier version assembled from press
 * coverage. Where the two disagreed, the company's record wins.
 *
 * The rule is unchanged: on a food brand an unverifiable credential is a legal
 * exposure, not a copy problem, so nothing is claimed here that the supplied
 * documents do not support.
 *
 * Sources:
 *   Company — MiracleTree company history & timeline document (2026)
 *   Farm    — TN Organic Certification Dept scope certificate ORG/SC/1303/000459
 *   GoTN    — https://www.gotn.in/miracletree-marketing-the-moringa/
 */

const GOTN = "https://www.gotn.in/miracletree-marketing-the-moringa/";
const COMPANY = "MiracleTree company records";

export const LEADERS = [
  {
    slugKey: "saravanakumaran-rajendran",
    name: "R. Saravanakumaran",
    role: "Co-founder & Chief Executive",
    credential: "Engineer-agriculturist",
    isFounder: true,
    position: 0,
    bio: "He developed the two drying technologies the company is built on, ULTCD and CLHPD, and now leads MiracleTree's international moringa projects: technology transfer with NADEC in Saudi Arabia, and a 1.7-million-tree development at Thumrait in Oman.",
    longBio: `R. Saravanakumaran grew up in Madurai and trained as an engineer. He did not set out to farm. He went to work on the equipment side of agriculture, which is still where he spends most of his time.

His wife Sujatha had the idea for the products. She wanted moringa to reach people as food they would buy anyway: bars, teas, laddus, instead of capsules. He worked out how to make that at scale without ruining the leaf.

The hard part is drying. Fresh moringa loses colour and quality fast, and most of it is dried in the sun because sun is free. In 2014 he introduced ULTCD — Ultra Low Temperature Closed Chamber Drying — and in 2019 followed it with CLHPD, Controlled Low Heat Process Drying, developed for premium moringa and other herbal materials. Both have since been applied well beyond moringa, to other herbs and vegetables.

The farm was run as a teaching ground alongside the business. Four planting models were trialled side by side — 12×12 ft, 8×8 ft, 4×4 ft, and high density at around 3,800 plants an acre — then written up as SOPs and shared with visiting farmers. Moringa under cultivation in Tamil Nadu grew from roughly 1,800 acres in 2010 to about 9,000 by 2017.

Since 2021 the work has been international. Between 2021 and 2023 he transferred cultivation and value-addition expertise to NADEC in Saudi Arabia. Since 2025 he has been technology partner on an integrated moringa farm and processing campus at Thumrait in Dhofar, Oman — 580 acres in phase one, approximately 1.7 million trees, and a leaf-processing facility designed around 44 tonnes of fresh leaf a day. His stated principle for that work is to transfer the technology rather than create a dependency: develop the system, document the SOP, train the team, hand it over.

He farms organically himself. The family land at Kilakarai, Vadipatti carries its own NPOP organic certificate covering moringa alongside coconut, palmyra and orchard crops.`,
    quote:
      "Using the yield of the moringa tree was my wife Sujatha's brainchild. She wanted to reach healthy and chemical-free food to people.",
    source: "Company records and GoTN.in",
    sourceUrl: GOTN,
    highlights: [
      {
        year: "2022–23",
        kind: "award",
        title: "Best Agriculturist through scientific means",
        body: "Awarded by the Government of Tamil Nadu. Reported by GoTN; not listed in the company's own history document, so it carries the press citation.",
      },
      {
        year: "2014",
        kind: "patent",
        title: "ULTCD drying",
        body: "Ultra Low Temperature Closed Chamber Drying, developed to replace uncontrolled conventional drying of moringa leaf.",
      },
      {
        year: "2015",
        kind: "recognition",
        title: "World's first moringa-leaf energy bar",
        body: "Introduced at Agri Intex, Coimbatore. The format became MOGO®.",
      },
      {
        year: "2018",
        kind: "recognition",
        title: "Cold-pressed moringa seed oil",
        body: "Beauty Drops, taking the value chain from food into personal care.",
      },
      {
        year: "2019",
        kind: "patent",
        title: "CLHPD drying",
        body: "Controlled Low Heat Process Drying, for premium moringa and other heat-sensitive plant material.",
      },
      {
        year: "2021–23",
        kind: "role",
        title: "Technology transfer to NADEC, Saudi Arabia",
        body: "Moringa cultivation and value-addition expertise transferred to the National Agricultural Development Company.",
      },
      {
        year: "2025–26",
        kind: "role",
        title: "Moringa technology partner, Thumrait, Oman",
        body: "Cultivation planning, nursery development, irrigation strategy and processing design for approximately 1.7 million trees.",
      },
      {
        year: null,
        kind: "recognition",
        title: "Four cultivation models, trialled and published",
        body: "12×12 ft, 8×8 ft, 4×4 ft and high density to 3,800 plants an acre, documented as SOPs and shared with farmers.",
      },
      {
        year: null,
        kind: "role",
        title: "Incubated at NABARD MABIF",
        body: "An incubatee of the NABARD MABIF agribusiness incubator.",
      },
    ],
  },
  {
    slugKey: "sujatha-rajendran",
    name: "Sujatha Rajendran",
    role: "Co-founder",
    credential: null,
    isFounder: false,
    position: 1,
    bio: "Sujatha came up with the products. Her rule was that moringa had to arrive as food people already eat, not as a supplement, and the range still follows it.",
    longBio: `Sujatha Rajendran started the product side of the company. Her question was a commercial one: how do you get moringa to people who would never buy a supplement?

The answer was to make things they already eat. An energy bar instead of a capsule. Tea instead of a tincture. Laddus. The range still works to that rule, and it is the reason the company makes food rather than extracts.`,
    quote: null,
    source: "GoTN.in",
    sourceUrl: GOTN,
    highlights: [
      {
        year: "2009",
        kind: "role",
        title: "Conceived the product line",
        body: "Bars, teas and laddus rather than capsules.",
      },
    ],
  },
  {
    slugKey: "v-kamaraja",
    name: "Dr V. Kamaraja",
    role: "Medical advisor",
    credential: "Anaesthesiologist",
    isFounder: false,
    position: 2,
    bio: "Practising anaesthesiologist, twenty years across several surgical specialities.",
    longBio: null,
    quote: null,
    source: "miracletree.in",
    sourceUrl: "https://www.miracletree.in/",
    highlights: [],
  },
  {
    slugKey: "n-rajeshwari",
    name: "Dr N. Rajeshwari",
    role: "Medical advisor",
    credential: "Ophthalmic surgeon",
    isFounder: false,
    position: 3,
    bio: "Ophthalmic surgeon, 23 years in practice. Senior Consultant and Managing Director at Aaditya Kamaraja Eye Hospital.",
    longBio: null,
    quote: null,
    source: "miracletree.in",
    sourceUrl: "https://www.miracletree.in/",
    highlights: [],
  },
  {
    slugKey: "k-senthilvel",
    name: "Er K. Senthilvel",
    role: "Operations & logistics",
    credential: "Mechanical engineer",
    isFounder: false,
    position: 4,
    bio: "Mechanical engineer with a logistics background. He handles despatch and cold chain.",
    longBio: null,
    quote: null,
    source: "miracletree.in",
    sourceUrl: "https://www.miracletree.in/",
    highlights: [],
  },
];
