"use client";
function push(event, params = {}) {
  if (typeof window === "undefined") return;
  const w = window;
  w.dataLayer = w.dataLayer ?? [];
  w.dataLayer.push({ event, ...params });
  if (process.env.NODE_ENV === "development") {
    console.debug("[analytics]", event, params);
  }
}
export const analytics = {
  pageView(path, title) {
    push("page_view", { page_path: path, page_title: title });
  },
  viewItemList(listName, items) {
    push("view_item_list", { item_list_name: listName, items });
  },
  selectItem(listName, item) {
    push("select_item", { item_list_name: listName, items: [item] });
  },
  viewItem(item) {
    push("view_item", { currency: "INR", value: item.price, items: [item] });
  },
  addToCart(item) {
    push("add_to_cart", {
      currency: "INR",
      value: item.price * (item.quantity ?? 1),
      items: [item],
    });
  },
  removeFromCart(item) {
    push("remove_from_cart", {
      currency: "INR",
      value: item.price * (item.quantity ?? 1),
      items: [item],
    });
  },
  viewCart(value, items) {
    push("view_cart", { currency: "INR", value, items });
  },
  beginCheckout(value, items, coupon) {
    push("begin_checkout", {
      currency: "INR",
      value,
      coupon: coupon ?? undefined,
      items,
    });
  },
  addShippingInfo(value, items) {
    push("add_shipping_info", { currency: "INR", value, items });
  },
  addPaymentInfo(value, method, items) {
    push("add_payment_info", { currency: "INR", value, payment_type: method, items });
  },
  purchase(order) {
    push("purchase", { currency: "INR", ...order, coupon: order.coupon ?? undefined });
  },
  search(term, resultCount) {
    push("search", { search_term: term, result_count: resultCount });
  },
  addToWishlist(item) {
    push("add_to_wishlist", { currency: "INR", value: item.price, items: [item] });
  },
  signUp(method = "email") {
    push("sign_up", { method });
  },
  login(method = "email") {
    push("login", { method });
  },
  newsletterSignup(source) {
    push("newsletter_signup", { source });
  },
  selectPromotion(name, slot) {
    push("select_promotion", { promotion_name: name, creative_slot: slot });
  },
  ctaClick(label, location) {
    push("cta_click", { cta_label: label, cta_location: location });
  },
  scrollDepth(percent) {
    push("scroll_depth", { percent_scrolled: percent });
  },
};
