import { SITE } from "@/lib/constants";
import { formatPrice } from "@/lib/money";
import { siteUrl } from "@/lib/seo";
import type { MailMessage } from "@/lib/mail";

/**
 * The transactional emails, as data.
 *
 * Deliberately plain HTML with inline styles and a real text part. Email
 * clients are not browsers: no external stylesheet, no custom font, no grid,
 * and nothing that breaks if images are blocked. Gmail strips `<style>` blocks
 * in some contexts, so every rule that matters is on the element.
 *
 * Every template is also readable as text alone. The text part is not a
 * courtesy — it is what lands in spam filters' hands and in clients that
 * refuse HTML.
 */

const INK = "#12211a";
const MUTED = "#5b6760";
const LINE = "#e2ded1";
const ACCENT = "#1a6a3f";

function escape(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Frame shared by every message: a wordmark, the body, and a plain footer. */
function shell(heading: string, body: string): string {
  return `<!doctype html>
<html><body style="margin:0;padding:0;background:#f4f1e8;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f1e8;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid ${LINE};">
        <tr><td style="padding:28px 32px;border-bottom:1px solid ${LINE};">
          <span style="font-family:Georgia,serif;font-size:18px;color:${INK};">${SITE.name}</span>
          <span style="font-family:Arial,sans-serif;font-size:10px;letter-spacing:1.5px;color:${MUTED};text-transform:uppercase;">&nbsp;&nbsp;Life Science</span>
        </td></tr>
        <tr><td style="padding:32px;font-family:Arial,Helvetica,sans-serif;color:${INK};">
          <h1 style="margin:0 0 20px;font-family:Georgia,serif;font-size:24px;font-weight:normal;color:${INK};">${heading}</h1>
          ${body}
        </td></tr>
        <tr><td style="padding:24px 32px;border-top:1px solid ${LINE};font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.6;color:${MUTED};">
          ${escape(SITE.legalName)}<br>
          ${escape(SITE.address.line1)}, ${escape(SITE.address.line2)}<br>
          ${escape(SITE.address.city)}, ${escape(SITE.address.state)} ${escape(SITE.address.postalCode)}<br>
          <a href="mailto:${SITE.email}" style="color:${MUTED};">${SITE.email}</a> &nbsp;·&nbsp; ${escape(SITE.phone)}
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

function button(href: string, label: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:26px 0;"><tr>
    <td style="background:${ACCENT};">
      <a href="${href}" style="display:inline-block;padding:13px 26px;font-family:Arial,sans-serif;font-size:13px;letter-spacing:1px;text-transform:uppercase;color:#ffffff;text-decoration:none;">${escape(label)}</a>
    </td></tr></table>`;
}

export type OrderMailData = {
  orderNumber: string;
  customerName: string;
  email: string;
  items: { name: string; quantity: number; lineTotal: number }[];
  subtotal: number;
  discountTotal: number;
  shippingTotal: number;
  grandTotal: number;
  paymentMethod: string;
  shippingAddress: string[];
};

function itemRows(items: OrderMailData["items"]): string {
  return items
    .map(
      (item) => `<tr>
        <td style="padding:10px 0;border-bottom:1px solid ${LINE};font-size:14px;color:${INK};">
          ${escape(item.name)}<span style="color:${MUTED};"> × ${item.quantity}</span>
        </td>
        <td align="right" style="padding:10px 0;border-bottom:1px solid ${LINE};font-size:14px;color:${INK};white-space:nowrap;">
          ${escape(formatPrice(item.lineTotal))}
        </td>
      </tr>`,
    )
    .join("");
}

function totalRow(label: string, value: string, bold = false): string {
  const weight = bold ? "font-weight:bold;" : "";
  return `<tr>
    <td style="padding:6px 0;font-size:14px;color:${bold ? INK : MUTED};${weight}">${escape(label)}</td>
    <td align="right" style="padding:6px 0;font-size:14px;color:${INK};${weight}white-space:nowrap;">${escape(value)}</td>
  </tr>`;
}

/** Receipt for the shopper. */
export function orderConfirmation(order: OrderMailData): MailMessage {
  const trackUrl = siteUrl("/track");
  const lines = order.items
    .map((i) => `  ${i.name} × ${i.quantity} — ${formatPrice(i.lineTotal)}`)
    .join("\n");

  const text = `Thanks for your order, ${order.customerName}.

Order ${order.orderNumber}

${lines}

Subtotal        ${formatPrice(order.subtotal)}
${order.discountTotal > 0 ? `Discount        −${formatPrice(order.discountTotal)}\n` : ""}Shipping        ${order.shippingTotal === 0 ? "Free" : formatPrice(order.shippingTotal)}
Total           ${formatPrice(order.grandTotal)}

Paid by: ${order.paymentMethod}

Shipping to:
${order.shippingAddress.map((l) => `  ${l}`).join("\n")}

Track your order at ${trackUrl} using this order number and this email address.

${SITE.legalName} · ${SITE.phone} · ${SITE.phoneHours}`;

  const html = shell(
    "Thanks for your order",
    `<p style="margin:0 0 18px;font-size:15px;line-height:1.6;">
       ${escape(order.customerName)}, we have your order and will send another note when it ships.
     </p>
     <p style="margin:0 0 8px;font-size:13px;color:${MUTED};">Order number</p>
     <p style="margin:0 0 26px;font-family:Georgia,serif;font-size:20px;">${escape(order.orderNumber)}</p>

     <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${itemRows(order.items)}</table>

     <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:14px;">
       ${totalRow("Subtotal", formatPrice(order.subtotal))}
       ${order.discountTotal > 0 ? totalRow("Discount", `−${formatPrice(order.discountTotal)}`) : ""}
       ${totalRow("Shipping", order.shippingTotal === 0 ? "Free" : formatPrice(order.shippingTotal))}
       ${totalRow("Total", formatPrice(order.grandTotal), true)}
     </table>

     <p style="margin:26px 0 6px;font-size:13px;color:${MUTED};">Paid by ${escape(order.paymentMethod)}</p>
     <p style="margin:0 0 4px;font-size:13px;color:${MUTED};">Shipping to</p>
     <p style="margin:0;font-size:14px;line-height:1.6;">${order.shippingAddress.map(escape).join("<br>")}</p>

     ${button(trackUrl, "Track this order")}
     <p style="margin:0;font-size:13px;line-height:1.6;color:${MUTED};">
       Use the order number above and this email address to check its progress at any time.
     </p>`,
  );

  return {
    to: order.email,
    subject: `Order ${order.orderNumber} confirmed — ${SITE.name}`,
    text,
    html,
    replyTo: SITE.supportEmail,
  };
}

/** The operational copy, so someone actually packs it. */
export function newOrderAlert(order: OrderMailData, to: string): MailMessage {
  const lines = order.items.map((i) => `  ${i.name} × ${i.quantity}`).join("\n");
  return {
    to,
    subject: `New order ${order.orderNumber} — ${formatPrice(order.grandTotal)}`,
    text: `New order ${order.orderNumber}

${order.customerName} <${order.email}>
Total: ${formatPrice(order.grandTotal)} (${order.paymentMethod})

${lines}

Ship to:
${order.shippingAddress.map((l) => `  ${l}`).join("\n")}

Open it: ${siteUrl("/admin/orders")}`,
    replyTo: order.email,
  };
}

/** Status changed — shipped, delivered, cancelled. */
export function orderStatusUpdate(input: {
  orderNumber: string;
  email: string;
  customerName: string;
  statusLabel: string;
  message?: string | null;
}): MailMessage {
  const trackUrl = siteUrl("/track");
  return {
    to: input.email,
    subject: `Order ${input.orderNumber} — ${input.statusLabel}`,
    text: `${input.customerName}, your order ${input.orderNumber} is now: ${input.statusLabel}.
${input.message ? `\n${input.message}\n` : ""}
Track it at ${trackUrl} with this order number and email address.

${SITE.legalName} · ${SITE.phone}`,
    html: shell(
      `Your order is ${input.statusLabel.toLowerCase()}`,
      `<p style="margin:0 0 18px;font-size:15px;line-height:1.6;">
         ${escape(input.customerName)}, order
         <strong>${escape(input.orderNumber)}</strong> is now
         <strong>${escape(input.statusLabel.toLowerCase())}</strong>.
       </p>
       ${input.message ? `<p style="margin:0 0 18px;font-size:14px;line-height:1.6;color:${MUTED};">${escape(input.message)}</p>` : ""}
       ${button(trackUrl, "Track this order")}`,
    ),
    replyTo: SITE.supportEmail,
  };
}

/** The one email whose absence makes a feature non-functional. */
export function passwordReset(input: { email: string; token: string }): MailMessage {
  const url = siteUrl(`/reset-password?token=${encodeURIComponent(input.token)}`);
  return {
    to: input.email,
    subject: `Reset your ${SITE.name} password`,
    text: `Someone asked to reset the password for this ${SITE.name} account.

Open this link to choose a new one. It expires in one hour and can be used once:

${url}

If it was not you, ignore this email — nothing has changed.

${SITE.legalName} · ${SITE.phone}`,
    html: shell(
      "Reset your password",
      `<p style="margin:0 0 18px;font-size:15px;line-height:1.6;">
         Someone asked to reset the password for this ${escape(SITE.name)} account.
         Choose a new one with the button below.
       </p>
       ${button(url, "Choose a new password")}
       <p style="margin:0 0 14px;font-size:13px;line-height:1.6;color:${MUTED};">
         The link expires in one hour and can be used once. If it was not you,
         ignore this email — nothing has changed.
       </p>
       <p style="margin:0;font-size:12px;line-height:1.6;color:${MUTED};word-break:break-all;">
         ${escape(url)}
       </p>`,
    ),
  };
}
