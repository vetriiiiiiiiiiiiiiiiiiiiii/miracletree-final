import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { buildMetadata } from "@/lib/seo";
import { AddressBook } from "@/components/account/AddressBook";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildMetadata({
  title: "Your addresses",
  description: "Manage the delivery addresses on your account.",
  path: "/account/addresses",
  noIndex: true,
});

export default async function AddressesPage() {
  const user = await requireUser();

  const addresses = await prisma.address.findMany({
    where: { userId: user.id },
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
  });

  return (
    <div className="max-w-2xl">
      <h2 className="text-title text-cream-50">Addresses</h2>
      <p className="mt-3 text-sm text-cream-400">
        Saved addresses appear at checkout, so you only type them once.
      </p>

      <AddressBook
        addresses={addresses.map((a) => ({
          id: a.id,
          label: a.label,
          firstName: a.firstName,
          lastName: a.lastName,
          line1: a.line1,
          line2: a.line2,
          city: a.city,
          state: a.state,
          postalCode: a.postalCode,
          country: a.country,
          phone: a.phone,
          isDefault: a.isDefault,
        }))}
      />
    </div>
  );
}
