import { z } from "zod";
import {
  COUPON_KINDS,
  FAQ_CATEGORIES,
  ORDER_STATUSES,
  PAYMENT_STATUSES,
  PRODUCT_STATUSES,
  REVIEW_STATUSES,
  ROLES,
} from "./constants";
/** Every value that crosses the network boundary is parsed through one of these. */
export const emailSchema = z
  .string()
  .trim()
  .min(3)
  .max(254)
  .email("Enter a valid email address.")
  .transform((v) => v.toLowerCase());
export const passwordSchema = z
  .string()
  .min(10, "Use at least 10 characters.")
  .max(200, "That password is too long.")
  .refine((v) => /[a-zA-Z]/.test(v) && /[0-9]/.test(v), {
    message: "Include at least one letter and one number.",
  });
/** Indian mobile numbers, with or without +91. */
export const phoneSchema = z
  .string()
  .trim()
  .regex(/^(\+?91[-\s]?)?[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number.");
export const postalCodeSchema = z
  .string()
  .trim()
  .regex(/^[1-9]\d{5}$/, "Enter a valid 6-digit PIN code.");
// ---------------------------------------------------------------- auth
export const registerSchema = z.object({
  firstName: z.string().trim().min(1, "Tell us your first name.").max(60),
  lastName: z.string().trim().max(60).optional().or(z.literal("")),
  email: emailSchema,
  password: passwordSchema,
  marketingOptIn: z.boolean().optional().default(false),
});
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Enter your password."),
});
export const forgotPasswordSchema = z.object({ email: emailSchema });
export const resetPasswordSchema = z.object({
  token: z.string().min(20),
  password: passwordSchema,
});
export const profileSchema = z.object({
  firstName: z.string().trim().min(1).max(60),
  lastName: z.string().trim().max(60).optional().or(z.literal("")),
  phone: phoneSchema.optional().or(z.literal("")),
  marketingOptIn: z.boolean().optional().default(false),
});
// ---------------------------------------------------------------- address
export const addressSchema = z.object({
  label: z.string().trim().max(40).optional().or(z.literal("")),
  firstName: z.string().trim().min(1, "First name is required.").max(60),
  lastName: z.string().trim().max(60).optional().or(z.literal("")),
  line1: z.string().trim().min(4, "Enter your street address.").max(160),
  line2: z.string().trim().max(160).optional().or(z.literal("")),
  city: z.string().trim().min(2, "Enter your city.").max(80),
  state: z.string().trim().min(2, "Enter your state.").max(80),
  postalCode: postalCodeSchema,
  country: z.string().trim().max(60).default("India"),
  phone: phoneSchema,
  isDefault: z.boolean().optional().default(false),
});
// ---------------------------------------------------------------- cart
export const cartAddSchema = z.object({
  productId: z.string().cuid(),
  variantId: z.string().cuid(),
  quantity: z.coerce.number().int().min(1).max(20).default(1),
});
export const cartUpdateSchema = z.object({
  itemId: z.string().cuid(),
  quantity: z.coerce.number().int().min(0).max(20),
});
export const couponSchema = z.object({
  code: z
    .string()
    .trim()
    .min(2)
    .max(40)
    .transform((v) => v.toUpperCase()),
});
// ---------------------------------------------------------------- checkout
export const checkoutSchema = z.object({
  email: emailSchema,
  phone: phoneSchema,
  firstName: z.string().trim().min(1, "First name is required.").max(60),
  lastName: z.string().trim().max(60).optional().or(z.literal("")),
  line1: z.string().trim().min(4, "Enter your street address.").max(160),
  line2: z.string().trim().max(160).optional().or(z.literal("")),
  city: z.string().trim().min(2).max(80),
  state: z.string().trim().min(2).max(80),
  postalCode: postalCodeSchema,
  country: z.string().trim().max(60).default("India"),
  notes: z.string().trim().max(500).optional().or(z.literal("")),
  paymentMethod: z.enum(["razorpay", "cod"]),
  saveAddress: z.boolean().optional().default(false),
});
export const razorpayVerifySchema = z.object({
  razorpay_order_id: z.string().min(4),
  razorpay_payment_id: z.string().min(4),
  razorpay_signature: z.string().min(4),
  orderId: z.string().cuid(),
});
// ---------------------------------------------------------------- reviews
export const reviewSchema = z.object({
  productId: z.string().cuid(),
  rating: z.coerce.number().int().min(1, "Choose a rating.").max(5),
  title: z.string().trim().max(120).optional().or(z.literal("")),
  body: z
    .string()
    .trim()
    .min(20, "Tell us a little more — at least 20 characters.")
    .max(2000),
  authorName: z.string().trim().min(2, "Enter your name.").max(80),
  authorEmail: emailSchema.optional(),
});
// ---------------------------------------------------------------- newsletter
export const newsletterSchema = z.object({
  email: emailSchema,
  source: z.string().trim().max(60).optional(),
});
export const contactSchema = z.object({
  name: z.string().trim().min(2, "Enter your name.").max(80),
  email: emailSchema,
  phone: z.string().trim().max(20).optional().or(z.literal("")),
  topic: z.string().trim().max(60).optional().or(z.literal("")),
  message: z.string().trim().min(10, "Tell us how we can help.").max(2000),
});
// ---------------------------------------------------------------- admin
const optionalInt = z.coerce.number().int().optional().nullable();
export const adminProductSchema = z.object({
  name: z.string().trim().min(2, "Product name is required.").max(200),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(120)
    .regex(/^[a-z0-9-]+$/, "Use lowercase letters, numbers and hyphens only."),
  sku: z.string().trim().max(60).optional().or(z.literal("")),
  productType: z.string().trim().max(40).optional().or(z.literal("")),
  categoryId: z.string().cuid().optional().nullable().or(z.literal("")),
  shortDescription: z.string().trim().max(400).optional().or(z.literal("")),
  description: z.string().max(20000).optional().or(z.literal("")),
  story: z.string().max(8000).optional().or(z.literal("")),
  /** Rupees in the form; converted to paise before it reaches the database. */
  price: z.coerce.number().min(0).max(10_000_000),
  compareAtPrice: z.coerce.number().min(0).max(10_000_000).optional().nullable(),
  taxRatePct: z.coerce.number().int().min(0).max(50).default(0),
  weightGrams: optionalInt,
  dimensions: z.string().trim().max(60).optional().or(z.literal("")),
  status: z.enum(PRODUCT_STATUSES),
  isFeatured: z.boolean().default(false),
  isHeroPack: z.boolean().default(false),
  isNew: z.boolean().default(false),
  isBestSeller: z.boolean().default(false),
  isOnSale: z.boolean().default(false),
  model3dUrl: z.string().trim().max(500).optional().or(z.literal("")),
  videoUrl: z.string().trim().max(500).optional().or(z.literal("")),
  seoTitle: z.string().trim().max(70).optional().or(z.literal("")),
  seoDescription: z.string().trim().max(180).optional().or(z.literal("")),
  seoKeywords: z.string().trim().max(300).optional().or(z.literal("")),
  ogImageUrl: z.string().trim().max(500).optional().or(z.literal("")),
});
export const adminVariantSchema = z.object({
  id: z.string().cuid().optional(),
  name: z.string().trim().min(1, "Variant name is required.").max(80),
  sku: z.string().trim().max(60).optional().or(z.literal("")),
  price: z.coerce.number().min(0).max(10_000_000),
  compareAtPrice: z.coerce.number().min(0).max(10_000_000).optional().nullable(),
  weightGrams: optionalInt,
  imageUrl: z.string().trim().max(500).optional().or(z.literal("")),
  isActive: z.boolean().default(true),
  onHand: z.coerce.number().int().min(0).max(1_000_000).default(0),
  lowStockAt: z.coerce.number().int().min(0).max(10_000).default(10),
});
export const adminOrderStatusSchema = z.object({
  orderId: z.string().cuid(),
  status: z.enum(ORDER_STATUSES),
  message: z.string().trim().max(300).optional().or(z.literal("")),
  trackingNumber: z.string().trim().max(80).optional().or(z.literal("")),
  trackingUrl: z.string().trim().max(400).optional().or(z.literal("")),
});
export const adminPaymentStatusSchema = z.object({
  orderId: z.string().cuid(),
  paymentStatus: z.enum(PAYMENT_STATUSES),
});
/**
 * The Our Story records: the timeline, the awards shelf, and the credits.
 *
 * `sourceUrl` is optional but `source` is not encouraged without it — for a food
 * brand, an award a reader cannot trace is worse than one not listed at all.
 * The page renders every citation it is given, so what matters is that the
 * admin can always attach one.
 */
