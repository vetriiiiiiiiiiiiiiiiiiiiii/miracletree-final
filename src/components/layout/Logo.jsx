import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * The company's own logo.
 *
 * This used to be a drawn wordmark with an invented leaf-pair mark, which was
 * a placeholder standing in for a brand that already exists. The real one is
 * the tree and the two-tone "Miracletree" wordmark the company puts on its
 * signage, its packs and its stand.
 *
 * It arrived as a vertical lockup on white — the tree above the word, no alpha
 * — which is unusable in a header: at any height that makes the word legible
 * the whole thing is too tall, and the white ground would sit as a card on the
 * dark ink. So it is cut out and split into its two pieces, composed side by
 * side here, and the caller still sets the height with `h-*` and gets `w-auto`
 * exactly as before.
 *
 * Both pieces are one accessible image: the wrapper carries the name and the
 * images are decorative, so a screen reader reads "Miracletree Life Science"
 * once rather than announcing a tree and a word separately.
 */
export function Logo({ className, priority = false }) {
  return (
    <span
      role="img"
      aria-label="Miracletree Life Science"
      className={cn("inline-flex items-center gap-[0.32em]", className)}
    >
      <Image
        src="/brand/miracletree-mark.webp"
        alt=""
        aria-hidden
        width={256}
        height={259}
        priority={priority}
        className="h-full w-auto"
      />
      {/* Optically smaller than the mark: matched to the same height the word
          would swamp the tree beside it. */}
      <Image
        src="/brand/miracletree-wordmark.webp"
        alt=""
        aria-hidden
        width={512}
        height={92}
        priority={priority}
        className="h-[58%] w-auto"
      />
    </span>
  );
}

/**
 * The full vertical lockup as the company draws it, for the places with room
 * to give it air — the loading curtain and the footer.
 */
export function LogoStacked({ className }) {
  return (
    <Image
      src="/brand/miracletree-full.webp"
      alt="Miracletree Life Science"
      width={512}
      height={645}
      className={cn("w-auto", className)}
    />
  );
}
