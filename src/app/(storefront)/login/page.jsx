import { AuthShell } from "@/components/auth/AuthShell";
import { LoginForm } from "@/components/auth/AuthForms";
import { buildMetadata } from "@/lib/seo";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata = buildMetadata({
  title: "Sign in",
  description:
    "Sign in to your Miracle Tree account to track orders and saved products.",
  path: "/login",
  noIndex: true,
});
export default async function LoginPage({ searchParams }) {
  const user = await getCurrentUser();
  if (user) {
    if (user.role === "admin" || user.role === "staff") redirect("/admin");
    else redirect("/account");
  }

  const params = await searchParams;
  return (
    <AuthShell
      title="Sign in"
      lede="Your orders, addresses and saved products, in one place."
    >
      <LoginForm next={params.next} justReset={params.reset === "1"} error={params.error} />
    </AuthShell>
  );
}
