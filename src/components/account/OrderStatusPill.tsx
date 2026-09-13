import { cn } from "@/lib/utils";
import { ORDER_STATUS_LABELS, type OrderStatus } from "@/lib/constants";

/** One colour vocabulary for order state, shared by the account and admin. */
const TONES: Record<OrderStatus, string> = {
  pending: "border-border-strong text-cream-300",
  confirmed: "border-emerald-400/40 text-leaf-200",
  processing: "border-emerald-400/40 text-leaf-200",
  packed: "border-gold-400/40 text-gold-300",
  shipped: "border-gold-400/40 text-gold-300",
  out_for_delivery: "border-gold-400/50 text-gold-300",
  delivered: "border-emerald-400/60 text-leaf-200",
  cancelled: "border-danger/40 text-[#e0a19c]",
  refunded: "border-danger/40 text-[#e0a19c]",
};

export function OrderStatusPill({
  status,
  className,
}: {
  status: OrderStatus;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-block border px-2.5 py-1 text-[0.6rem] uppercase tracking-[0.12em]",
        TONES[status] ?? TONES.pending,
        className,
      )}
    >
      {ORDER_STATUS_LABELS[status] ?? status}
    </span>
  );
}
