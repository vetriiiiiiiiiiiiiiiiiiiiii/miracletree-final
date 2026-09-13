import { cookies } from "next/headers";

/**
 * Proof that this browser is the one that placed a given guest order.
 *
 * Guest orders have no `userId`, so ownership cannot be checked against a
 * session. The confirmation page previously fell back to "any order with no
 * user is public", which combined with sequential order numbers
 * (`MT-2609-0001`, `-0002`, …) meant the whole guest order book — names, email
 * addresses, phone numbers and shipping addresses — could be read by counting.
 *
 * A short list of recently placed order numbers is kept in an httpOnly cookie
 * instead. It is not a security token in its own right: it proves only that
 * this browser completed that checkout, which is exactly the claim the
 * confirmation page needs. Anyone returning later, or on another device, goes
 * through `/track`, which requires the email on the order as well as its
 * number.
 */

const COOKIE = "mt_orders";

/** Long enough to survive a payment redirect and some re-reading of the page. */
const TTL_SECONDS = 60 * 60 * 24 * 7;

/** Keeps the cookie small; a shopper does not need a long history here. */
const MAX_REMEMBERED = 10;

function parse(raw: string | undefined): string[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((part) => part.trim())
    .filter((part) => /^[A-Za-z0-9-]{1,32}$/.test(part));
}

/** Record that this browser just placed `orderNumber`. */
export async function rememberGuestOrder(orderNumber: string): Promise<void> {
  const store = await cookies();
  const existing = parse(store.get(COOKIE)?.value);
  if (existing.includes(orderNumber)) return;

  const next = [orderNumber, ...existing].slice(0, MAX_REMEMBERED);
  store.set(COOKIE, next.join(","), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: TTL_SECONDS,
  });
}

/** Did this browser place `orderNumber`? */
export async function placedGuestOrder(orderNumber: string): Promise<boolean> {
  const store = await cookies();
  return parse(store.get(COOKIE)?.value).includes(orderNumber);
}
