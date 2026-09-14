import Link from "next/link";
import { AuthShell } from "@/components/auth/AuthShell";
import { ResetPasswordForm } from "@/components/auth/AuthForms";
import { buildMetadata } from "@/lib/seo";
export const metadata = buildMetadata({
  title: "Choose a new password",
  description: "Set a new password for your Miracle Tree account.",
  path: "/reset-password",
  noIndex: true,
});
export default async function ResetPasswordPage({ searchParams }) {
  const { token } = await searchParams;
  if (!token) {
    return (
      <AuthShell
        title="That link is incomplete"
        lede="Reset links expire after an hour. Request a fresh one and try again."
      >
        <Link
          href="/forgot-password"
          className="inline-block text-sm text-gold-300 underline underline-offset-4"
        >
          Request a new link
        </Link>
      </AuthShell>
    );
  }
  return (
    <AuthShell
      title="Choose a new password"
      lede="Pick something you don't use anywhere else."
    >
      <ResetPasswordForm token={token} />
    </AuthShell>
  );
}
