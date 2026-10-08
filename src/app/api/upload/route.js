import { NextResponse } from "next/server";
import { writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { randomBytes } from "node:crypto";
import sharp from "sharp";
import { prisma } from "@/lib/prisma";
import { clientIp, limitRoute } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Public media upload (e.g. for product reviews).
 * Limits heavily by IP. Max 5MB.
 */
const MAX_BYTES = 5 * 1024 * 1024;
const ACCEPTED = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/gif",
]);
const MAX_DIMENSION = 1200;

export async function POST(request) {
  const ip = await clientIp();
  
  // Very strict rate limit for public uploads: 10 uploads per hour per IP.
  const limited = await limitRoute({
    name: "public_upload",
    limit: 10,
    windowSeconds: 3600,
    subject: ip,
  });
  if (limited) return limited;

  const formData = await request.formData();
  const file = formData.get("file");
  const folder = "reviews";

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file received." }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      {
        error: `That file is ${(file.size / 1048576).toFixed(1)}MB. The limit is 5MB.`,
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
    const image = sharp(input, { failOn: "error" });
    const metadata = await image.metadata();

    if (!metadata.width || !metadata.height) {
      return NextResponse.json(
        { error: "That file is not a readable image." },
        { status: 415 },
      );
    }

    const output = await image
      .rotate()
      .resize({
        width: Math.min(metadata.width, MAX_DIMENSION),
        height: Math.min(metadata.height, MAX_DIMENSION),
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: 80, effort: 4 })
      .toBuffer({ resolveWithObject: true });

    const name = `${Date.now().toString(36)}-${randomBytes(6).toString("hex")}.webp`;
    const url = await persist(folder, name, output.data);

    // We also save a media record so it can be tracked, though it's public.
    const media = await prisma.media.create({
      data: {
        url,
        kind: "image",
        alt: "Customer review image",
        width: output.info.width,
        height: output.info.height,
        sizeBytes: output.info.size,
        mimeType: "image/webp",
        folder,
      },
    });

    return NextResponse.json({
      id: media.id,
      url,
      width: output.info.width,
      height: output.info.height,
    });
  } catch (error) {
    console.error("[public/upload]", error);
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
