"use client";
import { useActionState, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Input, Select, FormMessage } from "@/components/ui/Field";
import { Card, Table, Td, Tr, EmptyRow } from "@/components/admin/ui";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import {
  removeProductIngredientAction,
  saveProductIngredientAction,
} from "@/app/actions/admin/products";

const INITIAL = { status: "idle" };

export function ProductIngredientEditor({
  productId,
  productIngredients,
  allIngredients,
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [error, setError] = useState(null);
  const [, startTransition] = useTransition();

  const remove = async (mapping) => {
    setDeleting(null);
    const result = await removeProductIngredientAction(mapping.id);
    if (!result.ok) {
      setError(result.error ?? "Could not remove that ingredient.");
      return;
    }
    startTransition(() => router.refresh());
  };

  return (
    <div className="grid gap-6">
      {error ? <FormMessage>{error}</FormMessage> : null}

      <Card
        title="Ingredients"
        description="Map base ingredients to this product and optionally specify amounts (e.g., '500mg')."
        actions={
          <button
            type="button"
            onClick={() => setEditing("new")}
            className="border border-border-strong px-4 py-2 text-[0.66rem] uppercase tracking-[0.12em] text-cream-200 transition-colors hover:border-cream-100"
          >
            Add ingredient
          </button>
        }
        padded={false}
      >
        <Table
          head={[
            "Ingredient",
            "Amount",
            { label: "", align: "right", width: "8rem" },
          ]}
        >
          {productIngredients.length === 0 ? (
            <EmptyRow colSpan={3}>No ingredients mapped yet.</EmptyRow>
          ) : (
            productIngredients.map((mapping) => (
              <Tr key={mapping.id}>
                <Td className="text-cream-50 font-medium">
                  {mapping.ingredient.name}
                </Td>
                <Td className="text-xs text-cream-400">
                  {mapping.amount || "—"}
                </Td>
                <Td align="right">
                  <div className="flex justify-end gap-3 text-xs">
                    <button
                      type="button"
                      onClick={() => setEditing(mapping)}
                      className="text-gold-300 hover:text-gold-200"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleting(mapping)}
                      className="text-[#e0a19c] hover:text-[#f4b8b4]"
                    >
                      Remove
                    </button>
                  </div>
                </Td>
              </Tr>
            ))
          )}
        </Table>
      </Card>

      {editing ? (
        <IngredientModal
          productId={productId}
          mapping={editing === "new" ? null : editing}
          allIngredients={allIngredients}
          onClose={() => setEditing(null)}
        />
      ) : null}

      {deleting ? (
        <ConfirmDialog
          title="Remove ingredient"
          message={`Are you sure you want to remove "${deleting.ingredient.name}" from this product?`}
          onConfirm={() => remove(deleting)}
          onCancel={() => setDeleting(null)}
          actionLabel="Remove"
          destructive
        />
      ) : null}
    </div>
  );
}

function IngredientModal({ productId, mapping, allIngredients, onClose }) {
  const [state, action, pending] = useActionState(
    saveProductIngredientAction,
    INITIAL,
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-ink-950/80 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-lg bg-ink shadow-2xl">
        <form
          action={async (formData) => {
            formData.set("productId", productId);
            if (mapping) formData.set("id", mapping.id);
            await action(formData);
            if (state.status !== "error") onClose();
          }}
          className="grid gap-6 p-6"
        >
          <div>
            <h2 className="text-xl text-cream-50">
              {mapping ? "Edit ingredient mapping" : "Add ingredient"}
            </h2>
            {state.status === "error" ? (
              <div className="mt-4">
                <FormMessage>{state.message}</FormMessage>
              </div>
            ) : null}
          </div>

          <Select
            label="Base Ingredient"
            name="ingredientId"
            defaultValue={mapping?.ingredientId ?? ""}
            options={[
              { value: "", label: "Select an ingredient..." },
              ...allIngredients.map((ing) => ({
                value: ing.id,
                label: ing.name,
              })),
            ]}
            hint="Manage base ingredients in Content > Ingredients."
          />
          <Input
            label="Amount (Optional)"
            name="amount"
            defaultValue={mapping?.amount ?? ""}
            hint="e.g., '500mg' or '1 tsp'"
          />

          <div className="flex justify-end gap-4 border-t border-border-subtle pt-6">
            <button
              type="button"
              onClick={onClose}
              disabled={pending}
              className="text-sm text-cream-400 hover:text-cream-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={pending}
              className="bg-emerald-500 px-5 py-2.5 text-[0.7rem] uppercase tracking-[0.14em] text-on-accent transition-colors hover:bg-emerald-400 disabled:opacity-60"
            >
              {pending ? "Saving…" : "Save mapping"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
