import { existsSync } from "node:fs";
import { join } from "node:path";
import { getCart } from "@/lib/cart";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getAnnouncements, getCategories, getNavigation } from "@/lib/queries";
import { sweepOpportunistically } from "@/lib/reservations";
import { CartProvider } from "@/components/cart/CartProvider";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { WishlistProvider } from "@/components/product/WishlistButton";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CustomCursor } from "@/components/motion/CustomCursor";
import { SmoothScroll } from "@/components/motion/SmoothScroll";
import { RouteProgress } from "@/components/motion/RouteProgress";

export default async function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Fire-and-forget, roughly one page load in fifty. A deployment with no cron
  // still cannot leak stock to abandoned checkouts; see scripts/sweep-reservations.mjs
  // for the scheduled version, which is the one to prefer.
  sweepOpportunistically();

  const [cart, user, navigation, categories, announcements] = await Promise.all([
    getCart(),
    getCurrentUser(),
    getNavigation(),
    getCategories(),
    getAnnouncements(),
  ]);

  // Checked on the server: probing for the asset from the browser fired a 404
  // on every page load, which is both noise and a real (if small) request.
  const hasCursorPhoto = existsSync(join(process.cwd(), "public", "cursor", "seed.webp"));

  const wishlistIds = user
    ? (
        await prisma.wishlistItem.findMany({
          where: { userId: user.id },
          select: { productId: true },
        })
      ).map((w) => w.productId)
    : [];

  return (
    <CartProvider cart={cart}>
      <WishlistProvider productIds={wishlistIds}>
        <SmoothScroll />
        <RouteProgress />
        <CustomCursor hasPhoto={hasCursorPhoto} />

        <Header
          items={navigation.header.map((i) => ({
            id: i.id,
            label: i.label,
            href: i.href,
          }))}
          companyItems={navigation.headerCompany.map((i) => ({
            id: i.id,
            label: i.label,
            href: i.href,
          }))}
          categories={categories.map((c) => ({
            name: c.name,
            slug: c.slug,
            count: c._count.products,
          }))}
          isAuthenticated={Boolean(user)}
          announcement={announcements[0]?.message ?? null}
        />

        <main id="main">{children}</main>

        <Footer
          shop={navigation.footerShop.map((i) => ({
            id: i.id,
            label: i.label,
            href: i.href,
          }))}
          company={navigation.footerCompany.map((i) => ({
            id: i.id,
            label: i.label,
            href: i.href,
          }))}
          support={navigation.footerSupport.map((i) => ({
            id: i.id,
            label: i.label,
            href: i.href,
          }))}
        />

        <CartDrawer />
      </WishlistProvider>
    </CartProvider>
  );
}
