import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { formatDate, cn } from "@/lib/utils";
import { Card, PageHeader, StatCard } from "@/components/admin/ui";
import { EnquiryList } from "@/components/admin/EnquiryList";
export const dynamic = "force-dynamic";
export const metadata = { title: "Enquiries" };
/** Messages from the Contact page — new ones first in line to answer. */
export default async function AdminEnquiriesPage({ searchParams }) {
  await requireAdmin();
  const params = await searchParams;
  const status = ["new", "handled", "all"].includes(params.status) ? params.status : "new";
  const [enquiries, counts] = await Promise.all([
    prisma.enquiry.findMany({
      where: status === "all" ? {} : { status },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
    prisma.enquiry.groupBy({ by: ["status"], _count: { _all: true } }),
  ]);
  const byStatus = Object.fromEntries(counts.map((row) => [row.status, row._count._all]));
  const total = (byStatus.new ?? 0) + (byStatus.handled ?? 0);
  return (
    <>
      <PageHeader
        title="Enquiries"
        description="Messages sent through the Contact page. Reply by email or WhatsApp, then mark them handled."
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="New"
          value={String(byStatus.new ?? 0)}
          tone={(byStatus.new ?? 0) > 0 ? "warning" : "default"}
        />
        <StatCard label="Handled" value={String(byStatus.handled ?? 0)} />
        <StatCard label="All time" value={String(total)} />
      </div>
      <nav aria-label="Filter enquiries" className="mt-8 flex flex-wrap gap-1">
        {[
          { value: "new", label: "New" },
          { value: "handled", label: "Handled" },
          { value: "all", label: "All" },
        ].map((option) => (
          <Link
            key={option.value}
            href={`/admin/enquiries?status=${option.value}`}
            aria-current={status === option.value ? "page" : undefined}
            className={cn(
              "border px-3.5 py-2 text-[0.64rem] uppercase tracking-[0.12em] transition-colors",
              status === option.value
                ? "border-gold-400 text-cream-50"
                : "border-border-subtle text-cream-400 hover:border-border-strong hover:text-cream-100",
            )}
          >
            {option.label}
          </Link>
        ))}
      </nav>
      <div className="mt-6">
        {enquiries.length === 0 ? (
          <Card>
            <p className="py-10 text-center text-sm text-cream-400">
              {status === "new" ? "No new enquiries." : "No enquiries in this view."}
            </p>
          </Card>
        ) : (
          <EnquiryList
            enquiries={enquiries.map((e) => ({
              id: e.id,
              name: e.name,
              email: e.email,
              phone: e.phone,
              topic: e.topic,
              message: e.message,
              status: e.status,
              createdAt: formatDate(e.createdAt, { hour: "numeric", minute: "2-digit" }),
            }))}
          />
        )}
      </div>
    </>
  );
}
