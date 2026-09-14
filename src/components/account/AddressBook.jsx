"use client";
import { useActionState, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useFormStatus } from "react-dom";
import { Input, Checkbox, FormMessage } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { deleteAddressAction, saveAddressAction } from "@/app/actions/addresses";
import { cn } from "@/lib/utils";
const INITIAL = { status: "idle" };
export function AddressBook({ addresses }) {
  const router = useRouter();
  const [editing, setEditing] = useState(addresses.length ? null : "new");
  const [, startTransition] = useTransition();
  const [removing, setRemoving] = useState(null);
  const remove = async (id) => {
    setRemoving(id);
    await deleteAddressAction(id);
    setRemoving(null);
    startTransition(() => router.refresh());
  };
  return (
    <div className="mt-10 grid gap-6">
      {addresses.map((address) => (
        <article
          key={address.id}
          className={cn(
            "border p-6",
            address.isDefault ? "border-gold-400/40" : "border-border-subtle",
          )}
        >
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-cream-50">
                {address.firstName} {address.lastName}
                {address.label ? (
                  <span className="ml-3 text-xs text-cream-400">{address.label}</span>
                ) : null}
              </p>
              <address className="mt-2 not-italic text-sm leading-relaxed text-cream-400">
                {address.line1}
                {address.line2 ? `, ${address.line2}` : ""}
                <br />
                {address.city}, {address.state} {address.postalCode}
                <br />
                {address.country} · {address.phone}
              </address>
            </div>

            {address.isDefault ? (
              <span className="border border-gold-400/40 px-2.5 py-1 text-[0.6rem] uppercase tracking-[0.12em] text-gold-300">
                Default
              </span>
            ) : null}
          </div>

          <div className="mt-5 flex gap-4">
            <button
              type="button"
              onClick={() => setEditing(address)}
              className="text-xs text-cream-300 underline underline-offset-4 hover:text-cream-50"
            >
              Edit
            </button>
            <button
              type="button"
              onClick={() => void remove(address.id)}
              disabled={removing === address.id}
              className="text-xs text-cream-400 underline underline-offset-4 hover:text-danger disabled:opacity-50"
            >
              {removing === address.id ? "Removing…" : "Remove"}
            </button>
          </div>
        </article>
      ))}

      {editing ? (
        <AddressForm
          address={editing === "new" ? null : editing}
          onDone={() => {
            setEditing(null);
            startTransition(() => router.refresh());
          }}
          onCancel={() => setEditing(null)}
        />
      ) : (
        <Button
          variant="secondary"
          size="md"
          className="justify-self-start"
          onClick={() => setEditing("new")}
        >
          Add an address
        </Button>
      )}
    </div>
  );
}
function AddressForm({ address, onDone, onCancel }) {
  const [state, action] = useActionState(saveAddressAction, INITIAL);
  useEffect(() => {
    if (state.status === "success") onDone();
  }, [state, onDone]);
  const errors = state.status === "error" ? (state.errors ?? {}) : {};
  return (
    <form action={action} className="grid gap-5 border border-border-subtle p-6 md:p-8">
      {address ? <input type="hidden" name="id" value={address.id} /> : null}

      <h3 className="text-[1.15rem] text-cream-50">
        {address ? "Edit address" : "New address"}
      </h3>

      {state.status === "error" ? <FormMessage>{state.message}</FormMessage> : null}

      <div className="grid gap-5 sm:grid-cols-2">
        <Input
          label="First name"
          name="firstName"
          required
          autoComplete="given-name"
          defaultValue={address?.firstName}
          error={errors.firstName}
        />
        <Input
          label="Last name"
          name="lastName"
          autoComplete="family-name"
          defaultValue={address?.lastName ?? ""}
        />
      </div>

      <Input
        label="Address"
        name="line1"
        required
        autoComplete="address-line1"
        defaultValue={address?.line1}
        error={errors.line1}
      />
      <Input
        label="Apartment, landmark (optional)"
        name="line2"
        autoComplete="address-line2"
        defaultValue={address?.line2 ?? ""}
      />

      <div className="grid gap-5 sm:grid-cols-3">
        <Input
          label="City"
          name="city"
          required
          autoComplete="address-level2"
          defaultValue={address?.city}
          error={errors.city}
        />
        <Input
          label="State"
          name="state"
          required
          autoComplete="address-level1"
          defaultValue={address?.state}
          error={errors.state}
        />
        <Input
          label="PIN code"
          name="postalCode"
          required
          inputMode="numeric"
          maxLength={6}
          autoComplete="postal-code"
          defaultValue={address?.postalCode}
          error={errors.postalCode}
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Input
          label="Mobile"
          name="phone"
          type="tel"
          required
          inputMode="numeric"
          autoComplete="tel"
          defaultValue={address?.phone}
          error={errors.phone}
        />
        <Input
          label="Label (optional)"
          name="label"
          placeholder="Home, Office"
          defaultValue={address?.label ?? ""}
        />
      </div>

      <input type="hidden" name="country" value={address?.country ?? "India"} />

      <Checkbox
        name="isDefault"
        defaultChecked={address?.isDefault}
        label="Use as my default delivery address"
      />

      <div className="flex flex-wrap gap-3">
        <SaveAddress />
        <Button type="button" variant="ghost" size="md" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
function SaveAddress() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="md" loading={pending}>
      Save address
    </Button>
  );
}
