"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { BotanicalPlate, Underlined } from "@/components/story/Drawn";
import { mottoFor } from "@/lib/story-mottos";
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

/**
 * A rule down the spine that fills as the reader descends it.
 *
 * Tied to the section's own scroll progress rather than to the window, so it
 * reads as a measure of the history rather than of the page. Under reduced
 * motion it is simply full: a progress indicator that never moves is noise,
 * and a spine that is drawn is what the section had before.
 */
function useSpineProgress(ref) {
  const [progress, setProgress] = useState(1);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let frame = 0;
    const measure = () => {
      frame = 0;
      const box = node.getBoundingClientRect();
      // Zero when the top of the list reaches the middle of the screen, one
      // when its bottom does. Anchoring on the middle means the rule tracks
      // whatever is actually being read.
      const middle = window.innerHeight / 2;
      const travelled = middle - box.top;
      setProgress(Math.max(0, Math.min(1, travelled / Math.max(1, box.height))));
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };

    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [ref]);

  return progress;
}

/**
 * The history, at the scale fifteen years deserves.
 *
 * The year is the thing that carries it, so the year is enormous and sticks to
 * the top of the screen while its own entry scrolls past — the reader is held
 * in 2014 for as long as 2014 has something to say, and the change of number
 * is what marks the passage. It is not decoration: on a list of fourteen
 * entries the alternative is a column of small grey dates nobody reads.
 *
 * The mottos are the company's own lines, arrows included.
 */
export function Timeline({ milestones }) {
  const listRef = useRef(null);
  const progress = useSpineProgress(listRef);

  if (!milestones.length) return null;

  const first = milestones[0]?.year;
  const last = milestones[milestones.length - 1]?.year;

  return (
    <section id="timeline" className="relative">
      <header className="mb-16 max-w-3xl">
        <p className="margin-note mb-3">how it actually went</p>
        <h2 className="text-title text-[#23301f]">
          <Underlined>A working history</Underlined>
        </h2>
        <p className="mt-5 max-w-[54ch] text-[1.05rem] leading-relaxed text-[#55614e]">
          {first} to {last} — {milestones.length} milestones, from a first planting
          to a moringa economy.
        </p>
      </header>

      <div ref={listRef} className="relative">
        {/* The spine. A hairline the full height, with the travelled part
            drawn over it, so there is always a line and the fill reads as
            distance covered rather than as the line appearing. */}
        <div
          aria-hidden
          className="pointer-events-none absolute left-[0.45rem] top-0 hidden h-full w-px bg-[#5d7150]/25 md:left-[calc(14rem+0.45rem)] md:block"
        >
          <div
            className="w-px bg-[#5d7150] transition-[height] duration-150 ease-out"
            style={{ height: `${(progress * 100).toFixed(2)}%` }}
          />
        </div>

        <ol className="grid gap-16 md:gap-20">
          {milestones.map((entry, index) => {
            const motto = mottoFor(entry.title);
            return (
              <li
                key={entry.id}
                // `min-h` is what makes the pinned year mean anything: it
                // gives the year a stretch to hold through. Sized in vh so the
                // hold is a share of the screen rather than a guess in pixels.
                className="relative grid gap-4 md:min-h-[44vh] md:grid-cols-[14rem_1fr] md:gap-16"
              >
                {/* The year, held at the top of the screen for the length of
                    its own entry. */}
                <div className="md:sticky md:top-28 md:self-start md:text-right">
                  <p
                    className="font-display leading-[0.85] tracking-[-0.03em] text-[#23301f]"
                    style={{ fontSize: "clamp(2.6rem, 6vw, 5rem)" }}
                  >
                    {entry.year}
                  </p>
                </div>

                {/* The node on the spine, aligned to the first line of the
                    title rather than to the top of the cell. */}
                <span
                  aria-hidden
                  className="absolute left-0 top-3 hidden h-[0.7rem] w-[0.7rem] rounded-full border-2 border-[#5d7150] bg-[#efe9d8] md:left-[calc(14rem+0.1rem)] md:block"
                />

                <div className="md:pt-1">
                  <h3 className="max-w-[22ch] font-display text-[clamp(1.45rem,2.6vw,2.1rem)] leading-[1.15] text-[#23301f]">
                    {entry.title}
                  </h3>

                  {motto ? (
                    <p className="mt-4 text-[0.74rem] uppercase tracking-[0.16em] text-[#7a5c1f]">
                      {motto}
                    </p>
                  ) : null}

                  {entry.body ? (
                    <p className="mt-5 max-w-[58ch] text-[1.02rem] leading-[1.75] text-[#55614e]">
                      {entry.body}
                    </p>
                  ) : null}

                  <Cite source={entry.source} url={entry.sourceUrl} />
                </div>

                {/* A sketch pinned beside the first and last entries. */}
                {index === 0 ? (
                  <BotanicalPlate
                    subject="seed"
                    className="pointer-events-none absolute -top-6 right-4 hidden h-44 w-32 opacity-45 xl:block"
                  />
                ) : null}
                {index === milestones.length - 1 ? (
                  <BotanicalPlate
                    subject="pod"
                    className="pointer-events-none absolute -top-4 right-6 hidden h-48 w-28 opacity-45 xl:block"
                  />
                ) : null}
              </li>
            );
          })}
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
