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
 * Tied to the list's own scroll progress rather than to the window, so it reads
 * as a measure of the history rather than of the page. Under reduced motion it
 * is simply full: a progress indicator that never moves is noise.
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
      // when its bottom does — so the rule tracks what is being read.
      const travelled = window.innerHeight / 2 - box.top;
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
 * Marks each entry once it has been reached, and never unmarks it.
 *
 * Entries that re-hide on the way back up make a page feel unstable — the
 * reader scrolls up to check something and watches it disappear. Arriving is a
 * one-way door here.
 */
function useRevealed(count) {
  const [revealed, setRevealed] = useState(() => new Set());
  const nodes = useRef([]);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setRevealed(new Set(Array.from({ length: count }, (_, i) => i)));
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        const arrived = entries
          .filter((e) => e.isIntersecting)
          .map((e) => Number(e.target.dataset.index));
        if (arrived.length) {
          setRevealed((prev) => {
            const next = new Set(prev);
            for (const i of arrived) next.add(i);
            return next;
          });
        }
      },
      // Fires a little before the entry is fully on screen, so the movement
      // finishes about when the reader gets there.
      { threshold: 0.15, rootMargin: "0px 0px -12% 0px" },
    );
    for (const node of nodes.current) if (node) observer.observe(node);
    return () => observer.disconnect();
  }, [count]);

  return [revealed, nodes];
}

/**
 * The history as the classic centre-spine timeline: a rule down the middle
 * with the entries stepping either side of it.
 *
 * It is the oldest form there is for this and it is still the right one — the
 * alternation gives the eye somewhere to go on a list of fourteen, and the
 * spine makes the passage of time a physical distance rather than a column of
 * dates. The line draws as you descend, each entry rises into place as you
 * reach it, and its node on the spine fills as it arrives.
 *
 * Below `lg` it folds to a single column with the spine on the left, because
 * alternating sides on a narrow screen is a zigzag, not a timeline.
 */
export function Timeline({ milestones }) {
  const listRef = useRef(null);
  const progress = useSpineProgress(listRef);
  const [revealed, nodes] = useRevealed(milestones.length);

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
        {/* The spine: a hairline the full height with the travelled part drawn
            over it, so there is always a line and the fill reads as distance
            covered rather than as the line appearing. */}
        <div
          aria-hidden
          className="pointer-events-none absolute left-[0.4rem] top-0 h-full w-px bg-[#5d7150]/25 lg:left-1/2 lg:-translate-x-px"
        >
          <div
            className="w-px bg-[#5d7150] transition-[height] duration-150 ease-out"
            style={{ height: `${(progress * 100).toFixed(2)}%` }}
          />
        </div>

        <ol className="grid gap-14 lg:gap-4">
          {milestones.map((entry, index) => {
            const motto = mottoFor(entry.title);
            const isLeft = index % 2 === 0;
            const shown = revealed.has(index);

            return (
              <li
                key={entry.id}
                data-index={index}
                ref={(node) => {
                  nodes.current[index] = node;
                }}
                className="relative pl-8 lg:grid lg:grid-cols-2 lg:gap-16 lg:pl-0"
              >
                {/* The node, on the spine and level with the year. */}
                <span
                  aria-hidden
                  className={cn(
                    "absolute left-0 top-[0.6rem] h-[0.85rem] w-[0.85rem] rounded-full border-2 border-[#5d7150] lg:left-1/2 lg:-translate-x-1/2",
                    "transition-[background-color,transform] duration-500 ease-out",
                    shown ? "scale-110 bg-[#5d7150]" : "scale-90 bg-[#efe9d8]",
                  )}
                />

                {/* Alternating: odd entries take the right column and leave
                    the left empty, which is what makes the step. */}
                {!isLeft ? <div aria-hidden className="hidden lg:block" /> : null}

                <div
                  className={cn(
                    isLeft ? "lg:pr-14 lg:text-right" : "lg:pl-14",
                    "transition-[opacity,transform] duration-700 ease-[var(--ease-organic)] motion-reduce:transition-none",
                    shown ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0",
                  )}
                  style={{ transitionDelay: shown ? "60ms" : "0ms" }}
                >
                  <p
                    className="font-display leading-none tracking-[-0.02em] text-[#23301f]"
                    style={{ fontSize: "clamp(2rem, 3.6vw, 3.1rem)" }}
                  >
                    {entry.year}
                  </p>

                  <h3
                    className={cn(
                      "mt-3 font-display text-[clamp(1.2rem,1.9vw,1.6rem)] leading-snug text-[#23301f]",
                      isLeft ? "lg:ml-auto" : "",
                      "max-w-[26ch]",
                    )}
                  >
                    {entry.title}
                  </h3>

                  {motto ? (
                    <p className="mt-2.5 text-[0.72rem] uppercase tracking-[0.16em] text-[#7a5c1f]">
                      {motto}
                    </p>
                  ) : null}

                  {entry.body ? (
                    <p
                      className={cn(
                        "mt-4 max-w-[46ch] text-[0.98rem] leading-[1.7] text-[#55614e]",
                        isLeft ? "lg:ml-auto" : "",
                      )}
                    >
                      {entry.body}
                    </p>
                  ) : null}

                  <Cite source={entry.source} url={entry.sourceUrl} />

                  {/* Space under each entry so the alternation has a rhythm
                      rather than two columns of touching blocks. */}
                  <div aria-hidden className="hidden lg:block lg:h-16" />
                </div>
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
