/**
 * Domain vocabularies. The database stores these as plain strings so the schema
 * stays portable between SQLite and Postgres; these unions are the source of
 * truth for validation at the application boundary.
 */

export const ROLES = ["customer", "staff", "admin"] as const;
export type Role = (typeof ROLES)[number];

export const PRODUCT_STATUSES = ["draft", "published", "archived"] as const;
export type ProductStatus = (typeof PRODUCT_STATUSES)[number];

export const ORDER_STATUSES = [
  "pending",
  "confirmed",
  "processing",
  "packed",
  "shipped",
  "out_for_delivery",
  "delivered",
  "cancelled",
  "refunded",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  processing: "Processing",
  packed: "Packed",
  shipped: "Shipped",
  out_for_delivery: "Out for delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
  refunded: "Refunded",
};

/** Statuses that no longer hold reserved stock. */
export const TERMINAL_ORDER_STATUSES: OrderStatus[] = [
  "delivered",
  "cancelled",
  "refunded",
];

export const PAYMENT_STATUSES = ["unpaid", "paid", "failed", "refunded"] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const REVIEW_STATUSES = ["pending", "approved", "rejected"] as const;
export type ReviewStatus = (typeof REVIEW_STATUSES)[number];

export const COUPON_KINDS = ["percentage", "fixed", "free_shipping"] as const;
export type CouponKind = (typeof COUPON_KINDS)[number];

export const FAQ_CATEGORIES = [
  "moringa",
  "products",
  "usage",
  "shipping",
  "returns",
  "orders",
  "payments",
  "ingredients",
  "storage",
  "general",
] as const;
export type FaqCategory = (typeof FAQ_CATEGORIES)[number];

export const INVENTORY_REASONS = [
  "sale",
  "restock",
  "adjustment",
  "cancellation",
  "reservation",
  "release",
] as const;

/** Commerce defaults. Overridable from admin → settings (SiteSetting). */
export const COMMERCE_DEFAULTS = {
  currency: "INR",
  locale: "en-IN",
  /** Free shipping above this subtotal, in paise. Matches the live store's Rs.699. */
  freeShippingThreshold: 69900,
  /** Flat shipping fee below the threshold, in paise. */
  flatShippingFee: 6000,
  codEnabled: true,
} as const;

export const SITE = {
  name: "Miracle Tree",
  legalName: "Miracletree Life Science",
  tagline: "From the Miracle Tree.",
  description:
    "Moringa-grown wellness from Madurai, Tamil Nadu. Leaf powders, teas, tablets and superfoods made from the miracle tree.",
  email: "info@miracletree.in",
  supportEmail: "support@miracletree.in",
  phone: "+91 79040 57352",
  phoneHours: "Mon–Sat, 10am–5pm IST",
  address: {
    line1: "Plot 7 - Door 121/2",
    line2: "Milakaranai Bus Stop",
    city: "Madurai",
    state: "Tamil Nadu",
    postalCode: "625018",
    country: "India",
  },
  social: {
    instagram: "https://www.instagram.com/miracle_tree_life_science/",
    facebook: "https://www.facebook.com/miracletree.miracletree.9",
    youtube: "https://www.youtube.com/@miracletreelifescience",
  },
  bulkOrders: "https://indiamoringa.com",
} as const;
