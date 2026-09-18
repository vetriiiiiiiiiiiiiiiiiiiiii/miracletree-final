import Image from "next/image";

/**
 * The certification marks, as marks.
 *
 * They were a row of names in small caps, which is the cheapest way to state a
 * certification and the least convincing: a buyer recognises the HACCP roundel
 * or the India Organic bird long before they read the words. The company
 * supplied the set it wants shown.
 *
 * The panel is pure white, not the usual cream, because most of these marks
 * are artwork on #fff: on cream each one showed its own white box. The ASCB
 * and Non-GMO marks carry their own coloured grounds and read as rectangles
 * either way — they do the same on the company's own banner.
 *
 * HACCP is absent on purpose. The only file for it in the brand assets is
 * stock art still carrying a VectorStock watermark, which is not ours to
 * publish; it goes back in the moment a licensed file exists.
 */
const MARKS = [
  { src: "certified-plant-based", alt: "Certified Plant Based" },
  { src: "gmp", alt: "GMP Quality — Good Manufacturing Practice Certification" },
  { src: "tamilnadu-organic", alt: "Tamil Nadu Organic Certification Department" },
  { src: "ascb", alt: "ASCB — Accreditation Services Worldwide" },
  { src: "non-gmo-verified", alt: "Non-GMO Project Verified" },
  { src: "india-organic", alt: "India Organic" },
];

export function CertificationMarks({ className }) {
  return (
    <div className={className}>
      <ul className="flex flex-wrap items-center justify-center gap-x-10 gap-y-8 rounded-[1.75rem] bg-white px-8 py-9 sm:gap-x-14">
        {MARKS.map((mark) => (
          <li key={mark.src} className="shrink-0">
            <Image
              src={`/brand/certs/${mark.src}.webp`}
              alt={mark.alt}
              width={320}
              height={320}
              sizes="120px"
              className="h-[3.75rem] w-auto object-contain sm:h-[4.5rem]"
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
