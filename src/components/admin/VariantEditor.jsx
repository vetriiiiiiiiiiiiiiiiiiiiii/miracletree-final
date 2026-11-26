"use client";
import { startTransition, useActionState, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Input, Checkbox, FormMessage } from "@/components/ui/Field";
import { Card, Pill, Table, Td, Tr, EmptyRow } from "@/components/admin/ui";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import {
  deleteVariantAction,
  saveVariantAction,
} from "@/app/actions/admin/products";
import { formatPrice } from "@/lib/money";
const INITIAL = { status: "idle" };
/**
 * A product's variants: name, SKU, price and visibility. Stock is not
 * tracked, so every active variant is always available.
 */
export function VariantEditor({ productId, variants }) {
  const router = useRouter();
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [error, setError] = useState(null);
  const [, startTransition] = useTransition();
  const remove = async (variant) => {
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
            className="border border-border-strong px-4 py-2 text-[0.66rem] uppercase tracking-[0.12em] text-cream-200 transition-colors hover:border-cream-100"
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
            { label: "Status", align: "center" },
            { label: "", align: "right", width: "8rem" },
          ]}
        >
          {variants.length === 0 ? (
            <EmptyRow colSpan={5}>No variants yet.</EmptyRow>
          ) : (
            variants.map((variant) => {
              return (
                <Tr key={variant.id}>
                  <Td className="text-cream-50">{variant.name}</Td>
                  <Td className="text-xs text-cream-400">
                    {variant.sku ?? "—"}
                  </Td>
                  <Td align="right" className="tabular-nums">
                    {formatPrice(variant.price)}
                    {variant.compareAtPrice ? (
                      <span className="ml-2 text-xs text-cream-400 line-through">
                        {formatPrice(variant.compareAtPrice)}
                      </span>
                    ) : null}
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
/**
 * The variant form is drawn inside the product editor's own <form>, and a
 * form cannot contain another: the browser drops the inner one, so "Save
 * variant" submitted the product instead and the pack's new price was never
 * saved. This collects its own fields and calls the action directly.
 */
function VariantForm({ productId, variant, onDone, onCancel }) {
  const [state, action, pending] = useActionState(saveVariantAction, INITIAL);
  const fieldsRef = useRef(null);
  const submit = () => {
    const data = new FormData();
    fieldsRef.current
      ?.querySelectorAll("input[name], select[name], textarea[name]")
      .forEach((el) => {
        if (el.type === "checkbox") {
          if (el.checked) data.append(el.name, "on");
        } else {
          data.append(el.name, el.value);
        }
      });
    startTransition(() => action(data));
  };
  useEffect(() => {
    if (state.status === "success") onDone();
  }, [state, onDone]);
  const errors = state.status === "error" ? (state.errors ?? {}) : {};
  return (
    <Card title={variant ? `Edit “${variant.name}”` : "New variant"}>
      <div
        ref={fieldsRef}
        className="grid gap-5"
        onKeyDown={(event) => {
          // Enter would otherwise submit the product form around this one.
          if (event.key === "Enter" && event.target.tagName === "INPUT") {
            event.preventDefault();
            submit();
          }
        }}
      >
        <input type="hidden" name="productId" value={productId} />
        {variant ? (
          <input type="hidden" name="variantId" value={variant.id} />
        ) : null}

        {state.status === "error" ? (
          <FormMessage>{state.message}</FormMessage>
        ) : null}

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
            defaultValue={
              variant?.compareAtPrice ? variant.compareAtPrice / 100 : ""
            }
          />
          <Input
            label="Weight (g)"
            name="weightGrams"
            type="number"
            min={0}
            defaultValue={variant?.weightGrams ?? ""}
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
          <button
            type="button"
            onClick={submit}
            disabled={pending}
            className="bg-emerald-500 px-6 py-2.5 text-[0.68rem] font-medium uppercase tracking-[0.14em] text-on-accent transition-colors hover:bg-emerald-400 disabled:opacity-60"
          >
            {pending ? "Saving…" : "Save variant"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-2.5 text-[0.68rem] uppercase tracking-[0.14em] text-cream-400 transition-colors hover:text-cream-100"
          >
            Cancel
          </button>
        </div>
      </div>
    </Card>
  );
}
