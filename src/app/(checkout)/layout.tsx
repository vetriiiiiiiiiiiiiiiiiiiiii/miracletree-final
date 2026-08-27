import { getCart } from "@/lib/cart";
import { CartProvider } from "@/components/cart/CartProvider";

/**
 * Checkout and order confirmation deliberately sit outside the storefront
 * chrome.
 *
 * The storefront layout adds a full navigation bar, an announcement strip, a
 * cart drawer and a footer with a newsletter form. On the highest-intent page
 * in the store all of that is competition: two logos, a second email field, and
 * a dozen links out of the funnel. These routes keep the cart context (they
 * need it to price the order) and drop everything else.
 */
export default async function CheckoutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cart = await getCart();

  return (
    <CartProvider cart={cart}>
      <main id="main">{children}</main>
    </CartProvider>
  );
}
