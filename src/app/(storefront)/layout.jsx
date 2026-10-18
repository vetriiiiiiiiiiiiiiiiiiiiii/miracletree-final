import { existsSync } from "node:fs";
import { join } from "node:path";
import { getCart, EMPTY_CART } from "@/lib/cart";
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
export const dynamic = "force-dynamic";

export default async function StorefrontLayout({ children }) {
  // Fire-and-forget, roughly one page load in fifty. A deployment with no cron
  // still cannot leak stock to abandoned checkouts; see scripts/sweep-reservations.mjs
  // for the scheduled version, which is the one to prefer.
  sweepOpportunistically();
  const safeCatch = (fallback) => (e) => {
    console.error("[StorefrontLayout] Data fetch error:", e);
    return fallback;
  };

  const [cart, user, navigation, categories, announcements] = await Promise.all([
    getCart().catch(safeCatch(EMPTY_CART)),
    getCurrentUser().catch(safeCatch(null)),
    getNavigation().catch(safeCatch({
      header: [],
      headerCompany: [],
      footerShop: [],
      footerCompany: [],
      footerSupport: []
    })),
    getCategories().catch(safeCatch([])),
    getAnnouncements().catch(safeCatch([])),
  ]);
  // A picture for each category in the Shop menu: the category's own image
  // from the admin, or the first pack in it.
  const covers = await prisma.product
    .findMany({
      where: { status: "published" },
      orderBy: { position: "asc" },
      select: {
        categoryId: true,
        images: { orderBy: { position: "asc" }, take: 1, select: { url: true } },
      },
    })
    .catch(safeCatch([]));
  const coverFor = (c) =>
    c.imageUrl ||
    covers.find((p) => p.categoryId === c.id && p.images[0])?.images[0].url ||
    null;
  // Checked on the server: probing for the asset from the browser fired a 404
  // on every page load, which is both noise and a real (if small) request.
  const hasCursorPhoto = existsSync(
    join(process.cwd(), "public", "cursor", "seed.webp"),
  );
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
          categories={categories
            .filter((c) => c._count.products > 0)
            .map((c) => ({
              name: c.name,
              slug: c.slug,
              count: c._count.products,
              image: coverFor(c),
            }))}
          isAuthenticated={Boolean(user)}
          announcements={announcements.map((a) => a.message)}
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
