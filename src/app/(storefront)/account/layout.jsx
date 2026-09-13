import { redirect } from "next/navigation";
import { Container } from "@/components/layout/Section";
import { AccountNav } from "@/components/account/AccountNav";
import { getCurrentUser } from "@/lib/auth";
export default async function AccountLayout({ children }) {
  // Middleware already gates this; re-checking here means a route can never be
  // reached with a stale or forged token if the matcher is ever changed.
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/account");
  const name = [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email;
  return (
    <div className="grain bg-ink pb-24 pt-12 md:pt-16">
      <Container>
        <header className="border-b border-border-subtle pb-10">
          <p className="eyebrow mb-4 text-gold-400">Your account</p>
          <h1 className="text-display text-cream-50">{name}</h1>
          <p className="mt-3 text-sm text-cream-400">{user.email}</p>
        </header>

        <div className="mt-12 grid gap-10 lg:grid-cols-[15rem_1fr] lg:gap-16">
          <AccountNav isAdmin={user.role === "admin" || user.role === "staff"} />
          <div className="min-w-0">{children}</div>
        </div>
      </Container>
    </div>
  );
}
