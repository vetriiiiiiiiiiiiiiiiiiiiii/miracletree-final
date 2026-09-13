"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Input, Checkbox, FormMessage } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { logoutAction, updateProfileAction, type AuthState } from "@/app/actions/auth";

const INITIAL: AuthState = { status: "idle" };

export function ProfileForm({
  defaults,
}: {
  defaults: {
    firstName: string;
    lastName: string;
    phone: string;
    marketingOptIn: boolean;
    email: string;
  };
}) {
  const [state, action] = useActionState(updateProfileAction, INITIAL);

  return (
    <>
      <form action={action} className="grid gap-6">
        {state.status === "success" ? (
          <FormMessage tone="success">{state.message}</FormMessage>
        ) : null}
        {state.status === "error" ? <FormMessage>{state.message}</FormMessage> : null}

        <div className="grid gap-5 sm:grid-cols-2">
          <Input
            label="First name"
            name="firstName"
            autoComplete="given-name"
            required
            defaultValue={defaults.firstName}
            error={state.status === "error" ? state.errors?.firstName : undefined}
          />
          <Input
            label="Last name"
            name="lastName"
            autoComplete="family-name"
            defaultValue={defaults.lastName}
          />
        </div>

        <Input
          label="Mobile"
          name="phone"
          type="tel"
          inputMode="numeric"
          autoComplete="tel"
          defaultValue={defaults.phone}
          hint="Used for delivery updates only."
          error={state.status === "error" ? state.errors?.phone : undefined}
        />

        <Input
          label="Email"
          value={defaults.email}
          readOnly
          disabled
          hint="Contact us if you need to change the email on your account."
        />

        <Checkbox
          name="marketingOptIn"
          defaultChecked={defaults.marketingOptIn}
          label="Send me the journal"
          description="Harvest notes and the occasional recipe. Roughly monthly."
        />

        <Save />
      </form>

      <div className="mt-14 border-t border-border-subtle pt-8">
        <h3 className="text-[1.05rem] text-cream-100">Signed in on this device</h3>
        <p className="mt-2 text-sm text-cream-400">
          Signing out clears your session. Your bag is kept.
        </p>
        <form action={logoutAction} className="mt-5">
          <Button type="submit" variant="secondary" size="md">
            Sign out
          </Button>
        </form>
      </div>
    </>
  );
}

function Save() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" className="justify-self-start" loading={pending}>
      Save changes
    </Button>
  );
}
