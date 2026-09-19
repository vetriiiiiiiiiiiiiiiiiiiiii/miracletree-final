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
    longBio: `THE ENGINEER WHO NEVER SET OUT TO FARM

Saravanakumaran Rajendran grew up in Madurai in a household where both the table and the bookshelf were fed by the land. The meals were farm-fresh produce; the reading was Sangam literature. "My father made sure we learnt and appreciated Purananuru and Agathyan's writings," he recalls. Somewhere along the way, he admits, it all took a backseat.

He left with an engineering degree and went to work on the technology side of agriculture finding ways and means to make sustainable technology work for farming. "Solving problems was my goal, not farming," he smiles. Those years were spent on the equipment and process side of the field: the machines, the drying, the handling the unglamorous half of agriculture that decides whether a harvest survives.

The turn came in 2007, when a friend took him and his wife Sujatha to a three-day workshop with organic farming scientist G. Nammalwar. "He awakened the farmer within me," Kumaran says. It changed his outlook on agriculture entirely from purely commercial, to using his skills and education to help farmers utilise technology for sustainable farming.

The moringa idea was Sujatha's. In markets saturated with chemically grown produce, she wanted healthy, nutritional food to reach people as food they would buy anyway not capsules. When sustained production demanded technical and engineering support, he joined her. In 2009, the family's dedicated Moringa journey began.

He can still quote the Sangam couplet his father taught him as a child "Murungai undavan, verungai povaan." It is often misread as "the one who eats moringa will go empty-handed." The true meaning, he explains, is the opposite: the one who eats moringa will not need a walking stick towards the end of his life. The literature the young engineer set aside became the crop he now builds his life around.

The MiracleTree® family did not set out to simply farm; they sought to solve the processing side of agriculture. Recognising early that consumers needed convenient formats, the company moved Moringa beyond capsules and powders into everyday foods like bars, teas, and multigrain mixes.

The hard part is drying. Fresh Moringa is highly perishable, and inappropriate drying adversely affects colour and quality. In 2014, the company introduced ULTCD (Ultra Low Temperature Closed Chamber Drying), followed in 2019 by CLHPD (Controlled Low Heat Process Drying). Both are now applied to other herbs and vegetables.

The farm was run as a learning ground. Four planting models were trialled 12×12 ft, 8×8 ft, 4×4 ft, and high density (3,800 plants/acre) then organised into SOPs and shared with visiting farmers. During this period, MiracleTree® observed Moringa cultivation in Tamil Nadu grow from roughly 1,800 acres in 2010 to 9,000 by 2017.

Since 2021, the work has been international. MiracleTree® transferred expertise to NADEC in Saudi Arabia (2021–2023) and became a technology partner for an integrated campus at Thumrait, Oman (2025–2026) featuring 580 acres, 1.7 million trees, and a 44-tonne/day processing facility. The company's core principle remains: develop the system, document the SOP, train the team, and transfer the technology to build local capability rather than create dependency.`,
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
        title: "Four cultivation models, trialled and documented",
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
