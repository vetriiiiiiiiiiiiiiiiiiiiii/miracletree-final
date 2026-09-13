import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/AuthShell";
import { RegisterForm } from "@/components/auth/AuthForms";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Create an account",
  description: "Create a Miracle Tree account to track orders and save products.",
  path: "/register",
  noIndex: true,
});

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const params = await searchParams;

  return (
    <AuthShell
      title="Start here."
      lede="Faster checkout, order tracking, and a place to keep the things you want to come back to."
    >
      <RegisterForm next={params.next} />
    </AuthShell>
  );
}
