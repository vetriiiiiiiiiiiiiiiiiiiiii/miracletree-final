"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { formatPrice } from "@/lib/money";

const KEY = "mt_recently_viewed";
const LIMIT = 8;

type Viewed = {
  id: string;
  name: string;
  slug: string;
  price: number;
  image: string | null;
};

function read(): Viewed[] {
  try {
    const raw = localStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.slice(0, LIMIT) : [];
  } catch {
    return [];
  }
}

/**
 * Records the current product and renders nothing. Recently-viewed is a
 * per-browser convenience, so it lives in localStorage rather than the database
 * — it needs no account, and it never leaves the device.
 */
export function RecentlyViewed({
  productId,
  product,
}: {
  productId: string;
  product: Viewed;
}) {
  useEffect(() => {
    try {
      const next = [product, ...read().filter((p) => p.id !== productId)].slice(0, LIMIT);
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      // Private browsing. Nothing depends on this succeeding.
    }
  }, [productId, product]);

  return null;
}

/** The rail itself, rendered on the cart and shop pages. */
export function RecentlyViewedRail({ excludeId }: { excludeId?: string }) {
  const [items, setItems] = useState<Viewed[]>([]);

  useEffect(() => {
    setItems(read().filter((p) => p.id !== excludeId));
  }, [excludeId]);

  if (items.length < 2) return null;

  return (
    <section aria-labelledby="recently-viewed" className="border-t border-white/10 pt-10">
      <h2 id="recently-viewed" className="eyebrow mb-6 text-gold-400/80">
        Recently viewed
      </h2>

      <ul className="flex gap-5 overflow-x-auto pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {items.map((item) => (
          <li key={item.id} className="w-36 shrink-0">
            <Link href={`/product/${item.slug}`} className="group block">
              <div className="relative aspect-square overflow-hidden bg-ink-800">
                {item.image ? (
                  <Image
                    src={item.image}
                    alt=""
                    fill
                    sizes="144px"
                    className="object-contain p-3 transition-transform duration-700 group-hover:scale-105"
                  />
                ) : null}
              </div>
              <p className="mt-3 line-clamp-2 text-xs leading-snug text-cream-200">
                {item.name}
              </p>
              <p className="mt-1 text-xs tabular-nums text-cream-400">
                {formatPrice(item.price)}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
