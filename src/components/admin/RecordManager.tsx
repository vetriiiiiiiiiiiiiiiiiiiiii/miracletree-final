"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useFormStatus } from "react-dom";
import { Input, Textarea, Select, Checkbox, FormMessage } from "@/components/ui/Field";
import { Card, Pill } from "@/components/admin/ui";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import type { FormState } from "@/app/actions/marketing";
import { cn } from "@/lib/utils";

const INITIAL: FormState = { status: "idle" };

export type FieldSpec = {
  name: string;
  label: string;
  type: "text" | "number" | "textarea" | "select" | "checkbox" | "date";
  options?: { value: string; label: string }[];
  hint?: string;
  required?: boolean;
  rows?: number;
  placeholder?: string;
  maxLength?: number;
  /** Renders side by side with the next field on wide screens. */
  half?: boolean;
};

export type ManagedRecord = {
  id: string;
  title: string;
  subtitle?: string;
  badges?: { label: string; tone?: "neutral" | "success" | "warning" | "danger" | "info" }[];
  values: Record<string, string | number | boolean | null | undefined>;
};

/**
 * A list-plus-inline-form for the small CRUD screens: FAQs, testimonials,
 * navigation links, announcements, categories.
 *
 * These screens differ only in their fields, so they share one component rather
 * than five near-identical ones. Anything with genuinely different behaviour
 * (products, orders) gets its own screen instead of being forced through here.
 */