/**
 * A ritual is a set of variant ids and nothing more. The client never sends a
 * price, a quantity or a discount — all three are derived on the server.
 */
export const ritualSchema = z.object({
  variantIds: z.array(z.string().cuid()).min(1).max(8),
});
export const adminMilestoneSchema = z.object({
  year: z.string().trim().min(1, "Give the year.").max(24),
  title: z.string().trim().min(1, "Give it a title.").max(160),
  body: z.string().trim().max(2000).optional().or(z.literal("")),
  source: z.string().trim().max(160).optional().or(z.literal("")),
  sourceUrl: z
    .string()
    .trim()
    .url("Enter a full URL.")
    .max(500)
    .optional()
    .or(z.literal("")),
  position: z.coerce.number().int().min(0).max(9999).default(0),
  isActive: z.boolean().default(true),
});
export const adminAccoladeSchema = z.object({
  kind: z.enum(["award", "certification", "recognition"]).default("award"),
  title: z.string().trim().min(1, "Give it a title.").max(200),
  issuer: z.string().trim().max(160).optional().or(z.literal("")),
  year: z.string().trim().max(24).optional().or(z.literal("")),
  body: z.string().trim().max(2000).optional().or(z.literal("")),
  source: z.string().trim().max(160).optional().or(z.literal("")),
  sourceUrl: z
    .string()
    .trim()
    .url("Enter a full URL.")
    .max(500)
    .optional()
    .or(z.literal("")),
  position: z.coerce.number().int().min(0).max(9999).default(0),
  isActive: z.boolean().default(true),
});
export const adminCreditSchema = z.object({
  name: z.string().trim().min(1, "Give a name.").max(160),
  role: z.string().trim().min(1, "Give a role.").max(160),
  body: z.string().trim().max(2000).optional().or(z.literal("")),
  group: z.enum(["team", "partner", "grower", "design"]).default("team"),
  url: z.string().trim().url("Enter a full URL.").max(500).optional().or(z.literal("")),
  position: z.coerce.number().int().min(0).max(9999).default(0),
  isActive: z.boolean().default(true),
});
/**
 * A leader's profile. `longBio` is generous because it holds the whole
 * biography as paragraphs separated by blank lines, and truncating a founder's
 * history at the form layer would be a strange place to discover the limit.
 */
