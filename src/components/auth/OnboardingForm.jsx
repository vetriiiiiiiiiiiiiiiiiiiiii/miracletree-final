"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { completeOnboardingAction } from "@/app/actions/auth";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";

function SubmitButton({ children, className, size }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size={size} className={className} loading={pending}>
      {children}
    </Button>
  );
}

export function OnboardingForm({ initialData }) {
  const [state, formAction] = useActionState(completeOnboardingAction, null);

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-4">
        <Input
          name="firstName"
          label="First name"
          defaultValue={initialData?.firstName || ""}
          error={state?.errors?.firstName}
          required
          autoComplete="given-name"
        />
        <Input
          name="lastName"
          label="Last name"
          defaultValue={initialData?.lastName || ""}
          error={state?.errors?.lastName}
          autoComplete="family-name"
        />
      </div>

      <Input
        name="phone"
        label="Phone number *"
        type="tel"
        defaultValue={initialData?.phone || ""}
        error={state?.errors?.phone}
        required
        autoComplete="tel"
      />

      <label className="group flex items-start gap-4 cursor-pointer mt-2">
        <div className="relative flex items-center justify-center mt-1">
          <input
            type="checkbox"
            name="marketingOptIn"
            className="peer sr-only"
            defaultChecked={true}
          />
          <div className="h-5 w-5 rounded-md border border-white/20 bg-white/5 transition-all peer-checked:bg-green-500 peer-checked:border-green-500 group-hover:border-white/40" />
          <svg
            className="absolute h-3 w-3 text-ink opacity-0 transition-opacity peer-checked:opacity-100"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={3}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-cream-50">Send me updates</p>
          <p className="text-xs text-cream-400 mt-1">
            Receive exclusive offers and early access to new collections.
          </p>
        </div>
      </label>

      {state?.status === "error" && !state.errors && (
        <div className="rounded-lg bg-red-500/10 p-4 border border-red-500/20">
          <p className="text-sm text-red-400 text-center">{state.message}</p>
        </div>
      )}

      <div className="pt-4">
        <SubmitButton size="lg" className="w-full font-medium tracking-wide">
          Complete Profile
        </SubmitButton>
      </div>
    </form>
  );
}
