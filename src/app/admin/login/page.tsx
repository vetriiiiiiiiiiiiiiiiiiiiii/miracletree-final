import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/layout/Logo";
import { BotanicalSeed } from "@/components/hero/BotanicalSeed";
import { LoginForm } from "@/components/auth/AuthForms";

export const metadata: Metadata = {
  title: "Admin sign in",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  return (
    <div className="grain relative grid min-h-[100svh] place-items-center bg-ink px-5 py-16">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(50% 50% at 50% 40%, rgba(28,90,58,0.18) 0%, rgba(6,9,7,0) 70%)",
        }}
      />

      <div className="relative z-10 w-full max-w-sm">
        <div className="mb-10 flex flex-col items-center text-center">
          <BotanicalSeed className="h-24 w-auto" />
          <Logo className="mt-6 h-7 w-auto" />
          <p className="eyebrow mt-5 text-gold-400">Store administration</p>
        </div>

        <div className="border border-border-subtle bg-ink-900/70 p-7 backdrop-blur-sm">
          <LoginForm next={next && next.startsWith("/admin") ? next : "/admin"} />
        </div>

        <p className="mt-8 text-center text-xs text-cream-400">
          <Link href="/" className="underline underline-offset-4 hover:text-cream-200">
            Back to the store
          </Link>
        </p>
      </div>
    </div>
  );
}
