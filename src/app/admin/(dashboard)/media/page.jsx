import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { PageHeader, Card, StatCard } from "@/components/admin/ui";
import { MediaLibrary } from "@/components/admin/MediaLibrary";
export const dynamic = "force-dynamic";
export default async function AdminMediaPage() {
  await requireAdmin();
  const [media, totals] = await Promise.all([
    prisma.media.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
    prisma.media.aggregate({ _sum: { sizeBytes: true }, _count: { _all: true } }),
  ]);
  const bytes = totals._sum.sizeBytes ?? 0;
  return (
    <>
      <PageHeader
        title="Media"
        description="Everything uploaded through the admin. Images are re-encoded to WebP, resized to fit 2400px, and stripped of EXIF — including any GPS coordinates the camera recorded."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Files" value={String(totals._count._all)} />
        <StatCard
          label="Total size"
          value={
            bytes > 1048576
              ? `${(bytes / 1048576).toFixed(1)} MB`
              : `${Math.round(bytes / 1024)} KB`
          }
        />
        <StatCard label="Format" value="WebP" hint="Converted on upload" />
      </div>

      <Card className="mt-8 mb-6">
        <p className="text-sm leading-relaxed text-cream-300">
          Copy a URL from here and paste it into a product image, an article hero or a
          homepage section. Deleting a file removes it from this library but leaves the
          file itself in place, because another product may still point at the same URL.
        </p>
      </Card>

      <MediaLibrary
        items={media.map((item) => ({
          id: item.id,
          url: item.url,
          alt: item.alt,
          width: item.width,
          height: item.height,
          sizeBytes: item.sizeBytes,
          folder: item.folder,
          createdAt: item.createdAt.toISOString(),
        }))}
      />
    </>
  );
}
