"use client";

/**
 * A thin, provider-agnostic event layer. Names follow GA4's recommended
 * ecommerce vocabulary so the data is usable in GA4, GTM or a warehouse without
 * a translation table. No personally identifying data is ever sent — only ids,
 * names, categories and values.
 */

type GtagWindow = Window & {
  dataLayer?: unknown[];
  gtag?: (...args: unknown[]) => void;
};

export type AnalyticsItem = {
  item_id: string;
  item_name: string;
  item_category?: string;
  item_variant?: string;
  price: number; // rupees, not paise — GA4 expects a decimal currency value
  quantity?: number;
  index?: number;
};

function push(event: string, params: Record<string, unknown> = {}): void {
  if (typeof window === "undefined") return;
  const w = window as GtagWindow;
  w.dataLayer = w.dataLayer ?? [];
  w.dataLayer.push({ event, ...params });
  if (process.env.NODE_ENV === "development") {
    console.debug("[analytics]", event, params);
  }
}

export const analytics = {
  pageView(path: string, title?: string) {
    push("page_view", { page_path: path, page_title: title });
  },

  viewItemList(listName: string, items: AnalyticsItem[]) {
    push("view_item_list", { item_list_name: listName, items });
  },

  selectItem(listName: string, item: AnalyticsItem) {
    push("select_item", { item_list_name: listName, items: [item] });
  },

  viewItem(item: AnalyticsItem) {
    push("view_item", { currency: "INR", value: item.price, items: [item] });
  },

  addToCart(item: AnalyticsItem) {
    push("add_to_cart", {
      currency: "INR",
      value: item.price * (item.quantity ?? 1),
      items: [item],
    });
  },

  removeFromCart(item: AnalyticsItem) {
    push("remove_from_cart", {
      currency: "INR",
      value: item.price * (item.quantity ?? 1),
      items: [item],
    });
  },

  viewCart(value: number, items: AnalyticsItem[]) {
    push("view_cart", { currency: "INR", value, items });
  },

  beginCheckout(value: number, items: AnalyticsItem[], coupon?: string | null) {
    push("begin_checkout", { currency: "INR", value, coupon: coupon ?? undefined, items });
  },

  addShippingInfo(value: number, items: AnalyticsItem[]) {
    push("add_shipping_info", { currency: "INR", value, items });
  },

  addPaymentInfo(value: number, method: string, items: AnalyticsItem[]) {
    push("add_payment_info", { currency: "INR", value, payment_type: method, items });
  },

  purchase(order: {
    transaction_id: string;
    value: number;
    shipping: number;
    tax: number;
    coupon?: string | null;
    items: AnalyticsItem[];
  }) {
    push("purchase", { currency: "INR", ...order, coupon: order.coupon ?? undefined });
  },

  search(term: string, resultCount: number) {
    push("search", { search_term: term, result_count: resultCount });
  },

  addToWishlist(item: AnalyticsItem) {
    push("add_to_wishlist", { currency: "INR", value: item.price, items: [item] });
  },

  signUp(method = "email") {
    push("sign_up", { method });
  },

  login(method = "email") {
    push("login", { method });
  },

  newsletterSignup(source: string) {
    push("newsletter_signup", { source });
  },

  selectPromotion(name: string, slot: string) {
    push("select_promotion", { promotion_name: name, creative_slot: slot });
  },

  ctaClick(label: string, location: string) {
    push("cta_click", { cta_label: label, cta_location: location });
  },

  scrollDepth(percent: number) {
    push("scroll_depth", { percent_scrolled: percent });
  },
};
