import { COMMERCE_DEFAULTS } from "./constants";

/**
 * All money in this codebase is an integer number of paise. Never a float.
 * `formatPrice` is the only place rupees are produced, so rounding happens once.
 */

const formatter = new Intl.NumberFormat(COMMERCE_DEFAULTS.locale, {
  style: "currency",
  currency: COMMERCE_DEFAULTS.currency,
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const preciseFormatter = new Intl.NumberFormat(COMMERCE_DEFAULTS.locale, {
  style: "currency",
  currency: COMMERCE_DEFAULTS.currency,
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatPrice(paise: number): string {
  return paise % 100 === 0
    ? formatter.format(paise / 100)
    : preciseFormatter.format(paise / 100);
}

export function rupeesToPaise(rupees: number | string): number {
  return Math.round(Number(rupees) * 100);
}

export function paiseToRupees(paise: number): number {
  return paise / 100;
}

export function discountPercent(price: number, compareAt?: number | null): number | null {
  if (!compareAt || compareAt <= price) return null;
  return Math.round(((compareAt - price) / compareAt) * 100);
}
