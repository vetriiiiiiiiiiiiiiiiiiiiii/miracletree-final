"use client";

import { createContext, useCallback, useContext, useOptimistic, useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { toggleWishlistAction } from "@/app/actions/wishlist";
import { analytics } from "@/lib/analytics";

const WishlistContext = createContext<{
  ids: Set<string>;
  toggle: (productId: string, productName: string) => Promise<void>;
} | null>(null);

/**
 * Wishlist membership is server state, mirrored here so a card can render the
 * saved state without its own request. Toggling is optimistic — the heart fills
 * on click and reverts only if the server rejects it.
 */
export function WishlistProvider({
  productIds,
  children,
}: {
  productIds: string[];
  children: ReactNode;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [optimisticIds, setOptimisticIds] = useOptimistic(
    productIds,
    (current: string[], productId: string) =>
      current.includes(productId)
        ? current.filter((id) => id !== productId)
        : [...current, productId],
  );

  const toggle = useCallback(
    async (productId: string, productName: string) => {
      startTransition(async () => {
        setOptimisticIds(productId);
        const result = await toggleWishlistAction(productId);

        if (!result.ok) {
          if (result.requiresAuth) {
            router.push(`/login?next=${encodeURIComponent(window.location.pathname)}`);
          }
          router.refresh();
          return;
        }

        if (result.wishlisted) {
          analytics.addToWishlist({ item_id: productId, item_name: productName, price: 0 });
        }
        router.refresh();
      });
    },
    [router, setOptimisticIds],
  );

  return (
    <WishlistContext.Provider value={{ ids: new Set(optimisticIds), toggle }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function WishlistButton({
  productId,
  productName,
  className,
  showLabel = false,
}: {
  productId: string;
  productName: string;
  className?: string;
  showLabel?: boolean;
}) {
  const context = useContext(WishlistContext);
  const [pulse, setPulse] = useState(false);
  const saved = context?.ids.has(productId) ?? false;

  const onClick = () => {
    setPulse(true);
    window.setTimeout(() => setPulse(false), 400);
    void context?.toggle(productId, productName);
  };

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={saved}
      aria-label={saved ? `Remove ${productName} from saved` : `Save ${productName}`}
      className={cn(
        "relative z-20 inline-flex items-center gap-2 p-2 text-cream-300 transition-colors duration-300",
        "hover:text-gold-300",
        saved && "text-gold-400",
        className,
      )}
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill={saved ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1.4"
        aria-hidden
        className={cn(
          "transition-transform duration-400 ease-[var(--ease-organic)]",
          pulse && "scale-125",
        )}
      >
        <path d="M12 20.5s-7.5-4.7-7.5-10.1A4.4 4.4 0 0 1 12 7.6a4.4 4.4 0 0 1 7.5 2.8c0 5.4-7.5 10.1-7.5 10.1z" />
      </svg>
      {showLabel ? (
        <span className="text-[0.7rem] uppercase tracking-[0.14em]">
          {saved ? "Saved" : "Save"}
        </span>
      ) : null}
    </button>
  );
}
