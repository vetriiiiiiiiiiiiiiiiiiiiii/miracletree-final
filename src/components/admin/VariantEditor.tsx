"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useFormStatus } from "react-dom";
import { Input, Checkbox, FormMessage } from "@/components/ui/Field";
import { Card, Pill, Table, Td, Tr, EmptyRow } from "@/components/admin/ui";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { deleteVariantAction, saveVariantAction } from "@/app/actions/admin/products";
import type { FormState } from "@/app/actions/marketing";
import { formatPrice } from "@/lib/money";

const INITIAL: FormState = { status: "idle" };

export type EditableVariant = {
  id: string;
  name: string;
  sku: string | null;
  price: number;
  compareAtPrice: number | null;
  weightGrams: number | null;
  imageUrl: string | null;
  isActive: boolean;
  onHand: number;
  reserved: number;
  lowStockAt: number;
};

/**
 * Variants and their stock thresholds. Quantity itself is changed on the
 * inventory screen, which records a ledger entry — editing it inline here would
 * let stock move without a reason attached to it.
 */
export function VariantEditor({
  productId,
  variants,
}: {
  productId: string;
  variants: EditableVariant[];
}) {
  const router = useRouter();
  const [editing, setEditing] = useState<EditableVariant | "new" | null>(null);
  const [deleting, setDeleting] = useState<EditableVariant | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const remove = async (variant: EditableVariant) => {
    setDeleting(null);
    const result = await deleteVariantAction(variant.id);
    if (!result.ok) {
      setError(result.error ?? "Could not remove that variant.");
      return;
    }
    startTransition(() => router.refresh());
  };

  return (
    <div className="grid gap-6">
      {error ? <FormMessage>{error}</FormMessage> : null}

      <Card
        title="Variants"
        description="Every product needs at least one. Sizes, pack counts or flavours all live here."
        actions={
          <button
            type="button"
            onClick={() => setEditing("new")}
            className="border border-white/20 px-4 py-2 text-[0.66rem] uppercase tracking-[0.12em] text-cream-200 transition-colors hover:border-cream-100"
          >
            Add variant
          </button>
        }
        padded={false}
      >
        <Table
          head={[
            "Variant",
            "SKU",
            { label: "Price", align: "right" },
            { label: "On hand", align: "right" },
            { label: "Available", align: "right" },
            { label: "Status", align: "center" },
            { label: "", align: "right", width: "8rem" },
          ]}
        >
          {variants.length === 0 ? (
            <EmptyRow colSpan={7}>No variants yet.</EmptyRow>
          ) : (
            variants.map((variant) => {
              const available = Math.max(0, variant.onHand - variant.reserved);
              return (
                <Tr key={variant.id}>
                  <Td className="text-cream-50">{variant.name}</Td>
                  <Td className="text-xs text-cream-400">{variant.sku ?? "—"}</Td>
                  <Td align="right" className="tabular-nums">
                    {formatPrice(variant.price)}
                    {variant.compareAtPrice ? (
                      <span className="ml-2 text-xs text-cream-400 line-through">
                        {formatPrice(variant.compareAtPrice)}
                      </span>
                    ) : null}
                  </Td>
                  <Td align="right" className="tabular-nums">
                    {variant.onHand}
                  </Td>
                  <Td align="right">
                    <Pill
                      tone={
                        available <= 0
                          ? "danger"
                          : available <= variant.lowStockAt
                            ? "warning"
                            : "success"
                      }
                    >
                      {available}
                    </Pill>
                  </Td>
                  <Td align="center">
                    <Pill tone={variant.isActive ? "success" : "neutral"}>
                      {variant.isActive ? "Active" : "Hidden"}
                    </Pill>
                  </Td>
                  <Td align="right">
                    <div className="flex justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => setEditing(variant)}
                        className="text-xs text-cream-300 underline underline-offset-4 hover:text-cream-50"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleting(variant)}
                        className="text-xs text-cream-400 underline underline-offset-4 hover:text-danger"
                      >
                        Remove
                      </button>
                    </div>
                  </Td>
                </Tr>
              );
            })
          )}
        </Table>
      </Card>

      {editing ? (
        <VariantForm
          productId={productId}
          variant={editing === "new" ? null : editing}
          onDone={() => {
            setEditing(null);
            startTransition(() => router.refresh());
          }}
          onCancel={() => setEditing(null)}
        />
      ) : null}

      <ConfirmDialog
        open={Boolean(deleting)}
        title={`Remove “${deleting?.name}”?`}
        body="If this variant has never been ordered it is deleted outright. If it appears in past orders it is hidden instead, so your order history stays intact."
        confirmLabel="Remove variant"
        tone="danger"
        onCancel={() => setDeleting(null)}
        onConfirm={() => {
          if (deleting) void remove(deleting);
        }}
      />
    </div>
  );
}

