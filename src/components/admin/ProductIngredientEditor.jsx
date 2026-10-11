"use client";
import { useActionState, useEffect, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Input, Select, FormMessage } from "@/components/ui/Field";
import { Card, Table, Td, Tr, EmptyRow } from "@/components/admin/ui";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import SearchableSelect from "@/components/ui/SearchableSelect";
import {
  removeProductIngredientAction,
  saveProductIngredientAction,
  createIngredientInlineAction,
  deleteIngredientInlineAction,
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
  const [ingredientList, setIngredientList] = useState(allIngredients || []);
  const [, startTransition] = useTransition();

  useEffect(() => {
    setIngredientList(allIngredients || []);
  }, [allIngredients]);

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
          ingredientList={ingredientList}
          setIngredientList={setIngredientList}
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

function IngredientModal({
  productId,
  mapping,
  ingredientList,
  setIngredientList,
  onClose,
}) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [ingredientId, setIngredientId] = useState(mapping?.ingredientId ?? "");
  const [amount, setAmount] = useState(mapping?.amount ?? "");
  const [error, setError] = useState(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleAddNewIngredient = async (name) => {
    const res = await createIngredientInlineAction(name);
    if (res?.success && res.data) {
      setIngredientList((prev) => {
        if (prev.some((i) => i.id === res.data.id)) return prev;
        return [...prev, res.data];
      });
    }
    return res;
  };

  const handleDeleteIngredient = async (item) => {
    const res = await deleteIngredientInlineAction(item.id);
    if (res?.success) {
      setIngredientList((prev) => prev.filter((i) => i.id !== item.id));
      if (ingredientId === item.id) {
        setIngredientId("");
      }
      return { success: true };
    }
    return { success: false, error: res?.error || "Failed to delete ingredient" };
  };

  const handleSave = async (e) => {
    if (e?.preventDefault) e.preventDefault();
    if (!ingredientId) {
      setError("Ingredient is required.");
      return;
    }
    setPending(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.set("productId", productId);
      if (mapping) formData.set("id", mapping.id);
      formData.set("ingredientId", ingredientId);
      formData.set("amount", amount);

      const res = await saveProductIngredientAction(null, formData);
      if (res?.status === "error") {
        setError(res.message);
        setPending(false);
      } else {
        onClose();
        router.refresh();
      }
    } catch (err) {
      setError(err.message || "Failed to save mapping");
      setPending(false);
    }
  };

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-ink-950/80 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className="relative w-full max-w-lg bg-ink shadow-2xl"
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey && e.target.tagName !== "TEXTAREA") {
            e.preventDefault();
            handleSave(e);
          }
        }}
      >
        <div className="grid gap-6 p-6">
          <div>
            <h2 className="text-xl text-cream-50">
              {mapping ? "Edit ingredient mapping" : "Add ingredient"}
            </h2>
            {error ? (
              <div className="mt-4">
                <FormMessage>{error}</FormMessage>
              </div>
            ) : null}
          </div>

          <SearchableSelect
            label="Base Ingredient"
            value={ingredientId}
            onChange={(val) => {
              setIngredientId(val);
              if (error) setError(null);
            }}
            valueKey="id"
            displayKey="name"
            placeholder="Select an ingredient..."
            options={[
              { id: "", name: "Unspecified", canDelete: false },
              ...ingredientList,
            ]}
            fetchFn={async (search) => {
              const list = [
                { id: "", name: "Unspecified", canDelete: false },
                ...ingredientList,
              ];
              const filtered = list.filter((ing) =>
                ing.name.toLowerCase().includes(search.toLowerCase()),
              );
              return {
                success: true,
                data: filtered,
                pagination: { hasMore: false },
              };
            }}
            onAddNew={handleAddNewIngredient}
            onDelete={handleDeleteIngredient}
            deleteConfirmTitle={(item) => `Delete “${item.name}”?`}
            deleteConfirmBody={(item) =>
              `Are you sure you want to delete ingredient “${item.name}”? It will be removed from all products using it. This action cannot be undone.`
            }
            hint="Manage base ingredients in Content > Ingredients."
          />

          <Input
            label="Amount (Optional)"
            name="amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
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
              type="button"
              onClick={handleSave}
              disabled={pending}
              className="bg-emerald-500 px-5 py-2.5 text-[0.7rem] uppercase tracking-[0.14em] text-on-accent transition-colors hover:bg-emerald-400 disabled:opacity-60"
            >
              {pending ? "Saving…" : "Save mapping"}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
