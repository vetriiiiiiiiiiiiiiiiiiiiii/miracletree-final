"use client";

import Image from "next/image";
import Link from "next/link";
import Script from "next/script";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Input, Textarea, Checkbox, FormMessage } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { useCart } from "@/components/cart/CartProvider";
import { placeOrderAction, verifyPaymentAction } from "@/app/actions/checkout";
import { formatPrice } from "@/lib/money";
import { cn } from "@/lib/utils";
import { analytics } from "@/lib/analytics";

type RazorpayResponse = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

type RazorpayWindow = Window & {
  Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
};

export type SavedAddress = {
  id: string;
  label: string | null;
  firstName: string;
  lastName: string | null;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  postalCode: string;
  phone: string;
};

/**
 * Checkout.
 *
 * One page, no steps, no animation. The only motion here is the button's
 * loading state — everything else would be friction between a decision and a
 * purchase. Totals shown are the server's; the form posts ids and an address.
 */
export function CheckoutForm({
  defaultEmail,
  defaultPhone,
  defaultName,
  addresses,
  razorpayAvailable,
  codAvailable,
}: {
  defaultEmail: string;
  defaultPhone: string;
  defaultName: { first: string; last: string };
  addresses: SavedAddress[];
  razorpayAvailable: boolean;
  codAvailable: boolean;
}) {
  const router = useRouter();
  const { cart } = useCart();
  const [method, setMethod] = useState<"razorpay" | "cod">(
    razorpayAvailable ? "razorpay" : "cod",
  );
  const [selectedAddress, setSelectedAddress] = useState<string | null>(
    addresses[0]?.id ?? null,
  );
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const address = addresses.find((a) => a.id === selectedAddress) ?? null;
  const useSaved = Boolean(address);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPending(true);
    setError(null);
    setErrors({});

    const formData = new FormData(event.currentTarget);
    formData.set("paymentMethod", method);

    // A saved address is expanded into the same fields a typed one produces,
    // so the server has exactly one shape to validate.
    if (address) {
      formData.set("firstName", address.firstName);
      formData.set("lastName", address.lastName ?? "");
      formData.set("line1", address.line1);
      formData.set("line2", address.line2 ?? "");
      formData.set("city", address.city);
      formData.set("state", address.state);
      formData.set("postalCode", address.postalCode);
      formData.set("phone", address.phone);
    }

    analytics.addPaymentInfo(
      cart.totals.grandTotal / 100,
      method,
      cart.lines.map((l) => ({
        item_id: l.productId,
        item_name: l.productName,
        item_variant: l.variantName,
        price: l.unitPrice / 100,
        quantity: l.quantity,
      })),
    );

    const result = await placeOrderAction(formData);

    if (!result.ok) {
      setPending(false);
      setError(result.error);
      setErrors(result.errors ?? {});
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    if (result.kind === "cod") {
      trackPurchase(result.orderNumber);
      router.push(`/order/${result.orderNumber}`);
      return;
    }

    const rzp = (window as RazorpayWindow).Razorpay;
    if (!rzp) {
      setPending(false);
      setError("The payment window could not load. Check your connection and try again.");
      return;
    }

    const checkout = new rzp({
      key: result.keyId,
      amount: result.amount,
      currency: "INR",
      name: "Miracle Tree",
      description: `Order ${result.orderNumber}`,
      order_id: result.razorpayOrderId,
      prefill: result.prefill,
      theme: { color: "#1c5a3a" },
      handler: async (response: RazorpayResponse) => {
        const verified = await verifyPaymentAction({
          ...response,
          orderId: result.orderId,
        });

        if (!verified.ok) {
          setPending(false);
          setError(verified.error);
          return;
        }

        trackPurchase(verified.orderNumber);
        router.push(`/order/${verified.orderNumber}`);
      },
      modal: {
        ondismiss: () => {
          setPending(false);
          setError(
            "Payment was cancelled. Your order is saved — you can pay from your account, or try again.",
          );
        },
      },
    });

    checkout.open();
  };

  const trackPurchase = (orderNumber: string) => {
    analytics.purchase({
      transaction_id: orderNumber,
      value: cart.totals.grandTotal / 100,
      shipping: cart.totals.shippingTotal / 100,
      tax: cart.totals.taxTotal / 100,
      coupon: cart.coupon?.code,
      items: cart.lines.map((l) => ({
        item_id: l.productId,
        item_name: l.productName,
        item_variant: l.variantName,
        price: l.unitPrice / 100,
        quantity: l.quantity,
      })),
    });
  };

  return (
    <>
      {razorpayAvailable ? (
        <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      ) : null}

      <form onSubmit={onSubmit} className="grid gap-12 lg:grid-cols-[1.35fr_1fr] lg:gap-16">
        <div className="grid gap-10">
          {error ? <FormMessage>{error}</FormMessage> : null}

          {/* Contact */}
          <section aria-labelledby="contact-heading" className="grid gap-5">
            <h2 id="contact-heading" className="text-title text-cream-50">
              Contact
            </h2>
            <div className="grid gap-5 sm:grid-cols-2">
              <Input
                label="Email"
                name="email"
                type="email"
                autoComplete="email"
                required
                defaultValue={defaultEmail}
                error={errors.email}
                hint="For your order confirmation."
              />
              <Input
                label="Mobile"
                name="phone"
                type="tel"
                inputMode="numeric"
                autoComplete="tel"
                required={!useSaved}
                defaultValue={defaultPhone}
                error={errors.phone}
                hint="For delivery updates."
              />
            </div>
          </section>

          {/* Address */}
          <section aria-labelledby="address-heading" className="grid gap-5">
            <h2 id="address-heading" className="text-title text-cream-50">
              Delivery address
            </h2>

            {addresses.length ? (
              <div className="grid gap-3">
                {addresses.map((saved) => (
                  <label
                    key={saved.id}
                    className={cn(
                      "flex cursor-pointer gap-3 border p-4 transition-colors",
                      selectedAddress === saved.id
                        ? "border-gold-400 bg-white/[0.03]"
                        : "border-white/12 hover:border-white/25",
                    )}
                  >
                    <input
                      type="radio"
                      name="savedAddress"
                      className="sr-only"
                      checked={selectedAddress === saved.id}
                      onChange={() => setSelectedAddress(saved.id)}
                    />
                    <span
                      className={cn(
                        "mt-1 h-3 w-3 shrink-0 rounded-full border",
                        selectedAddress === saved.id
                          ? "border-gold-400 bg-gold-400"
                          : "border-white/30",
                      )}
                      aria-hidden
                    />
                    <span className="text-sm leading-relaxed text-cream-200">
                      <span className="block text-cream-50">
                        {saved.firstName} {saved.lastName}
                        {saved.label ? (
                          <span className="ml-2 text-xs text-cream-400">{saved.label}</span>
                        ) : null}
                      </span>
                      {saved.line1}
                      {saved.line2 ? `, ${saved.line2}` : ""}, {saved.city},{" "}
                      {saved.state} {saved.postalCode}
                      <span className="mt-1 block text-xs text-cream-400">{saved.phone}</span>
                    </span>
                  </label>
                ))}

                <label
                  className={cn(
                    "flex cursor-pointer items-center gap-3 border p-4 text-sm transition-colors",
                    selectedAddress === null
                      ? "border-gold-400 bg-white/[0.03]"
                      : "border-white/12 hover:border-white/25",
                  )}
                >
                  <input
                    type="radio"
                    name="savedAddress"
                    className="sr-only"
                    checked={selectedAddress === null}
                    onChange={() => setSelectedAddress(null)}
                  />
                  <span
                    className={cn(
                      "h-3 w-3 shrink-0 rounded-full border",
                      selectedAddress === null ? "border-gold-400 bg-gold-400" : "border-white/30",
                    )}
                    aria-hidden
                  />
                  Use a different address
                </label>
              </div>
            ) : null}

            {!useSaved ? (
              <div className="grid gap-5">
                <div className="grid gap-5 sm:grid-cols-2">
                  <Input
                    label="First name"
                    name="firstName"
                    autoComplete="given-name"
                    required
                    defaultValue={defaultName.first}
                    error={errors.firstName}
                  />
                  <Input
                    label="Last name"
                    name="lastName"
                    autoComplete="family-name"
                    defaultValue={defaultName.last}
                  />
                </div>

                <Input
                  label="Address"
                  name="line1"
                  autoComplete="address-line1"
                  required
                  placeholder="House / flat, street"
                  error={errors.line1}
                />
                <Input
                  label="Apartment, landmark (optional)"
                  name="line2"
                  autoComplete="address-line2"
                />

                <div className="grid gap-5 sm:grid-cols-3">
                  <Input
                    label="City"
                    name="city"
                    autoComplete="address-level2"
                    required
                    error={errors.city}
                  />
                  <Input
                    label="State"
                    name="state"
                    autoComplete="address-level1"
                    required
                    error={errors.state}
                  />
                  <Input
                    label="PIN code"
                    name="postalCode"
                    inputMode="numeric"
                    autoComplete="postal-code"
                    required
                    maxLength={6}
                    error={errors.postalCode}
                  />
                </div>

                <input type="hidden" name="country" value="India" />

                <Checkbox name="saveAddress" label="Save this address for next time" />
              </div>
            ) : null}
          </section>

          {/* Payment */}
          <section aria-labelledby="payment-heading" className="grid gap-5">
            <h2 id="payment-heading" className="text-title text-cream-50">
              Payment
            </h2>

            <div className="grid gap-3">
              {razorpayAvailable ? (
                <PaymentOption
                  checked={method === "razorpay"}
                  onSelect={() => setMethod("razorpay")}
                  title="Card, UPI, net banking or wallet"
                  body="You'll complete payment in a secure window. We never see your card details."
                />
              ) : null}

              {codAvailable ? (
                <PaymentOption
                  checked={method === "cod"}
                  onSelect={() => setMethod("cod")}
                  title="Cash on delivery"
                  body="Pay the courier when your order arrives."
                />
              ) : null}
            </div>

            <Textarea
              label="Order notes (optional)"
              name="notes"
              rows={3}
              placeholder="Delivery instructions, a landmark, anything we should know."
              maxLength={500}
            />
          </section>
        </div>

        {/* Summary */}
        <aside className="lg:sticky lg:top-28 lg:self-start">
          <div className="border border-white/12 bg-white/[0.02] p-6 md:p-8">
            <h2 className="text-title text-cream-50">Your order</h2>

            <ul className="mt-6 grid gap-4 border-b border-white/10 pb-6">
              {cart.lines.map((line) => (
                <li key={line.id} className="flex gap-4">
                  <div className="relative h-16 w-14 shrink-0 overflow-hidden bg-ink-800">
                    {line.imageUrl ? (
                      <Image
                        src={line.imageUrl}
                        alt=""
                        fill
                        sizes="56px"
                        className="object-contain p-1.5"
                      />
                    ) : null}
                    <span className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full bg-ink-600 text-[0.65rem] tabular-nums text-cream-100">
                      {line.quantity}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-cream-100">{line.productName}</p>
                    <p className="text-xs text-cream-400">{line.variantName}</p>
                  </div>
                  <span className="shrink-0 text-sm tabular-nums text-cream-200">
                    {formatPrice(line.lineTotal)}
                  </span>
                </li>
              ))}
            </ul>

            <dl className="mt-6 grid gap-2.5 text-sm">
              <SummaryRow label="Subtotal" value={formatPrice(cart.totals.subtotal)} />
              {cart.totals.discountTotal > 0 ? (
                <SummaryRow
                  label={`Discount${cart.coupon ? ` (${cart.coupon.code})` : ""}`}
                  value={`−${formatPrice(cart.totals.discountTotal)}`}
                  tone="positive"
                />
              ) : null}
              <SummaryRow
                label="Shipping"
                value={
                  cart.totals.shippingTotal === 0
                    ? "Free"
                    : formatPrice(cart.totals.shippingTotal)
                }
              />
              <div className="mt-3 flex items-baseline justify-between border-t border-white/10 pt-4">
                <dt className="text-cream-100">Total</dt>
                <dd className="text-xl tabular-nums text-cream-50">
                  {formatPrice(cart.totals.grandTotal)}
                </dd>
              </div>
            </dl>

            <Button
              type="submit"
              size="lg"
              className="mt-7 w-full"
              loading={pending}
              disabled={cart.lines.length === 0}
            >
              {method === "cod" ? "Place order" : `Pay ${formatPrice(cart.totals.grandTotal)}`}
            </Button>

            <p className="mt-4 text-center text-xs leading-relaxed text-cream-400">
              By placing this order you agree to our{" "}
              <Link href="/terms" className="underline underline-offset-2">
                terms
              </Link>{" "}
              and{" "}
              <Link href="/returns" className="underline underline-offset-2">
                returns policy
              </Link>
              .
            </p>
          </div>
        </aside>
      </form>
    </>
  );
}

function PaymentOption({
  checked,
  onSelect,
  title,
  body,
}: {
  checked: boolean;
  onSelect: () => void;
  title: string;
  body: string;
}) {
  return (
    <label
      className={cn(
        "flex cursor-pointer gap-3 border p-4 transition-colors",
        checked ? "border-gold-400 bg-white/[0.03]" : "border-white/12 hover:border-white/25",
      )}
    >
      <input
        type="radio"
        name="paymentMethodChoice"
        className="sr-only"
        checked={checked}
        onChange={onSelect}
      />
      <span
        className={cn(
          "mt-1 h-3 w-3 shrink-0 rounded-full border",
          checked ? "border-gold-400 bg-gold-400" : "border-white/30",
        )}
        aria-hidden
      />
      <span>
        <span className="block text-sm text-cream-50">{title}</span>
        <span className="mt-1 block text-xs leading-relaxed text-cream-400">{body}</span>
      </span>
    </label>
  );
}

function SummaryRow({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "positive";
}) {
  return (
    <div className="flex items-baseline justify-between">
      <dt className="text-cream-400">{label}</dt>
      <dd className={cn("tabular-nums", tone === "positive" ? "text-leaf-300" : "text-cream-200")}>
        {value}
      </dd>
    </div>
  );
}
