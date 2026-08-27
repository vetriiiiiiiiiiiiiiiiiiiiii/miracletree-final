/**
 * Turns a product-style photograph on white into a cursor asset.
 *
 *   node scripts/make-cursor.mjs public/cursor/source.png
 *
 * Two things have to happen, and neither is optional:
 *
 *  1. **Trim.** The source is a subject floating in a large white field. Left
 *     alone, the cursor would be a mostly-empty square whose visual centre is
 *     nowhere near the pointer.
 *  2. **Key out the white.** A white background is invisible on a white page
 *     and a glaring block on this site's near-black one. The alpha is derived
 *     from how close each pixel is to white, with a soft ramp so the papery
 *     husk — which is genuinely pale — survives instead of being cut away with
 *     the background.
 */
import sharp from "sharp";
import { mkdir } from "node:fs/promises";
import { dirname } from "node:path";

const input = process.argv[2] ?? "public/cursor/source.png";
const output = process.argv[3] ?? "public/cursor/seed.webp";

/** Below this, a pixel is subject. Above the upper bound, it is background. */
const SOLID_BELOW = 226;
const CLEAR_ABOVE = 250;
const SIZE = 128;

async function main() {
  await mkdir(dirname(output), { recursive: true });

  // Trim the white field first so the subject fills the frame.
  const trimmed = await sharp(input)
    .flatten({ background: "#ffffff" })
    .trim({ background: "#ffffff", threshold: 12 })
    .toBuffer();

  const { data, info } = await sharp(trimmed)
    .resize(SIZE, SIZE, { fit: "contain", background: "#ffffff" })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const pixels = new Uint8ClampedArray(data);

  for (let i = 0; i < pixels.length; i += 4) {
    const r = pixels[i]!;
    const g = pixels[i + 1]!;
    const b = pixels[i + 2]!;

    // Distance from white, measured on the channel that is *least* white — a
    // pale green husk still has one channel well below 255, whereas true
    // background has all three at the ceiling.
    const whiteness = Math.min(r, g, b);

    let alpha: number;
    if (whiteness <= SOLID_BELOW) alpha = 255;
    else if (whiteness >= CLEAR_ABOVE) alpha = 0;
    else alpha = Math.round(255 * (1 - (whiteness - SOLID_BELOW) / (CLEAR_ABOVE - SOLID_BELOW)));

    pixels[i + 3] = alpha;
  }

  await sharp(Buffer.from(pixels.buffer), {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .webp({ quality: 92, alphaQuality: 100 })
    .toFile(output);

  console.log(`cursor written: ${output} (${SIZE}x${SIZE})`);
  console.log("The site picks it up automatically — no code change needed.");
}

main().catch((error) => {
  console.error("Could not build the cursor asset.");
  console.error(error.message);
  process.exit(1);
});
