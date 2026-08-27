import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/AuthShell";
import { LoginForm } from "@/components/auth/AuthForms";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Sign in",
  description: "Sign in to your Miracle Tree account to track orders and saved products.",
  path: "/login",
  noIndex: true,
});

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; reset?: string }>;
}) {
  const params = await searchParams;

  return (
    <AuthShell
      eyebrow="Welcome back"
      title="Sign in"
      lede="Your orders, addresses and saved products, in one place."
    >
      <LoginForm next={params.next} justReset={params.reset === "1"} />
    </AuthShell>
  );
}
