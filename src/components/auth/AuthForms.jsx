"use client";
import Link from "next/link";
import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import { Input, Checkbox, FormMessage } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import {
  forgotPasswordAction,
  loginAction,
  adminLoginAction,
  registerAction,
  resetPasswordAction,
  googleAuthAction,
} from "@/app/actions/auth";
import { analytics } from "@/lib/analytics";
const INITIAL = { status: "idle" };
function Submit({ children }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" className="w-full" loading={pending}>
      {children}
    </Button>
  );
}

function GoogleAuthButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full flex items-center justify-center gap-3 py-3.5 rounded-2xl border border-gray-700/30 bg-white/5 font-medium text-sm transition-all duration-300 hover:bg-white/10 hover:border-gray-500 active:scale-[0.98] text-cream-50 disabled:opacity-70 disabled:cursor-not-allowed"
    >
      {pending ? (
        <svg
          className="animate-spin h-5 w-5 text-cream-50"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
      ) : (
        <svg className="h-4 w-4" viewBox="0 0 24 24">
          <path
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            fill="#4285F4"
          />
          <path
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            fill="#34A853"
          />
          <path
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            fill="#FBBC05"
          />
          <path
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            fill="#EA4335"
          />
          <path d="M1 1h22v22H1z" fill="none" />
        </svg>
      )}
      {pending ? "Connecting..." : "Continue with Google"}
    </button>
  );
}
export function LoginForm({ next, justReset, error }) {
  const [state, action] = useActionState(loginAction, INITIAL);
  return (
    <div className="grid gap-5">
      {justReset ? (
        <FormMessage tone="success">
          Your password has been changed. Sign in with the new one.
        </FormMessage>
      ) : null}

      {error && (
        <FormMessage>
          {error === "OAuthAccountNotLinked"
            ? "To confirm your identity, sign in with the same account you used originally."
            : "An error occurred during authentication."}
        </FormMessage>
      )}

      <form action={action} className="grid gap-5">
        {next ? <input type="hidden" name="next" value={next} /> : null}

        {state.status === "error" ? (
          <FormMessage>{state.message}</FormMessage>
        ) : null}

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
      </form>

      <div className="relative my-2">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-cream-800" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-[#0b120c] px-2 text-cream-400">
            Or continue with
          </span>
        </div>
      </div>

      <form action={googleAuthAction}>
        <GoogleAuthButton />
      </form>

      <p className="text-center text-sm text-cream-400">
        New here?{" "}
        <Link
          href={
            next ? `/register?next=${encodeURIComponent(next)}` : "/register"
          }
          className="text-gold-300 underline underline-offset-4"
        >
          Create an account
        </Link>
      </p>
    </div>
  );
}
export function AdminLoginForm({ next }) {
  const [state, action] = useActionState(adminLoginAction, INITIAL);
  return (
    <div className="grid gap-5">
      <form action={action} className="grid gap-5">
        {next ? <input type="hidden" name="next" value={next} /> : null}

        {state.status === "error" ? (
          <FormMessage>{state.message}</FormMessage>
        ) : null}

        <Input
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="admin@example.com"
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
      </form>
    </div>
  );
}

export function RegisterForm({ next, error }) {
  const [state, action] = useActionState(registerAction, INITIAL);
  useEffect(() => {
    if (state.status === "success") analytics.signUp();
  }, [state]);
  return (
    <div className="grid gap-5">
      {error && (
        <FormMessage>
          {error === "OAuthAccountNotLinked"
            ? "To confirm your identity, sign in with the same account you used originally."
            : "An error occurred during authentication."}
        </FormMessage>
      )}

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
            error={
              state.status === "error" ? state.errors?.firstName : undefined
            }
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
      </form>

      <div className="relative my-2">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-cream-800" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-[#0b120c] px-2 text-cream-400">
            Or continue with
          </span>
        </div>
      </div>

      <form action={googleAuthAction}>
        <GoogleAuthButton />
      </form>

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
    </div>
  );
}
export function ForgotPasswordForm() {
  const [state, action] = useActionState(forgotPasswordAction, INITIAL);
  if (state.status === "success") {
    return <FormMessage tone="success">{state.message}</FormMessage>;
  }
  return (
    <form action={action} className="grid gap-5">
      {state.status === "error" ? (
        <FormMessage>{state.message}</FormMessage>
      ) : null}

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
        <Link
          href="/login"
          className="text-gold-300 underline underline-offset-4"
        >
          Back to sign in
        </Link>
      </p>
    </form>
  );
}
export function ResetPasswordForm({ token }) {
  const [state, action] = useActionState(resetPasswordAction, INITIAL);
  return (
    <form action={action} className="grid gap-5">
      <input type="hidden" name="token" value={token} />

      {state.status === "error" ? (
        <FormMessage>{state.message}</FormMessage>
      ) : null}

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
