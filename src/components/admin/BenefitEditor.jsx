"use client";
import { useActionState, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Input, Textarea, FormMessage } from "@/components/ui/Field";
import { Card, Table, Td, Tr, EmptyRow } from "@/components/admin/ui";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import {
  deleteProductBenefitAction,
  saveProductBenefitAction,
} from "@/app/actions/admin/products";

const INITIAL = { status: "idle" };

export function BenefitEditor({ productId, benefits }) {
  const router = useRouter();
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [error, setError] = useState(null);
  const [, startTransition] = useTransition();

  const remove = async (benefit) => {
    setDeleting(null);
    const result = await deleteProductBenefitAction(benefit.id);
    if (!result.ok) {
      setError(result.error ?? "Could not remove that benefit.");
      return;
    }
    startTransition(() => router.refresh());
  };

  return (
    <div className="grid gap-6">
      {error ? <FormMessage>{error}</FormMessage> : null}

      <Card
        title="Benefits"
        description="The 'In the brand's own words' section. Briefly highlight the key advantages of this product."
        actions={
          <button
            type="button"
            onClick={() => setEditing("new")}
            className="border border-border-strong px-4 py-2 text-[0.66rem] uppercase tracking-[0.12em] text-cream-200 transition-colors hover:border-cream-100"
          >
            Add benefit
          </button>
        }
        padded={false}
      >
        <Table
          head={["Title", "Body", { label: "", align: "right", width: "8rem" }]}
        >
          {benefits.length === 0 ? (
            <EmptyRow colSpan={3}>No benefits yet.</EmptyRow>
          ) : (
            benefits.map((benefit) => (
              <Tr key={benefit.id}>
                <Td className="text-cream-50 font-medium">{benefit.title}</Td>
                <Td className="text-xs text-cream-400 max-w-sm truncate">
                  {benefit.body || "—"}
                </Td>
                <Td align="right">
                  <div className="flex justify-end gap-3 text-xs">
                    <button
                      type="button"
                      onClick={() => setEditing(benefit)}
                      className="text-gold-300 hover:text-gold-200"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleting(benefit)}
                      className="text-[#e0a19c] hover:text-[#f4b8b4]"
                    >
                      Delete
                    </button>
                  </div>
                </Td>
              </Tr>
            ))
          )}
        </Table>
      </Card>

      {editing ? (
        <BenefitModal
          productId={productId}
          benefit={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
        />
      ) : null}

      {deleting ? (
        <ConfirmDialog
          title="Delete benefit"
          message={`Are you sure you want to remove "${deleting.title}"?`}
          onConfirm={() => remove(deleting)}
          onCancel={() => setDeleting(null)}
          actionLabel="Delete benefit"
          destructive
        />
      ) : null}
    </div>
  );
}

function BenefitModal({ productId, benefit, onClose }) {
  const [state, action, pending] = useActionState(
    saveProductBenefitAction,
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
            if (benefit) formData.set("id", benefit.id);
            await action(formData);
            if (state.status !== "error") onClose();
          }}
          className="grid gap-6 p-6"
        >
          <div>
            <h2 className="text-xl text-cream-50">
              {benefit ? "Edit benefit" : "New benefit"}
            </h2>
            {state.status === "error" ? (
              <div className="mt-4">
                <FormMessage>{state.message}</FormMessage>
              </div>
            ) : null}
          </div>

          <Input
            label="Title"
            name="title"
            required
            defaultValue={benefit?.title ?? ""}
          />
          <Textarea
            label="Description"
            name="body"
            rows={3}
            defaultValue={benefit?.body ?? ""}
            hint="Optional. Keep it brief."
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
              {pending ? "Saving…" : "Save benefit"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
