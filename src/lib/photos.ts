/**
 * The photograph library.
 *
 * These are the company's own photographs, supplied as Word documents and
 * re-encoded to WebP at a 1600px long edge. They are almost entirely
 * *institutional* pictures — award presentations, visiting officials, trade
 * stands, the Madurai showroom. There is no farm, harvest or process
 * photography in the set, which is why none of this appears on product pages
 * or as a hero: it is evidence of standing, not lifestyle imagery, and it
 * belongs where a buyer or distributor is weighing up the company.
 *
 * **Captions on the `visitors` group come from the client's own document**,
 * where each photo carried a numbered Word caption. The mapping is by document
 * order and one of them (the farmer group, geo-stamped Milakaranai) confirms
 * it lines up. Even so, these name real public officials, so every caption
 * should be checked by the business before this page goes live — attaching the
 * wrong name to a face is a worse error than having no caption at all.
 */

export type Photo = {
  id: string;
  src: string;
  width: number;
  height: number;
  /** Alt text. Describes what is visible, never asserts who someone is. */
  alt: string;
  /** Shown under the image. Only where the company supplied one. */
  caption?: string;
};

export type PhotoGroup = {
  slug: string;
  title: string;
  lede: string;
  photos: Photo[];
};

const dims: Record<string, [number, number]> = {
  "award-01": [1280, 960], "award-02": [1380, 920], "award-03": [1600, 1066],
  "award-04": [1500, 1000], "award-05": [720, 1280],
  "gallery-01": [1380, 920], "gallery-02": [960, 1280], "gallery-03": [1600, 715],
  "gallery-04": [1280, 576], "gallery-05": [1280, 576], "gallery-06": [1200, 1600],
  "gallery-07": [1280, 576], "gallery-08": [1280, 853], "gallery-09": [648, 1152],
  "gallery-10": [1280, 960], "gallery-11": [1280, 960], "gallery-12": [1280, 960],
  "gallery-13": [1280, 853], "gallery-14": [1280, 853], "gallery-15": [1271, 953],
  "gallery-16": [1600, 1200], "gallery-17": [1600, 721], "gallery-18": [1600, 1066],
  "gallery-19": [1600, 1200], "gallery-20": [1024, 783], "gallery-21": [1280, 583],
  "gallery-22": [1024, 768], "gallery-23": [1500, 1000], "gallery-24": [1280, 576],
  "gallery-25": [1280, 960], "gallery-26": [1280, 853], "gallery-27": [1380, 920],
  "vip-01": [721, 1600], "vip-02": [1600, 715], "vip-03": [1280, 597],
  "vip-04": [1600, 721], "vip-05": [1040, 780], "vip-06": [1599, 1200],
  "vip-07": [1600, 715], "vip-08": [960, 1280], "vip-09": [1280, 960],
  "vip-10": [1600, 1200], "vip-11": [1600, 746],
};

function photo(id: string, alt: string, caption?: string): Photo {
  const [width, height] = dims[id] ?? [1600, 1200];
  return { id, src: `/photos/${id}.webp`, width, height, alt, caption };
}

export const PHOTO_GROUPS: PhotoGroup[] = [
  {
    slug: "recognition",
    title: "Recognition",
    lede: "Award presentations and industry ceremonies.",
    photos: [
      photo("award-03", "An award being presented on stage at a farming awards ceremony"),
      photo("award-01", "An award presentation at an industry event"),
      photo("award-02", "An award presentation at an industry event"),
      photo("award-04", "An award presentation at an industry event"),
      photo("award-05", "An award received at an industry event"),
      photo("gallery-01", "The stage at a Tamil Nadu farming and income conference"),
      photo("gallery-27", "Speaking at an agricultural and rural income conference"),
      photo("gallery-26", "Receiving recognition at a Young Indians innovation event"),
    ],
  },
  {
    slug: "visitors",
    title: "Visitors and officials",
    lede: "Agricultural bodies, research institutes and industry figures who have visited MiracleTree or met the team. Captions as supplied by the company.",
    photos: [
      photo("vip-01", "A MiracleTree product being presented to a visitor",
            "Former Agriculture Minister, Rajasthan"),
      photo("vip-02", "A MiracleTree bag being presented at a NABARD MABIF event",
            "NABARD, Chief General Manager — Mr Anand"),
      photo("vip-03", "A group at a MiracleTree exhibition stand",
            "Rajasthan FPO Chairman — Mr Aravind"),
      photo("vip-04", "A MOGO pack being presented to a visitor",
            "Dr Ramya, Homeopathy"),
      photo("vip-05", "A group photographed inside the MiracleTree facility",
            "EDII Periyakulam Horticulture Dean, with PhD scholar"),
      photo("vip-06", "A large group of farmers visiting the MiracleTree site at Milakaranai",
            "Farmers visiting Miracle Tree Life Science"),
      photo("vip-07", "A MiracleTree bag being presented to a visitor",
            "MABIF Chairman"),
      photo("vip-08", "A MiracleTree product being presented in an office",
            "IICPT Director and CSIR Director, Dr Anandharamakrishnan — food technology, R&D and innovation"),
      photo("vip-09", "A MiracleTree product being presented to visitors",
            "TVS Chairman, Ms Sobana"),
      photo("vip-10", "Product being shown at an exhibition stand",
            "Dr Natrajan IAS, Agriculture, Chennai"),
      photo("vip-11", "A meeting at the MiracleTree office",
            "Dr Alagusundaram, Chairman TNAPEX, with Dr Singaravelan"),
    ],
  },
  {
    slug: "showroom",
    title: "The showroom and the range",
    lede: "The Miracle Tree Life Science premises in Madurai, and the products on their shelves.",
    photos: [
      photo("gallery-14", "The Miracle Tree Life Science building with a visiting group outside"),
      photo("gallery-15", "A group photographed outside the Miracle Tree Life Science premises"),
      photo("gallery-13", "MiracleTree products displayed on the showroom shelves"),
      photo("gallery-20", "Product shelves inside the MiracleTree showroom"),
      photo("gallery-24", "MiracleTree products shown to visitors at an exhibition"),
      photo("gallery-12", "A visitor examining products in the showroom"),
      photo("gallery-10", "Products being shown to a visitor in the showroom"),
      photo("gallery-25", "A MiracleTree product being presented to a visitor"),
    ],
  },
  {
    slug: "exhibitions",
    title: "Exhibitions and partners",
    lede: "Trade fairs, delegations and the MOGO® launch material.",
    photos: [
      photo("gallery-16", "Two people beside a MOGO Moringa Energy Bites banner"),
      photo("gallery-18", "Visitors at a Moringa Energy Bites exhibition stand"),
      photo("gallery-17", "A MOGO product pack being presented outside the premises"),
      photo("gallery-21", "A welcome board for visitors Mr Keiichiro Yamada and Mr Tohru Kubota from Japan"),
      photo("gallery-07", "The MiracleTree stand at a food and agriculture trade fair"),
      photo("gallery-06", "A Chaitree product being presented at an exhibition stand"),
      photo("gallery-19", "Products being presented to officials at an exhibition"),
      photo("gallery-08", "A group at an agricultural exhibition"),
      photo("gallery-11", "A gathering outside the Miracle Tree Life Science premises"),
      photo("gallery-23", "A cheque or certificate presentation at an official event"),
      photo("gallery-05", "A meeting at the MiracleTree office"),
      photo("gallery-22", "A product being presented in an office"),
    ],
  },
];

/** Every photo, flattened — used by the lightbox for next/previous. */
export const ALL_PHOTOS: Photo[] = PHOTO_GROUPS.flatMap((g) => g.photos);
