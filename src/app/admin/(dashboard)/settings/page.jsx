import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { PageHeader, Card } from "@/components/admin/ui";
import { SettingsForm } from "@/components/admin/SettingsForm";
import { POLICY_DEFAULTS } from "@/lib/policies";
import { isRazorpayConfigured } from "@/lib/razorpay";
import { formatDate } from "@/lib/utils";
export const dynamic = "force-dynamic";
export default async function AdminSettingsPage() {
  await requireAdmin();
  const [rows, recentActivity] = await Promise.all([
    prisma.siteSetting.findMany(),
    prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 25,
      select: {
        id: true,
        action: true,
        entity: true,
        meta: true,
        createdAt: true,
        actor: { select: { email: true } },
      },
    }),
  ]);
  const settings = Object.fromEntries(rows.map((row) => [row.key, row.value]));
  return (
    <>
      <PageHeader
        title="Settings"
        description="Store-wide values and the policy pages. Everything here is stored in the database and takes effect immediately."
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <Card title="Payments">
          <p className="text-sm leading-relaxed text-cream-300">
            {isRazorpayConfigured()
              ? "Razorpay is configured. Card, UPI, net banking and wallet payments are available at checkout."
              : "Razorpay is not configured. Checkout is running in cash-on-delivery-only mode."}
          </p>
          <p className="mt-3 text-xs leading-relaxed text-cream-400">
            API keys are read from environment variables and are never stored in the
            database or sent to the browser. Set{" "}
            <code className="text-cream-300">RAZORPAY_KEY_ID</code>,{" "}
            <code className="text-cream-300">RAZORPAY_KEY_SECRET</code> and{" "}
            <code className="text-cream-300">RAZORPAY_WEBHOOK_SECRET</code> to enable
            it.
          </p>
        </Card>

        <Card title="Search Console">
          <p className="text-sm leading-relaxed text-cream-300">
            The sitemap is generated automatically at{" "}
            <code className="text-cream-300">/sitemap.xml</code> and includes every
            published product, category and article.
          </p>
          <p className="mt-3 text-xs leading-relaxed text-cream-400">
            To verify ownership, set{" "}
            <code className="text-cream-300">GOOGLE_SITE_VERIFICATION</code> to the
            token Google gives you — it is rendered as a meta tag on every page.
          </p>
        </Card>
      </div>

      <SettingsForm
        values={settings}
        policyDefaults={POLICY_DEFAULTS}
        activity={recentActivity.map((entry) => ({
          id: entry.id,
          action: entry.action,
          entity: entry.entity,
          actor: entry.actor?.email ?? "system",
          meta: entry.meta,
          createdAt: formatDate(entry.createdAt, {
            hour: "numeric",
            minute: "2-digit",
          }),
        }))}
      />
    </>
  );
}
