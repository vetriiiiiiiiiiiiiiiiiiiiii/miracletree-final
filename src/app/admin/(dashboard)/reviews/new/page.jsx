import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { PageHeader } from "@/components/admin/ui";
import { ReviewEditor } from "@/components/admin/ReviewEditor";

export default async function NewReviewPage() {
  await requireAdmin();

  const products = await prisma.product.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  return (
    <>
      <PageHeader
        title="New Review"
        description="Manually create a review for any product."
        breadcrumb={[
          { label: "Reviews", href: "/admin/reviews" },
          { label: "New" },
        ]}
      />
      <ReviewEditor products={products} />
    </>
  );
}
