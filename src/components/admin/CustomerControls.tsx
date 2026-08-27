"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/admin/ui";
import { Textarea, Select, FormMessage } from "@/components/ui/Field";
import { addCustomerNoteAction, setUserRoleAction } from "@/app/actions/admin/content";

type Role = "customer" | "staff" | "admin";

/**
 * Role changes and internal notes.
 *
 * Role editing is only offered to full admins, and never for their own account —
 * both rules are enforced again on the server, since the UI is only a hint.
 */
export function CustomerControls({
  userId,
  role,
  canChangeRole,
  notes,
}: {
  userId: string;
  role: Role;
  canChangeRole: boolean;
  notes: { id: string; body: string; createdAt: string }[];
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const changeRole = async (next: Role) => {
    if (next === role) return;
    setBusy(true);
    setError(null);
    setMessage(null);

    const result = await setUserRoleAction({ userId, role: next });
    setBusy(false);

    if (!result.ok) {
      setError(result.error ?? "Could not change that role.");
      return;
    }
    setMessage(`Role changed to ${next}.`);
    startTransition(() => router.refresh());
  };

  const saveNote = async () => {
    if (!note.trim()) return;
    setBusy(true);
    await addCustomerNoteAction(userId, note);
    setBusy(false);
    setNote("");
    startTransition(() => router.refresh());
  };

  return (
    <>
      <Card title="Access">
        <div className="grid gap-4">
          {error ? <FormMessage>{error}</FormMessage> : null}
          {message ? <FormMessage tone="success">{message}</FormMessage> : null}

          {canChangeRole ? (
            <Select
              label="Role"
              value={role}
              disabled={busy}
              onChange={(event) => void changeRole(event.target.value as Role)}
              options={[
                { value: "customer", label: "Customer — storefront only" },
                { value: "staff", label: "Staff — admin, no destructive actions" },
                { value: "admin", label: "Admin — full access" },
              ]}
              hint="Staff can manage orders, stock and content but cannot delete products or change roles."
            />
          ) : (
            <div>
              <p className="eyebrow text-cream-400">Role</p>
              <p className="mt-2 text-sm capitalize text-cream-100">{role}</p>
              <p className="mt-2 text-xs text-cream-400">
                Only a full administrator can change roles, and never their own.
              </p>
            </div>
          )}
        </div>
      </Card>

      <Card title="Internal notes" description="Only visible to you and your team.">
        <div className="grid gap-4">
          <Textarea
            label="Add a note"
            value={note}
            onChange={(event) => setNote(event.target.value)}
            rows={3}
            maxLength={1000}
            placeholder="Delivery preferences, a support conversation, anything worth remembering."
          />
          <button
            type="button"
            onClick={() => void saveNote()}
            disabled={busy || !note.trim()}
            className="justify-self-start border border-white/20 px-5 py-2.5 text-[0.68rem] uppercase tracking-[0.14em] text-cream-200 transition-colors hover:border-cream-100 disabled:opacity-40"
          >
            {busy ? "Saving…" : "Add note"}
          </button>

          {notes.length ? (
            <ul className="mt-2 grid gap-4 border-t border-white/10 pt-5">
              {notes.map((entry) => (
                <li key={entry.id}>
                  <p className="whitespace-pre-line text-sm leading-relaxed text-cream-300">
                    {entry.body}
                  </p>
                  <p className="mt-1.5 text-xs text-cream-400">{entry.createdAt}</p>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </Card>
    </>
  );
}
