"use client";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  useTransition,
} from "react";
import { useRouter } from "next/navigation";
import {
  addToCartAction,
  applyCouponAction,
  removeCouponAction,
  updateCartItemAction,
} from "@/app/actions/cart";
import { analytics } from "@/lib/analytics";
import { Toasts, useToastState } from "@/components/ui/Toast";
const CartContext = createContext(null);
/**
 * The cart lives on the server; this provider only mirrors it and coordinates
 * the drawer. Quantities shown are always the server's, so a stock rejection
 * can never leave the UI claiming something is in the bag when it is not.
 */
export function CartProvider({ cart, children }) {
  const [isOpen, setIsOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const toasts = useToastState();
  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const add = useCallback(
    async ({ productId, variantId, quantity = 1, meta }) => {
      const result = await addToCartAction({ productId, variantId, quantity });
      if (!result.ok) {
        toasts.push({ tone: "error", message: result.error });
        return false;
      }
      analytics.addToCart({
        item_id: productId,
        item_name: meta.name,
        item_variant: meta.variantName,
        item_category: meta.category,
        price: meta.price / 100,
        quantity,
      });
      startTransition(() => router.refresh());
      toasts.push({ tone: "success", message: result.message ?? "Added to your bag." });
      setIsOpen(true);
      return true;
    },
    [router, toasts],
  );
  const setQuantity = useCallback(
    async (itemId, quantity) => {
      const line = cart.lines.find((l) => l.id === itemId);
      const result = await updateCartItemAction({ itemId, quantity });
      if (!result.ok) {
        toasts.push({ tone: "error", message: result.error });
        return;
      }
      if (line && quantity < line.quantity) {
        analytics.removeFromCart({
          item_id: line.productId,
          item_name: line.productName,
          item_variant: line.variantName,
          price: line.unitPrice / 100,
          quantity: line.quantity - quantity,
        });
      }
      startTransition(() => router.refresh());
    },
    [cart.lines, router, toasts],
  );
  const remove = useCallback(async (itemId) => setQuantity(itemId, 0), [setQuantity]);
  const applyCoupon = useCallback(
    async (code) => {
      const result = await applyCouponAction(code);
      if (!result.ok) return result.error;
      startTransition(() => router.refresh());
      toasts.push({ tone: "success", message: result.message ?? "Discount applied." });
      return null;
    },
    [router, toasts],
  );
  const removeCoupon = useCallback(async () => {
    await removeCouponAction();
    startTransition(() => router.refresh());
  }, [router]);
  const value = useMemo(
    () => ({
      cart,
      isOpen,
      pending,
      open,
      close,
      add,
      setQuantity,
      remove,
      applyCoupon,
      removeCoupon,
    }),
    [
      cart,
      isOpen,
      pending,
      open,
      close,
      add,
      setQuantity,
      remove,
      applyCoupon,
      removeCoupon,
    ],
  );
  return (
    <CartContext.Provider value={value}>
      {children}
      <Toasts items={toasts.items} onDismiss={toasts.dismiss} />
    </CartContext.Provider>
  );
}
export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used inside <CartProvider>.");
  return context;
}