export function RecordManager({
  title,
  description,
  records,
  fields,
  saveAction,
  deleteAction,
  addLabel = "Add new",
  emptyMessage = "Nothing here yet.",
  deleteWarning = "This is removed permanently.",
}: {
  title: string;
  description?: string;
  records: ManagedRecord[];
  fields: FieldSpec[];
  saveAction: (prev: FormState, formData: FormData) => Promise<FormState>;
  deleteAction: (id: string) => Promise<{ ok: boolean; error?: string }>;
  addLabel?: string;
  emptyMessage?: string;
  deleteWarning?: string;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState<ManagedRecord | "new" | null>(null);
  const [deleting, setDeleting] = useState<ManagedRecord | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const remove = async (record: ManagedRecord) => {
    setDeleting(null);
    const result = await deleteAction(record.id);
    if (!result.ok) {
      setError(result.error ?? "That could not be deleted.");
      return;
    }
    startTransition(() => router.refresh());
  };

  return (
    <div className="grid gap-5">
      {error ? <FormMessage>{error}</FormMessage> : null}

      <Card
        title={title}
        description={description}
        actions={
          editing !== "new" ? (
            <button
              type="button"
              onClick={() => setEditing("new")}
              className="border border-white/20 px-4 py-2 text-[0.66rem] uppercase tracking-[0.12em] text-cream-200 transition-colors hover:border-cream-100"
            >
              {addLabel}
            </button>
          ) : null
        }
        padded={false}
      >
        {records.length === 0 ? (
          <p className="px-5 py-12 text-center text-sm text-cream-400">{emptyMessage}</p>
        ) : (
          <ul className="divide-y divide-white/8">
            {records.map((record) => (
              <li key={record.id} className="px-5 py-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm text-cream-50">{record.title}</p>
                      {record.badges?.map((badge) => (
                        <Pill key={badge.label} tone={badge.tone}>
                          {badge.label}
                        </Pill>
                      ))}
                    </div>
                    {record.subtitle ? (
                      <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-cream-400">
                        {record.subtitle}
                      </p>
                    ) : null}
                  </div>

                  <div className="flex shrink-0 gap-3">
                    <button
                      type="button"
                      onClick={() =>
                        setEditing(
                          editing !== "new" && editing?.id === record.id ? null : record,
                        )
                      }
                      className="text-xs text-cream-300 underline underline-offset-4 hover:text-cream-50"
                    >
                      {editing !== "new" && editing?.id === record.id ? "Close" : "Edit"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleting(record)}
                      className="text-xs text-cream-400 underline underline-offset-4 hover:text-danger"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {editing !== "new" && editing?.id === record.id ? (
                  <div className="mt-5 border-t border-white/10 pt-5">
                    <RecordForm
                      fields={fields}
                      record={record}
                      saveAction={saveAction}
                      onDone={() => {
                        setEditing(null);
                        startTransition(() => router.refresh());
                      }}
                      onCancel={() => setEditing(null)}
                    />
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </Card>

      {editing === "new" ? (
        <Card title={addLabel}>
          <RecordForm
            fields={fields}
            record={null}
            saveAction={saveAction}
            onDone={() => {
              setEditing(null);
              startTransition(() => router.refresh());
            }}
            onCancel={() => setEditing(null)}
          />
        </Card>
      ) : null}

      <ConfirmDialog
        open={Boolean(deleting)}
        title={`Delete “${deleting?.title}”?`}
        body={deleteWarning}
        confirmLabel="Delete"
        tone="danger"
        onCancel={() => setDeleting(null)}
        onConfirm={() => {
          if (deleting) void remove(deleting);
        }}
      />
    </div>
  );
}

function RecordForm({
  fields,
  record,
  saveAction,
  onDone,
  onCancel,
}: {
  fields: FieldSpec[];
  record: ManagedRecord | null;
  saveAction: (prev: FormState, formData: FormData) => Promise<FormState>;
  onDone: () => void;
  onCancel: () => void;
}) {
  const [state, action] = useActionState(saveAction, INITIAL);

  useEffect(() => {
    if (state.status === "success") onDone();
  }, [state, onDone]);

  const errors = state.status === "error" ? (state.errors ?? {}) : {};

  // Consecutive `half` fields are paired into a two-column row.
  const rows: FieldSpec[][] = [];
  for (const field of fields) {
    const last = rows[rows.length - 1];
    if (field.half && last?.length === 1 && last[0]!.half) last.push(field);
    else rows.push([field]);
  }

  return (
    <form action={action} className="grid gap-5">
      {record ? <input type="hidden" name="id" value={record.id} /> : null}

      {state.status === "error" ? <FormMessage>{state.message}</FormMessage> : null}

      {rows.map((row, index) => (
        <div
          key={index}
          className={cn(row.length > 1 && "grid gap-5 sm:grid-cols-2")}
        >
          {row.map((field) => {
            const value = record?.values[field.name];
            const common = {
              key: field.name,
              name: field.name,
              label: field.label,
              hint: field.hint,
              required: field.required,
              error: errors[field.name],
            };

            if (field.type === "textarea") {
              return (
                <Textarea
                  {...common}
                  rows={field.rows ?? 4}
                  maxLength={field.maxLength}
                  placeholder={field.placeholder}
                  defaultValue={value === null || value === undefined ? "" : String(value)}
                />
              );
            }

            if (field.type === "select") {
              return (
                <Select
                  {...common}
                  options={field.options ?? []}
                  defaultValue={value === null || value === undefined ? "" : String(value)}
                />
              );
            }

            if (field.type === "checkbox") {
              return (
                <Checkbox
                  key={field.name}
                  name={field.name}
                  label={field.label}
                  description={field.hint}
                  defaultChecked={Boolean(value)}
                />
              );
            }

            return (
              <Input
                {...common}
                type={field.type === "number" ? "number" : field.type === "date" ? "date" : "text"}
                maxLength={field.maxLength}
                placeholder={field.placeholder}
                defaultValue={value === null || value === undefined ? "" : String(value)}
              />
            );
          })}
        </div>
      ))}

      <div className="flex flex-wrap gap-3">
        <SaveRecord />
        <button
          type="button"
          onClick={onCancel}
          className="px-5 py-2.5 text-[0.68rem] uppercase tracking-[0.14em] text-cream-400 transition-colors hover:text-cream-100"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

function SaveRecord() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="bg-emerald-500 px-6 py-2.5 text-[0.68rem] font-medium uppercase tracking-[0.14em] text-cream-50 transition-colors hover:bg-emerald-400 disabled:opacity-60"
    >
      {pending ? "Saving…" : "Save"}
    </button>
  );
}
