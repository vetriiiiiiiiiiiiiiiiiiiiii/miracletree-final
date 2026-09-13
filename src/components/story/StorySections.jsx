"use client";
import Image from "next/image";
import Link from "next/link";
import { BotanicalPlate, Underlined, useDrawOnScroll } from "@/components/story/Drawn";
import { cn, formatDate } from "@/lib/utils";
/** A citation. Small, permanent, and linked wherever a source exists. */
function Cite({ source, url }) {
  if (!source) return null;
  const label = `Source: ${source}`;
  return url ? (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-2 inline-block py-1.5 text-[0.68rem] uppercase tracking-[0.12em] text-[#6f6440] underline underline-offset-2 hover:text-[#6b5f3f]"
    >
      {label}
    </a>
  ) : (
    <span className="mt-2 inline-block text-[0.68rem] uppercase tracking-[0.12em] text-[#6f6440]">
      {label}
    </span>
  );
}
// ---------------------------------------------------------------- timeline
export function Timeline({ milestones }) {
  const ref = useDrawOnScroll();
  if (!milestones.length) return null;
  return (
    <section id="timeline" className="relative">
      <header className="mb-14 max-w-2xl">
        <p className="margin-note mb-3">how it actually went</p>
        <h2 className="text-title text-[#23301f]">
          <Underlined>A working history</Underlined>
        </h2>
      </header>

      <div ref={ref} className="relative">
        {/* The spine, drawn as a wavering pen line rather than a border. */}
        <svg
          className="pointer-events-none absolute left-[0.25rem] top-0 h-full w-6 md:left-[7rem]"
          viewBox="0 0 24 1000"
          preserveAspectRatio="none"
          fill="none"
          aria-hidden
        >
          <path
            data-draw
            d="M12 4C9 120 15 240 11 360C8 480 14 600 10 720C7 840 13 920 12 996"
            stroke="#8a9b7a"
            strokeWidth="2"
            strokeLinecap="round"
            opacity="0.8"
          />
        </svg>

        <ol className="grid gap-12">
          {milestones.map((entry, index) => (
            <li
              key={entry.id}
              className="relative grid gap-3 pl-10 md:grid-cols-[6rem_1fr] md:gap-12 md:pl-0"
            >
              <div className="md:text-right">
                <p
                  className="text-[1.5rem] leading-none text-[#7a5c1f]"
                  style={{ fontFamily: "var(--font-hand)" }}
                >
                  {entry.year}
                </p>
              </div>

              {/* Node */}
              <span
                aria-hidden
                // Centred on the spine: the SVG is 1.5rem wide with the stroke
                // down its middle, so the node sits at left + 0.75rem - half its
                // own width.
                className="absolute left-[0.625rem] top-2 h-3 w-3 rounded-full border-2 border-[#5d7150] bg-[#efe9d8] md:left-[7.375rem]"
              />

              <div className="md:pl-6">
                <h3 className="text-[1.2rem] leading-snug text-[#23301f]">
                  {entry.title}
                </h3>
                {entry.body ? (
                  <p className="mt-2 max-w-[56ch] leading-relaxed text-[#55614e]">
                    {entry.body}
                  </p>
                ) : null}
                <Cite source={entry.source} url={entry.sourceUrl} />
              </div>

              {/* A sketch pinned beside a couple of the entries. */}
              {index === 0 ? (
                <BotanicalPlate
                  subject="seed"
                  className="pointer-events-none absolute -top-4 right-6 hidden h-40 w-32 opacity-55 lg:block"
                />
              ) : null}
              {index === milestones.length - 1 ? (
                <BotanicalPlate
                  subject="pod"
                  className="pointer-events-none absolute -top-2 right-8 hidden h-44 w-28 opacity-55 lg:block"
                />
              ) : null}
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
// ---------------------------------------------------------------- accolades
const KIND_LABEL = {
  award: "Award",
  certification: "Certification",
  recognition: "Recognition",
};
export function Accolades({ accolades }) {
  if (!accolades.length) return null;
  const groups = ["award", "certification", "recognition"]
    .map((kind) => ({
      kind,
      label: KIND_LABEL[kind],
      items: accolades.filter((a) => a.kind === kind),
    }))
    .filter((g) => g.items.length);
  return (
    <section id="recognition">
      <header className="mb-12 max-w-2xl">
        <p className="margin-note mb-3">what other people have said</p>
        <h2 className="text-title text-[#23301f]">
          <Underlined tone="gold">Awards &amp; certification</Underlined>
        </h2>
        <p className="mt-6 leading-relaxed text-[#55614e]">
          Each of these links out to where it was published. Nothing is listed here that
          cannot be checked.
        </p>
      </header>

      <div className="grid gap-10">
        {groups.map((group) => (
          <div key={group.kind}>
            <h3 className="eyebrow mb-5 text-[#7a5c1f]">{group.label}</h3>
            <ul className="grid gap-4 md:grid-cols-2">
              {group.items.map((item) => (
                <li
                  key={item.id}
                  className="relative border border-[#c9c0a8] bg-[#f6f1e2]/70 p-5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <h4 className="text-[1.05rem] leading-snug text-[#23301f]">
                      {item.title}
                    </h4>
                    {item.year ? (
                      <span
                        className="shrink-0 text-[1.05rem] text-[#7a5c1f]"
                        style={{ fontFamily: "var(--font-hand)" }}
                      >
                        {item.year}
                      </span>
                    ) : null}
                  </div>

                  {item.issuer ? (
                    <p className="mt-1 text-sm text-[#5a6350]">{item.issuer}</p>
                  ) : null}
                  {item.body ? (
                    <p className="mt-3 text-sm leading-relaxed text-[#55614e]">
                      {item.body}
                    </p>
                  ) : null}
                  <Cite source={item.source} url={item.sourceUrl} />
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
// ---------------------------------------------------------------- credits
const GROUP_LABEL = {
  design: "Design & build",
  team: "The people",
  partner: "Part of",
  grower: "Grown by",
};
export function Credits({ credits }) {
  if (!credits.length) return null;
  const groups = ["team", "partner", "grower", "design"]
    .map((group) => ({
      group,
      label: GROUP_LABEL[group] ?? group,
      items: credits.filter((c) => c.group === group),
    }))
    .filter((g) => g.items.length);
  return (
    <section id="credits">
      <header className="mb-12 max-w-2xl">
        <p className="margin-note mb-3">who is actually behind this</p>
        <h2 className="text-title text-[#23301f]">
          <Underlined tone="leaf">Credits</Underlined>
        </h2>
      </header>

      <div className="grid gap-12">
        {groups.map((group) => (
          <div key={group.group}>
            <h3 className="eyebrow mb-6 text-[#7a5c1f]">{group.label}</h3>
            <ul className="grid gap-8 md:grid-cols-2">
              {group.items.map((person) => (
                <li key={person.id} className="border-t border-[#c9c0a8] pt-5">
                  <h4 className="text-[1.15rem] text-[#23301f]">{person.name}</h4>
                  <p
                    className="mt-1 text-[1.05rem] text-[#7a5c1f]"
                    style={{ fontFamily: "var(--font-hand)" }}
                  >
                    {person.role}
                  </p>
                  {person.body ? (
                    <p className="mt-3 max-w-[48ch] text-sm leading-relaxed text-[#55614e]">
                      {person.body}
                    </p>
                  ) : null}
                  {person.url ? (
                    <a
                      href={person.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-block break-all text-[0.68rem] uppercase tracking-[0.12em] text-[#6f6440] underline underline-offset-2 hover:text-[#6b5f3f] py-1.5"
                    >
                      {person.url.replace(/^https?:\/\//, "")}
                    </a>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
// ---------------------------------------------------------------- field notes
/**
 * The journal, folded into the story rather than living on its own page. It is
 * the same content and the same URLs — articles still resolve at
 * /journal/<slug> — but the index is now a chapter of the notebook, which is
 * where field notes belong.
 */
export function FieldNotes({ notes }) {
  if (!notes.length) return null;
  return (
    <section id="field-notes">
      <header className="mb-12 max-w-2xl">
        <p className="margin-note mb-3">loose pages, kept</p>
        <h2 className="text-title text-[#23301f]">
          <Underlined>Field notes</Underlined>
        </h2>
        <p className="mt-6 leading-relaxed text-[#55614e]">
          What we have written down about the tree, the harvest and the kitchen.
        </p>
      </header>

      <ul className="grid gap-10 md:grid-cols-3">
        {notes.map((note, index) => (
          <li key={note.id}>
            <Link href={`/journal/${note.slug}`} className="group block">
              {/* Each note is taped to the page, at a slightly different angle. */}
              <div
                className={cn(
                  "taped relative border border-[#c9c0a8] bg-[#f8f4e7] p-3 shadow-[0_6px_18px_rgba(80,70,40,0.10)]",
                  "transition-transform duration-500 ease-[var(--ease-organic)] group-hover:-translate-y-1",
                )}
                style={{ transform: `rotate(${(index % 3) - 1}deg)` }}
              >
                <div className="relative aspect-4/3 overflow-hidden bg-[#e6e0cc]">
                  {note.heroImageUrl ? (
                    <Image
                      src={note.heroImageUrl}
                      alt=""
                      fill
                      sizes="(max-width: 768px) 90vw, 30vw"
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  ) : (
                    <div className="grid h-full place-items-center">
                      <BotanicalPlate
                        subject={["leaf", "flower", "pod"][index % 3]}
                        className="h-24 w-24 opacity-70"
                      />
                    </div>
                  )}
                </div>

                <div className="px-1 pb-1 pt-4">
                  <p className="text-[0.66rem] uppercase tracking-[0.14em] text-[#6f6440]">
                    {note.category?.name ?? "Journal"} · {note.readingMinutes} min
                  </p>
                  <h3 className="mt-2 text-[1.1rem] leading-snug text-[#23301f] transition-colors group-hover:text-[#7a5c1f]">
                    {note.title}
                  </h3>
                  {note.excerpt ? (
                    <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-[#55614e]">
                      {note.excerpt}
                    </p>
                  ) : null}
                  {note.publishedAt ? (
                    <p
                      className="mt-3 text-[1rem] text-[#6f6440]"
                      style={{ fontFamily: "var(--font-hand)" }}
                    >
                      {formatDate(note.publishedAt)}
                    </p>
                  ) : null}
                </div>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
