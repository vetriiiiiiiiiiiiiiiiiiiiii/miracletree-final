import { NextResponse } from "next/server";
import { writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { randomBytes } from "node:crypto";
import sharp from "sharp";
import { prisma } from "@/lib/prisma";
import { requireAdmin, AuthError } from "@/lib/auth";
import { recordAudit } from "@/lib/audit";
import { limitRoute } from "@/lib/rate-limit";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
/**
 * Admin media upload.
 *
 * Images are decoded and re-encoded through sharp rather than being written
 * through untouched. That does three useful things at once: it guarantees the
 * file really is an image (a renamed script fails to decode), it strips EXIF
 * including GPS, and it produces a modern format at a sane size.
 *
 * Files land under /public/uploads. For a multi-instance deployment, swap the
 * `persist` function for an S3/R2 put — nothing else needs to change.
 */
const MAX_BYTES = 8 * 1024 * 1024;
const ACCEPTED = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/gif",
]);
const MAX_DIMENSION = 2400;
export async function POST(request) {
  let admin;
  try {
    admin = await requireAdmin();
  } catch (error) {
    const status = error instanceof AuthError ? error.status : 401;
    return NextResponse.json({ error: "Not authorised." }, { status });
  }
  // Keyed to the admin rather than the IP: a shared office address should not
  // let one runaway script exhaust everyone else's budget. Sharp re-encoding is
  // CPU-bound, so this is the expensive endpoint even though it is authorised.
  const limited = await limitRoute({
    name: "upload",
    limit: 40,
    windowSeconds: 300,
    subject: admin.id,
  });
  if (limited) return limited;
  const formData = await request.formData();
  const file = formData.get("file");
  const folder = String(formData.get("folder") ?? "products").replace(
    /[^a-z0-9-]/gi,
    "",
  );
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file received." }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      {
        error: `That file is ${(file.size / 1048576).toFixed(1)}MB. The limit is 8MB.`,
      },
      { status: 413 },
    );
  }
  if (!ACCEPTED.has(file.type)) {
    return NextResponse.json(
      { error: "Upload a JPEG, PNG, WebP, AVIF or GIF image." },
      { status: 415 },
    );
  }
  try {
    const input = Buffer.from(await file.arrayBuffer());
    // Decoding is the real validation — a mislabelled file throws here.
    const image = sharp(input, { failOn: "error" });
    const metadata = await image.metadata();
    if (!metadata.width || !metadata.height) {
      return NextResponse.json(
        { error: "That file is not a readable image." },
        { status: 415 },
      );
    }
    const output = await image
      .rotate() // Applies the EXIF orientation, then discards the metadata.
      .resize({
        width: Math.min(metadata.width, MAX_DIMENSION),
        height: Math.min(metadata.height, MAX_DIMENSION),
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: 82, effort: 4 })
      .toBuffer({ resolveWithObject: true });
    const name = `${Date.now().toString(36)}-${randomBytes(6).toString("hex")}.webp`;
    const url = await persist(folder, name, output.data);
    const media = await prisma.media.create({
      data: {
        url,
        kind: "image",
        alt: String(formData.get("alt") ?? "") || null,
        width: output.info.width,
        height: output.info.height,
        sizeBytes: output.info.size,
        mimeType: "image/webp",
        folder,
      },
    });
    await recordAudit({
      actorId: admin.id,
      action: "media.uploaded",
      entity: "Media",
      entityId: media.id,
      meta: { url, bytes: output.info.size },
    });
    return NextResponse.json({
      id: media.id,
      url,
      width: output.info.width,
      height: output.info.height,
    });
  } catch (error) {
    console.error("[admin/upload]", error);
    return NextResponse.json(
      { error: "That image could not be processed. Try a different file." },
      { status: 400 },
    );
  }
}
async function persist(folder, name, data) {
  const directory = join(process.cwd(), "public", "uploads", folder);
  await mkdir(directory, { recursive: true });
  await writeFile(join(directory, name), data);
  return `/uploads/${folder}/${name}`;
}
export async function DELETE(request) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Not authorised." }, { status: 401 });
  }
  const id = request.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id." }, { status: 400 });
  // The database row goes; the file is left on disk deliberately, because a
  // product elsewhere may still reference the same URL.
  await prisma.media.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
