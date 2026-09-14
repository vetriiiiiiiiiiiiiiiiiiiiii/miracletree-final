import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
export const metadata = {
  title: { default: "Admin", template: "%s — Miracle Tree admin" },
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";
export default async function AdminLayout({ children }) {
  const user = await getCurrentUser();
  // /admin/login lives outside this route group precisely so it does not hit
  // this guard. Everything inside it is staff-only, re-checked against the
  // database rather than trusting the middleware's token check.
  if (!user || (user.role !== "admin" && user.role !== "staff")) {
    redirect("/admin/login");
  }
  const [pendingOrders, pendingReviews, lowStock] = await Promise.all([
    prisma.order.count({ where: { status: { in: ["pending", "confirmed"] } } }),
    prisma.review.count({ where: { status: "pending" } }),
    prisma.inventory.count({
      where: { trackInventory: true, onHand: { lte: 10 } },
    }),
  ]);
  return (
    <AdminShell
      user={{
        name: [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email,
        email: user.email,
        role: user.role,
      }}
      pendingCounts={{
        orders: pendingOrders,
        reviews: pendingReviews,
        lowStock,
      }}
    >
      {children}
    </AdminShell>
  );
}
