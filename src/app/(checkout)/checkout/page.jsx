import { redirect } from "next/navigation";
import Link from "next/link";
import { Container } from "@/components/layout/Section";
import { CheckoutForm } from "@/components/checkout/CheckoutForm";
import { Logo } from "@/components/layout/Logo";
import { getCart } from "@/lib/cart";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isRazorpayConfigured } from "@/lib/razorpay";
import { getSettings } from "@/lib/queries";
import { buildMetadata } from "@/lib/seo";
export const dynamic = "force-dynamic";
export const metadata = buildMetadata({
  title: "Checkout",
  description: "Complete your Miracle Tree order.",
  path: "/checkout",
  noIndex: true,
});
export default async function CheckoutPage() {
  const cart = await getCart();
  // An empty bag has nothing to check out; send them somewhere useful instead.
  if (!cart.lines.length) redirect("/cart");
  const [user, settings] = await Promise.all([getCurrentUser(), getSettings()]);
  const addresses = user
    ? await prisma.address.findMany({
        where: { userId: user.id },
        orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
        take: 4,
        select: {
          id: true,
          label: true,
          firstName: true,
          lastName: true,
          line1: true,
          line2: true,
          city: true,
          state: true,
          postalCode: true,
          phone: true,
        },
      })
    : [];
  return (
    <div className="bg-ink pb-24 pt-10">
      <Container>
        {/* Deliberately stripped-back chrome: no nav rail, no promotions —
            nothing competing with finishing the order. */}
        <div className="mb-12 flex items-center justify-between gap-6 border-b border-border-subtle pb-6">
          <Link href="/" aria-label="Miracle Tree — home">
            <Logo className="h-7 w-auto" />
          </Link>
          <div className="flex items-center gap-2 text-[0.66rem] uppercase tracking-[0.14em] text-cream-400">
            <svg
              width="14"
              height="14"
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.3"
              aria-hidden
              className="text-emerald-400"
            >
              <path d="M5 9V6.5a5 5 0 0 1 10 0V9M3.5 9h13v8h-13z" />
            </svg>
            Secure checkout
          </div>
        </div>

        <h1 className="mb-10 text-display text-cream-50">Checkout</h1>

        <CheckoutForm
          defaultEmail={user?.email ?? ""}
          defaultPhone={user?.phone ?? ""}
          defaultName={{ first: user?.firstName ?? "", last: user?.lastName ?? "" }}
          addresses={addresses}
          razorpayAvailable={isRazorpayConfigured()}
          codAvailable={settings.get("checkout.codEnabled") !== "false"}
        />

        {!user ? (
          <p className="mt-10 border-t border-border-subtle pt-6 text-sm text-cream-400">
            Have an account?{" "}
            <Link
              href="/login?next=/checkout"
              className="text-gold-300 underline underline-offset-4"
            >
              Sign in
            </Link>{" "}
            to use a saved address and track this order.
          </p>
        ) : null}
      </Container>
    </div>
  );
}