function VariantForm({
  productId,
  variant,
  onDone,
  onCancel,
}: {
  productId: string;
  variant: EditableVariant | null;
  onDone: () => void;
  onCancel: () => void;
}) {
  const [state, action] = useActionState(saveVariantAction, INITIAL);

  useEffect(() => {
    if (state.status === "success") onDone();
  }, [state, onDone]);

  const errors = state.status === "error" ? (state.errors ?? {}) : {};

  return (
    <Card title={variant ? `Edit “${variant.name}”` : "New variant"}>
      <form action={action} className="grid gap-5">
        <input type="hidden" name="productId" value={productId} />
        {variant ? <input type="hidden" name="variantId" value={variant.id} /> : null}

        {state.status === "error" ? <FormMessage>{state.message}</FormMessage> : null}

        <div className="grid gap-5 sm:grid-cols-2">
          <Input
            label="Variant name"
            name="name"
            required
            placeholder="100 Grams"
            defaultValue={variant?.name}
            error={errors.name}
          />
          <Input label="SKU" name="sku" defaultValue={variant?.sku ?? ""} />
        </div>

        <div className="grid gap-5 sm:grid-cols-3">
          <Input
            label="Price (₹)"
            name="price"
            type="number"
            min={0}
            step="0.01"
            required
            defaultValue={variant ? variant.price / 100 : ""}
            error={errors.price}
          />
          <Input
            label="Compare-at (₹)"
            name="compareAtPrice"
            type="number"
            min={0}
            step="0.01"
            defaultValue={variant?.compareAtPrice ? variant.compareAtPrice / 100 : ""}
          />
          <Input
            label="Weight (g)"
            name="weightGrams"
            type="number"
            min={0}
            defaultValue={variant?.weightGrams ?? ""}
          />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <Input
            label={variant ? "On hand (read-only)" : "Opening stock"}
            name="onHand"
            type="number"
            min={0}
            defaultValue={variant?.onHand ?? 0}
            readOnly={Boolean(variant)}
            disabled={Boolean(variant)}
            hint={
              variant
                ? "Change stock from the Inventory screen so the movement is recorded."
                : "Recorded as an opening-stock movement."
            }
          />
          <Input
            label="Low-stock threshold"
            name="lowStockAt"
            type="number"
            min={0}
            defaultValue={variant?.lowStockAt ?? 10}
            hint="Flags this variant on the dashboard."
          />
        </div>

        <Input
          label="Variant image URL"
          name="imageUrl"
          defaultValue={variant?.imageUrl ?? ""}
          hint="Optional. Shown when this variant is selected."
        />

        <Checkbox
          name="isActive"
          defaultChecked={variant?.isActive ?? true}
          label="Available to buy"
          description="Uncheck to hide this variant without deleting it."
        />

        <div className="flex flex-wrap gap-3">
          <SaveVariant />
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-2.5 text-[0.68rem] uppercase tracking-[0.14em] text-cream-400 transition-colors hover:text-cream-100"
          >
            Cancel
          </button>
        </div>
      </form>
    </Card>
  );
}

function SaveVariant() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="bg-emerald-500 px-6 py-2.5 text-[0.68rem] font-medium uppercase tracking-[0.14em] text-cream-50 transition-colors hover:bg-emerald-400 disabled:opacity-60"
    >
      {pending ? "Saving…" : "Save variant"}
    </button>
  );
}
