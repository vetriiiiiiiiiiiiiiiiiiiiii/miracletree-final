"use client";

import Link from "next/link";
import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import { Input, Checkbox, FormMessage } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import {
  forgotPasswordAction,
  loginAction,
  registerAction,
  resetPasswordAction,
  type AuthState,
} from "@/app/actions/auth";
import { analytics } from "@/lib/analytics";

const INITIAL: AuthState = { status: "idle" };

function Submit({ children }: { children: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" className="w-full" loading={pending}>
      {children}
    </Button>
  );
}

export function LoginForm({ next, justReset }: { next?: string; justReset?: boolean }) {
  const [state, action] = useActionState(loginAction, INITIAL);

  return (
    <form action={action} className="grid gap-5">
      {next ? <input type="hidden" name="next" value={next} /> : null}

      {justReset ? (
        <FormMessage tone="success">
          Your password has been changed. Sign in with the new one.
        </FormMessage>
      ) : null}

      {state.status === "error" ? <FormMessage>{state.message}</FormMessage> : null}

      <Input
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        required
        placeholder="you@example.com"
      />

      <div className="grid gap-2">
        <Input
          label="Password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
        <Link
          href="/forgot-password"
          className="justify-self-end py-1.5 text-xs text-cream-400 underline underline-offset-4 hover:text-cream-100"
        >
          Forgotten your password?
        </Link>
      </div>

      <Submit>Sign in</Submit>

      <p className="text-center text-sm text-cream-400">
        New here?{" "}
        <Link
          href={next ? `/register?next=${encodeURIComponent(next)}` : "/register"}
          className="text-gold-300 underline underline-offset-4"
        >
          Create an account
        </Link>
      </p>
    </form>
  );
}

export function RegisterForm({ next }: { next?: string }) {
  const [state, action] = useActionState(registerAction, INITIAL);

  useEffect(() => {
    if (state.status === "success") analytics.signUp();
  }, [state]);

  return (
    <form action={action} className="grid gap-5">
      {next ? <input type="hidden" name="next" value={next} /> : null}

      {state.status === "error" && !state.errors ? (
        <FormMessage>{state.message}</FormMessage>
      ) : null}

      <div className="grid gap-5 sm:grid-cols-2">
        <Input
          label="First name"
          name="firstName"
          autoComplete="given-name"
          required
          error={state.status === "error" ? state.errors?.firstName : undefined}
        />
        <Input label="Last name" name="lastName" autoComplete="family-name" />
      </div>

      <Input
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        required
        error={state.status === "error" ? state.errors?.email : undefined}
      />

      <Input
        label="Password"
        name="password"
        type="password"
        autoComplete="new-password"
        required
        hint="At least 10 characters, with a letter and a number."
        error={state.status === "error" ? state.errors?.password : undefined}
      />

      <Checkbox
        name="marketingOptIn"
        label="Send me the journal"
        description="Harvest notes and the occasional recipe. Roughly monthly."
      />

      <Submit>Create account</Submit>

      <p className="text-center text-sm text-cream-400">
        Already have an account?{" "}
        <Link
          href={next ? `/login?next=${encodeURIComponent(next)}` : "/login"}
          className="text-gold-300 underline underline-offset-4"
        >
          Sign in
        </Link>
      </p>

      <p className="text-center text-xs leading-relaxed text-cream-400">
        By creating an account you agree to our{" "}
        <Link href="/terms" className="underline underline-offset-2">
          terms
        </Link>{" "}
        and{" "}
        <Link href="/privacy" className="underline underline-offset-2">
          privacy policy
        </Link>
        .
      </p>
    </form>
  );
}

export function ForgotPasswordForm() {
  const [state, action] = useActionState(forgotPasswordAction, INITIAL);

  if (state.status === "success") {
    return <FormMessage tone="success">{state.message}</FormMessage>;
  }

  return (
    <form action={action} className="grid gap-5">
      {state.status === "error" ? <FormMessage>{state.message}</FormMessage> : null}

      <Input
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        required
        placeholder="you@example.com"
        hint="We'll send a reset link if an account exists for this address."
      />

      <Submit>Send reset link</Submit>

      <p className="text-center text-sm text-cream-400">
        <Link href="/login" className="text-gold-300 underline underline-offset-4">
          Back to sign in
        </Link>
      </p>
    </form>
  );
}

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, action] = useActionState(resetPasswordAction, INITIAL);

  return (
    <form action={action} className="grid gap-5">
      <input type="hidden" name="token" value={token} />

      {state.status === "error" ? <FormMessage>{state.message}</FormMessage> : null}

      <Input
        label="New password"
        name="password"
        type="password"
        autoComplete="new-password"
        required
        hint="At least 10 characters, with a letter and a number."
        error={state.status === "error" ? state.errors?.password : undefined}
      />

      <Submit>Change password</Submit>
    </form>
  );
}
