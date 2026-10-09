"use client";
import { useActionState, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Input, Textarea, FormMessage } from "@/components/ui/Field";
import { Card, Table, Td, Tr, EmptyRow } from "@/components/admin/ui";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import {
  deleteUsageStepAction,
  saveUsageStepAction,
} from "@/app/actions/admin/products";

const INITIAL = { status: "idle" };

export function UsageStepEditor({ productId, steps }) {
  const router = useRouter();
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [error, setError] = useState(null);
  const [, startTransition] = useTransition();

  const remove = async (step) => {
    setDeleting(null);
    const result = await deleteUsageStepAction(step.id);
    if (!result.ok) {
      setError(result.error ?? "Could not remove that step.");
      return;
    }
    startTransition(() => router.refresh());
  };

  return (
    <div className="grid gap-6">
      {error ? <FormMessage>{error}</FormMessage> : null}

      <Card
        title="Usage Steps"
        description="The 'Three steps' section showing how to use the product."
        actions={
          <button
            type="button"
            onClick={() => setEditing("new")}
            className="border border-border-strong px-4 py-2 text-[0.66rem] uppercase tracking-[0.12em] text-cream-200 transition-colors hover:border-cream-100"
          >
            Add step
          </button>
        }
        padded={false}
      >
        <Table
          head={[
            { label: "Step", width: "4rem" },
            "Title",
            "Body",
            { label: "", align: "right", width: "8rem" },
          ]}
        >
          {steps.length === 0 ? (
            <EmptyRow colSpan={4}>No steps yet.</EmptyRow>
          ) : (
            steps.map((step) => (
              <Tr key={step.id}>
                <Td className="text-cream-400 font-medium">0{step.step}</Td>
                <Td className="text-cream-50 font-medium">{step.title}</Td>
                <Td className="text-xs text-cream-400 max-w-sm truncate">
                  {step.body || "—"}
                </Td>
                <Td align="right">
                  <div className="flex justify-end gap-3 text-xs">
                    <button
                      type="button"
                      onClick={() => setEditing(step)}
                      className="text-gold-300 hover:text-gold-200"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleting(step)}
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
        <UsageStepModal
          productId={productId}
          step={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
        />
      ) : null}

      {deleting ? (
        <ConfirmDialog
          title="Delete step"
          message={`Are you sure you want to remove step 0${deleting.step}: "${deleting.title}"?`}
          onConfirm={() => remove(deleting)}
          onCancel={() => setDeleting(null)}
          actionLabel="Delete step"
          destructive
        />
      ) : null}
    </div>
  );
}

function UsageStepModal({ productId, step, onClose }) {
  const [state, action, pending] = useActionState(saveUsageStepAction, INITIAL);

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
            if (step) formData.set("id", step.id);
            await action(formData);
            if (state.status !== "error") onClose();
          }}
          className="grid gap-6 p-6"
        >
          <div>
            <h2 className="text-xl text-cream-50">
              {step ? "Edit step" : "New step"}
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
            defaultValue={step?.title ?? ""}
          />
          <Textarea
            label="Description"
            name="body"
            rows={3}
            defaultValue={step?.body ?? ""}
            hint="Optional. Keep it brief."
          />
          <Input
            label="Image URL"
            name="imageUrl"
            defaultValue={step?.imageUrl ?? ""}
            hint="Optional."
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
              {pending ? "Saving…" : "Save step"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
