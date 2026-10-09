import { AuthShell } from "@/components/auth/AuthShell";
import { RegisterForm } from "@/components/auth/AuthForms";
import { buildMetadata } from "@/lib/seo";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata = buildMetadata({
  title: "Create an account",
  description:
    "Create a Miracle Tree account to track orders and save products.",
  path: "/register",
  noIndex: true,
});
export default async function RegisterPage({ searchParams }) {
  const user = await getCurrentUser();
  if (user) {
    if (user.role === "admin" || user.role === "staff") redirect("/admin");
    else redirect("/account");
  }

  const params = await searchParams;
  return (
    <AuthShell
      title="Start here."
      lede="Faster checkout, order tracking, and a place to keep the things you want to come back to."
    >
      <RegisterForm next={params.next} error={params.error} />
    </AuthShell>
  );
}
