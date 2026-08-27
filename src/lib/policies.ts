import { SITE } from "./constants";

/**
 * Default policy copy.
 *
 * The returns and payment text is carried over from the existing store's own
 * published policy — it is the business's stated position, not our invention.
 * Shipping and privacy were not published on the old site; the text below states
 * only what is observably true of this store (free shipping over ₹699, what this
 * site actually stores) and is written to be reviewed and replaced by the
 * business. Everything here is editable from admin → Settings → Policies.
 */

export const POLICY_DEFAULTS: Record<string, string> = {
  returns: `
<p>These are agricultural food products. Once an order has been delivered we cannot accept it back, because we cannot verify how a food product has been stored after it leaves us.</p>

<h2>If something is wrong with your order</h2>
<p>If your order arrives damaged, incomplete, or is not what you ordered, email <a href="mailto:${SITE.supportEmail}">${SITE.supportEmail}</a> within 48 hours of delivery with your order number and photographs of the parcel and its contents. We will replace the item or refund it.</p>

<h2>Cancellations</h2>
<p>You can cancel an order at any time before it is dispatched. Contact us with your order number and we will cancel it and refund any payment in full.</p>

<h2>Refunds</h2>
<p>Where a refund is due, it is processed to the original payment method within 5–7 working days of approval. Cash-on-delivery orders are refunded by bank transfer.</p>

<h2>Before you order</h2>
<p>Every product page carries the full description, ingredients, usage instructions and pack size. Please read them before ordering, and contact us if anything is unclear — we would rather answer a question than send you the wrong thing.</p>
`,

  shipping: `
<p>We ship across India.</p>

<h2>Charges</h2>
<ul>
  <li>Free on orders above ₹699.</li>
  <li>A flat ₹60 applies below that.</li>
</ul>

<h2>Dispatch</h2>
<p>Orders are packed within one to two working days. We do not dispatch on Sundays or public holidays.</p>

<h2>Delivery time</h2>
<p>Delivery usually takes three to seven working days from dispatch, depending on your PIN code. Remote and north-eastern PIN codes can take longer.</p>

<h2>Tracking</h2>
<p>Once your parcel is handed to the courier you will receive a tracking number by email. Signed-in customers can also see it under Account → Orders.</p>

<h2>If a delivery fails</h2>
<p>Couriers usually make two or three attempts. If a parcel is returned to us undelivered we will contact you to arrange a redelivery. Please make sure your phone number is correct at checkout — most failed deliveries are failed phone calls.</p>

<h2>Bulk and export</h2>
<p>Wholesale and export orders are handled separately through <a href="${SITE.bulkOrders}">indiamoringa.com</a>.</p>
`,

  privacy: `
<p>This policy explains what this website collects, why, and what we do with it. It covers ${SITE.legalName} and the store at this domain.</p>

<h2>What we collect</h2>
<ul>
  <li><strong>When you order:</strong> your name, email address, phone number and delivery address. We need these to take payment and deliver the order.</li>
  <li><strong>When you create an account:</strong> the same details, plus a hashed password. We never store your password itself.</li>
  <li><strong>When you subscribe:</strong> your email address only.</li>
  <li><strong>When you browse:</strong> a cart identifier stored in a cookie, and anonymous usage statistics.</li>
</ul>

<h2>What we do not collect</h2>
<p>We never see or store your card number, UPI ID or bank details. Payments are handled entirely by our payment gateway, which is PCI-DSS compliant.</p>

<h2>Cookies</h2>
<p>We use a small number of first-party cookies: one to keep your bag between visits, and one to keep you signed in. Both are strictly necessary for the store to work. Analytics, where enabled, is configured to anonymise IP addresses.</p>

<h2>Who we share it with</h2>
<p>Only the parties needed to fulfil your order: our payment gateway, and the courier delivering your parcel. We do not sell, rent or trade personal data.</p>

<h2>How long we keep it</h2>
<p>Order records are kept as long as required for tax and accounting purposes. Account details are kept until you ask us to delete them.</p>

<h2>Your choices</h2>
<p>You can ask us for a copy of the data we hold about you, ask us to correct it, or ask us to delete your account. Write to <a href="mailto:${SITE.email}">${SITE.email}</a>. You can unsubscribe from marketing email at any time using the link in any message.</p>

<h2>Contact</h2>
<p>${SITE.legalName}, ${SITE.address.line1}, ${SITE.address.line2}, ${SITE.address.city}, ${SITE.address.state} ${SITE.address.postalCode}. Email <a href="mailto:${SITE.email}">${SITE.email}</a>.</p>
`,

  terms: `
<p>By using this website and placing an order you agree to these terms.</p>

<h2>Who we are</h2>
<p>This store is operated by ${SITE.legalName}, ${SITE.address.city}, ${SITE.address.state}, India.</p>

<h2>Products</h2>
<p>Everything sold here is a food product. Nothing on this site is a medicine, and nothing here is intended to diagnose, treat, cure or prevent any disease. If you are pregnant, nursing, taking prescribed medication or managing a health condition, consult a qualified medical practitioner before adding any supplement to your diet.</p>

<h2>Pricing and availability</h2>
<p>Prices are in Indian rupees and include applicable taxes. We may change prices at any time, but the price shown when you place an order is the price you pay. Stock is limited; if an item sells out after you order it we will contact you and refund it.</p>

<h2>Orders</h2>
<p>An order is an offer to buy. We may decline an order — for example where an item is unavailable, where a pricing error is obvious, or where we cannot deliver to the address given. If we decline an order after payment, we refund it in full.</p>

<h2>Payment</h2>
<p>We accept cards, UPI, net banking and wallets through our payment gateway, and cash on delivery where available for your PIN code. Payment is taken at the time of the order except for cash on delivery.</p>

<h2>Delivery, returns and refunds</h2>
<p>See our <a href="/shipping">shipping policy</a> and <a href="/returns">returns policy</a>, which form part of these terms.</p>

<h2>Accounts</h2>
<p>You are responsible for keeping your account password confidential. Tell us immediately if you believe someone else has used your account.</p>

<h2>Reviews and submissions</h2>
<p>Reviews must describe your own experience of a product you have used. We check every review before publishing and may decline any that are abusive, dishonest, or make medical claims.</p>

<h2>Intellectual property</h2>
<p>The text, photography and design on this site belong to ${SITE.legalName} and may not be reproduced without permission.</p>

<h2>Liability</h2>
<p>Nothing in these terms limits any liability that cannot lawfully be limited, including for death or personal injury caused by negligence.</p>

<h2>Governing law</h2>
<p>These terms are governed by the laws of India, and disputes are subject to the jurisdiction of the courts of Madurai, Tamil Nadu.</p>

<h2>Contact</h2>
<p>Questions about these terms: <a href="mailto:${SITE.email}">${SITE.email}</a>.</p>
`,
};