export const adminLeaderSchema = z.object({
  name: z.string().trim().min(1, "Give a name.").max(160),
  role: z.string().trim().min(1, "Give a role.").max(160),
  credential: z.string().trim().max(160).optional().or(z.literal("")),
  bio: z.string().trim().max(2000).optional().or(z.literal("")),
  longBio: z.string().trim().max(20000).optional().or(z.literal("")),
  quote: z.string().trim().max(600).optional().or(z.literal("")),
  imageUrl: z.string().trim().max(500).optional().or(z.literal("")),
  source: z.string().trim().max(160).optional().or(z.literal("")),
  sourceUrl: z
    .string()
    .trim()
    .url("Enter a full URL.")
    .max(500)
    .optional()
    .or(z.literal("")),
  isFounder: z.boolean().default(false),
  position: z.coerce.number().int().min(0).max(9999).default(0),
  isActive: z.boolean().default(true),
});
/** One dated line on a leader's record. */
export const adminLeaderHighlightSchema = z.object({
  leaderId: z.string().trim().min(1, "Pick who this belongs to."),
  kind: z.enum(["award", "patent", "role", "recognition"]).default("recognition"),
  year: z.string().trim().max(24).optional().or(z.literal("")),
  title: z.string().trim().min(1, "Give it a title.").max(200),
  body: z.string().trim().max(2000).optional().or(z.literal("")),
  position: z.coerce.number().int().min(0).max(9999).default(0),
});
export const adminCouponSchema = z.object({
  code: z
    .string()
    .trim()
    .min(2)
    .max(40)
    .regex(/^[A-Za-z0-9_-]+$/, "Letters, numbers, hyphen and underscore only.")
    .transform((v) => v.toUpperCase()),
  description: z.string().trim().max(200).optional().or(z.literal("")),
  kind: z.enum(COUPON_KINDS),
  value: z.coerce.number().min(0).max(1_000_000),
  minSubtotal: z.coerce.number().min(0).max(10_000_000).default(0),
  maxDiscount: z.coerce.number().min(0).max(10_000_000).optional().nullable(),
  appliesTo: z.enum(["all", "product", "category", "first_order"]).default("all"),
  appliesToIds: z.string().trim().max(2000).optional().or(z.literal("")),
  usageLimit: optionalInt,
  perUserLimit: optionalInt,
  startsAt: z.string().optional().or(z.literal("")),
  endsAt: z.string().optional().or(z.literal("")),
  isActive: z.boolean().default(true),
});
export const adminFaqSchema = z.object({
  question: z.string().trim().min(4).max(300),
  answer: z.string().trim().min(4).max(4000),
  category: z.enum(FAQ_CATEGORIES),
  productId: z.string().cuid().optional().nullable().or(z.literal("")),
  position: z.coerce.number().int().min(0).max(999).default(0),
  isActive: z.boolean().default(true),
});
export const adminArticleSchema = z.object({
  title: z.string().trim().min(4).max(200),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(120)
    .regex(/^[a-z0-9-]+$/, "Use lowercase letters, numbers and hyphens only."),
  excerpt: z.string().trim().max(400).optional().or(z.literal("")),
  content: z.string().min(20, "Write the article body."),
  heroImageUrl: z.string().trim().max(500).optional().or(z.literal("")),
  authorName: z.string().trim().max(80).default("Miracle Tree"),
  categoryId: z.string().cuid().optional().nullable().or(z.literal("")),
  tags: z.string().trim().max(300).optional().or(z.literal("")),
  status: z.enum(["draft", "published"]),
  seoTitle: z.string().trim().max(70).optional().or(z.literal("")),
  seoDescription: z.string().trim().max(180).optional().or(z.literal("")),
});
export const adminTestimonialSchema = z.object({
  authorName: z.string().trim().min(2).max(80),
  location: z.string().trim().max(80).optional().or(z.literal("")),
  body: z.string().trim().min(10).max(1000),
  rating: z.coerce.number().int().min(1).max(5).default(5),
  imageUrl: z.string().trim().max(500).optional().or(z.literal("")),
  isActive: z.boolean().default(true),
  position: z.coerce.number().int().min(0).max(999).default(0),
});
export const adminSectionSchema = z.object({
  key: z.string().trim().min(2).max(60),
  title: z.string().trim().max(200).optional().or(z.literal("")),
  subtitle: z.string().trim().max(400).optional().or(z.literal("")),
  body: z.string().max(4000).optional().or(z.literal("")),
  ctaLabel: z.string().trim().max(60).optional().or(z.literal("")),
  ctaHref: z.string().trim().max(300).optional().or(z.literal("")),
  mediaUrl: z.string().trim().max(500).optional().or(z.literal("")),
  data: z.string().max(4000).optional().or(z.literal("")),
  isActive: z.boolean().default(true),
  position: z.coerce.number().int().min(0).max(999).default(0),
});
export const adminNavItemSchema = z.object({
  label: z.string().trim().min(1).max(60),
  href: z.string().trim().min(1).max(300),
  group: z.enum(["header", "footer-shop", "footer-company", "footer-support"]),
  position: z.coerce.number().int().min(0).max(999).default(0),
  isActive: z.boolean().default(true),
});
export const adminCategorySchema = z.object({
  name: z.string().trim().min(2).max(80),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(80)
    .regex(/^[a-z0-9-]+$/, "Use lowercase letters, numbers and hyphens only."),
  description: z.string().trim().max(600).optional().or(z.literal("")),
  imageUrl: z.string().trim().max(500).optional().or(z.literal("")),
  position: z.coerce.number().int().min(0).max(999).default(0),
  isActive: z.boolean().default(true),
  seoTitle: z.string().trim().max(70).optional().or(z.literal("")),
  seoDescription: z.string().trim().max(180).optional().or(z.literal("")),
});
export const adminInventorySchema = z.object({
  variantId: z.string().cuid(),
  delta: z.coerce.number().int().min(-100000).max(100000),
  reason: z.enum(["restock", "adjustment"]),
  reference: z.string().trim().max(120).optional().or(z.literal("")),
});
export const adminUserRoleSchema = z.object({
  userId: z.string().cuid(),
  role: z.enum(ROLES),
});
export const adminReviewModerationSchema = z.object({
  reviewId: z.string().cuid(),
  status: z.enum(REVIEW_STATUSES).optional(),
  isFeatured: z.boolean().optional(),
  isVerified: z.boolean().optional(),
});
export const adminSettingsSchema = z.record(z.string().max(80), z.string().max(2000));
// ---------------------------------------------------------------- shop query
export const shopQuerySchema = z.object({
  q: z.string().trim().max(120).optional(),
  category: z.string().trim().max(80).optional(),
  collection: z.string().trim().max(80).optional(),
  type: z.string().trim().max(40).optional(),
  ingredient: z.string().trim().max(80).optional(),
  min: z.coerce.number().min(0).optional(),
  max: z.coerce.number().min(0).optional(),
  availability: z.enum(["in-stock", "all"]).optional(),
  offers: z.coerce.boolean().optional(),
  sort: z
    .enum(["featured", "price-asc", "price-desc", "newest", "rating", "name"])
    .default("featured"),
  page: z.coerce.number().int().min(1).max(500).default(1),
});
/**
 * Reads a form field as `string | undefined`.
 *
 * `FormData.get()` returns `null` for an absent field, and `z.string().optional()`
 * accepts `undefined` but not `null` — so passing the raw value straight into a
 * schema makes any optional field that is not rendered in the form fail
 * validation. That silently broke inventory adjustments, where `reference` has
 * no input at all.
 */
export function formText(formData, key) {
  const value = formData.get(key);
  if (value === null) return undefined;
  return typeof value === "string" ? value : undefined;
}
/** Flattens a ZodError into `{ field: message }` for form rendering. */
export function fieldErrors(error) {
  const out = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_form";
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}
