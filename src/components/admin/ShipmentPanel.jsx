"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card, Pill } from "@/components/admin/ui";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { formatPrice } from "@/lib/money";
import { cn } from "@/lib/utils";
import {
  bookReturnAction,
  cancelShipmentAction,
  courierOptionsAction,
  labelAction,
  refreshTrackingAction,
  shipOrderAction,
  syncToShiprocketAction,
} from "@/app/actions/admin/shipping";
/**
 * Shiprocket on the admin order page: send the order, pick a courier and ship
 * in one click (tracking number, pickup and label), then follow it to the
 * door — and book a return after delivery.
 */
const BUTTON =
  "inline-flex h-9 items-center justify-center px-4 text-[0.68rem] uppercase tracking-[0.12em] transition-colors disabled:opacity-50";
const PRIMARY = `${BUTTON} bg-emerald-500 text-on-accent hover:bg-emerald-400`;
const SECONDARY = `${BUTTON} border border-border-strong text-cream-100 hover:border-gold-400`;
const QUIET = "text-xs text-cream-400 underline underline-offset-4 hover:text-cream-100 disabled:opacity-50";

export function ShipmentPanel({ order, live }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [options, setOptions] = useState(null);
  const [courierId, setCourierId] = useState(null);
  const [confirming, setConfirming] = useState(null); // "ship" | "cancel" | "return"

  const run = (action, then) => {
    setError(null);
    setNotice(null);
    startTransition(async () => {
      const result = await action();
      if (!result?.ok) setError(result?.error || "Something went wrong.");
      else then?.(result);
      setConfirming(null);
      router.refresh();
    });
  };

  if (!live) {
    return (
      <Card title="Shipping">
        <p className="text-sm leading-relaxed text-cream-300">
          Shiprocket isn&rsquo;t set up on the server yet, so orders aren&rsquo;t sent to it. Add the API user&rsquo;s
          email and password to the server&rsquo;s <code>.env</code> (SHIPROCKET_EMAIL, SHIPROCKET_PASSWORD) and
          restart. Until then, enter tracking by hand below.
        </p>
      </Card>
    );
  }

  const shipped = Boolean(order.trackingNumber && order.courierName);
  const courier = options?.couriers.find((c) => c.id === courierId);
  const unpaidPrepaid = order.paymentProvider !== "cod" && order.paymentStatus !== "paid";
  const closed = ["cancelled", "refunded"].includes(order.status);
  const withCourier = ["shipped", "out_for_delivery", "delivered"].includes(order.status);

  return (
    <Card
      title="Shipping"
      description={
        order.srOrderId
          ? `In Shiprocket as order ${order.srOrderId}`
          : "Sent to Shiprocket automatically when the order is placed (card/UPI orders once paid)."
      }
    >
      <div className="grid gap-5">
        {error ? (
          <p role="alert" className="border border-danger/40 px-3 py-2 text-sm text-[#e0a19c]">
            {error}
          </p>
        ) : null}
        {notice ? <p className="border border-emerald-400/40 px-3 py-2 text-sm text-leaf-200">{notice}</p> : null}

        {/* Not in Shiprocket yet */}
        {!order.srOrderId && !closed ? (
          <div className="grid gap-3">
            {order.srSyncError ? (
              <p className="text-sm text-[#e0a19c]">Couldn&rsquo;t send to Shiprocket: {order.srSyncError}</p>
            ) : unpaidPrepaid ? (
              <p className="text-sm text-cream-300">Waiting for payment — it goes to Shiprocket once paid.</p>
            ) : (
              <p className="text-sm text-cream-300">Not in Shiprocket yet.</p>
            )}
            {!unpaidPrepaid ? (
              <button type="button" className={PRIMARY} disabled={pending} onClick={() => run(() => syncToShiprocketAction(order.id), () => setNotice("Sent to Shiprocket."))}>
                {order.srSyncError ? "Try again" : "Send to Shiprocket"}
              </button>
            ) : null}
          </div>
        ) : null}

        {/* In Shiprocket, no courier yet: choose and ship */}
        {order.srOrderId && !shipped && !closed ? (
          <div className="grid gap-3">
            {!options ? (
              <button
                type="button"
                className={PRIMARY}
                disabled={pending}
                onClick={() =>
                  run(
                    () => courierOptionsAction(order.id),
                    (result) => {
                      setOptions(result);
                      setCourierId(result.recommendedId);
                    },
                  )
                }
              >
                {pending ? "Loading couriers…" : "Choose courier & ship"}
              </button>
            ) : options.couriers.length === 0 ? (
              <p className="text-sm text-[#e0a19c]">
                No courier serves PIN {order.shippingPostalCode}
                {order.paymentProvider === "cod" ? " with cash on delivery" : ""}.
              </p>
            ) : (
              <>
                <p className="text-xs text-cream-400">
                  Parcel {options.weightKg} kg · {order.paymentProvider === "cod" ? "COD" : "Prepaid"} · cheapest first
                </p>
                <ul className="grid max-h-80 gap-1.5 overflow-y-auto">
                  {options.couriers.map((c) => (
                    <li key={c.id}>
                      <label
                        className={cn(
                          "flex cursor-pointer items-center gap-3 border px-3 py-2.5 text-sm transition-colors",
                          courierId === c.id ? "border-gold-400 bg-white/[0.03]" : "border-border-subtle hover:border-border-strong",
                        )}
                      >
                        <input
                          type="radio"
                          name="courier"
                          className="accent-emerald-500"
                          checked={courierId === c.id}
                          onChange={() => setCourierId(c.id)}
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block text-cream-50">
                            {c.name}
                            {c.id === options.recommendedId ? (
                              <Pill tone="success" className="ml-2 align-middle">
                                Recommended
                              </Pill>
                            ) : null}
                          </span>
                          <span className="block text-xs text-cream-400">
                            {c.etd ? `By ${c.etd}` : c.days ? `${c.days} days` : "Delivery estimate n/a"}
                            {c.rating ? ` · rated ${c.rating}` : ""}
                            {c.surface ? " · surface" : " · air"}
                          </span>
                        </span>
                        <span className="tabular-nums text-cream-100">{formatPrice(Math.round(c.rate * 100))}</span>
                      </label>
                    </li>
                  ))}
                </ul>
                <button type="button" className={PRIMARY} disabled={pending || !courier} onClick={() => setConfirming("ship")}>
                  {courier ? `Ship with ${courier.name} — ${formatPrice(Math.round(courier.rate * 100))}` : "Choose a courier"}
                </button>
              </>
            )}
            <button type="button" className={QUIET} disabled={pending} onClick={() => setConfirming("cancel")}>
              Cancel in Shiprocket
            </button>
          </div>
        ) : null}

        {/* Shipped: tracking */}
        {shipped ? (
          <div className="grid gap-4">
            <dl className="grid gap-2 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-cream-400">Courier</dt>
                <dd className="text-cream-50">{order.courierName}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-cream-400">Tracking (AWB)</dt>
                <dd>
                  <a href={order.trackingUrl} target="_blank" rel="noopener noreferrer" className="tabular-nums text-cream-50 underline underline-offset-4">
                    {order.trackingNumber}
                  </a>
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-cream-400">Status</dt>
                <dd>
                  <Pill tone={order.shipmentStatus === "DELIVERED" ? "success" : order.shipmentStatus?.startsWith("RTO") ? "danger" : "info"}>
                    {order.shipmentStatus || "Booked"}
                  </Pill>
                </dd>
              </div>
              {order.shipmentEta ? (
                <div className="flex justify-between gap-4">
                  <dt className="text-cream-400">Expected</dt>
                  <dd className="text-cream-100">{order.shipmentEta}</dd>
                </div>
              ) : null}
            </dl>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className={SECONDARY}
                disabled={pending}
                onClick={() => run(() => labelAction(order.id), (result) => window.open(result.url, "_blank", "noopener"))}
              >
                Download label
              </button>
              <button type="button" className={SECONDARY} disabled={pending} onClick={() => run(() => refreshTrackingAction(order.id), () => setNotice("Tracking updated."))}>
                Refresh tracking
              </button>
            </div>
            {Array.isArray(order.trackingActivities) && order.trackingActivities.length ? (
              <ol className="grid gap-3 border-t border-border-subtle pt-4">
                {order.trackingActivities.slice(0, 8).map((a, i) => (
                  <li key={i} className="text-sm">
                    <p className="text-cream-100">{a.activity}</p>
                    <p className="text-xs text-cream-400">
                      {a.date}
                      {a.location ? ` · ${a.location}` : ""}
                    </p>
                  </li>
                ))}
              </ol>
            ) : null}
            {!withCourier && !closed ? (
              <button type="button" className={QUIET} disabled={pending} onClick={() => setConfirming("cancel")}>
                Cancel shipment
              </button>
            ) : null}
          </div>
        ) : null}

        {/* Returns */}
        {order.status === "delivered" ? (
          <div className="grid gap-2 border-t border-border-subtle pt-4">
            {order.returnSrOrderId ? (
              <p className="text-sm text-cream-200">
                Return {order.returnStatus ? `· ${order.returnStatus}` : "booked"}
                {order.returnAwb ? ` · tracking ${order.returnAwb}` : ""}
              </p>
            ) : (
              <button type="button" className={SECONDARY} disabled={pending} onClick={() => setConfirming("return")}>
                Book a return pickup
              </button>
            )}
          </div>
        ) : null}
      </div>

      <ConfirmDialog
        open={confirming === "ship"}
        title="Ship this order?"
        message={courier ? `${courier.name} will be booked for ${formatPrice(Math.round(courier.rate * 100))}, charged to your Shiprocket wallet, with a pickup scheduled and a label made.` : ""}
        confirmLabel="Ship now"
        loading={pending}
        onConfirm={() => run(() => shipOrderAction(order.id, courierId), (result) => setNotice(`Shipped — tracking number ${result.awb}.${result.pickupNote ? ` ${result.pickupNote}` : ""}`))}
        onCancel={() => setConfirming(null)}
      />
      <ConfirmDialog
        open={confirming === "cancel"}
        title="Cancel in Shiprocket?"
        message="The Shiprocket order and any booked courier are cancelled. The order here stays as it is and can be sent to Shiprocket again."
        confirmLabel="Cancel shipment"
        destructive
        loading={pending}
        onConfirm={() => run(() => cancelShipmentAction(order.id), () => setNotice("Cancelled in Shiprocket."))}
        onCancel={() => setConfirming(null)}
      />
      <ConfirmDialog
        open={confirming === "return"}
        title="Book a return pickup?"
        message="A courier is booked to collect the parcel from the customer and bring it back to your pickup address. Charged to your Shiprocket wallet."
        confirmLabel="Book return"
        loading={pending}
        onConfirm={() => run(() => bookReturnAction(order.id), (result) => setNotice(result.note || `Return booked${result.returnAwb ? ` — tracking ${result.returnAwb}` : ""}.`))}
        onCancel={() => setConfirming(null)}
      />
    </Card>
  );
}
