"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Input, Textarea, Select, FormMessage } from "@/components/ui/Field";
import { Card, FieldGroup, Pill } from "@/components/admin/ui";
import { RichTextEditor } from "@/components/admin/RichTextEditor";
import { saveSettingsAction } from "@/app/actions/admin/content";
import type { FormState } from "@/app/actions/marketing";
import { cn } from "@/lib/utils";

const INITIAL: FormState = { status: "idle" };

const POLICIES = [
  { key: "shipping", label: "Shipping policy", path: "/shipping" },
  { key: "returns", label: "Returns & refunds", path: "/returns" },
  { key: "privacy", label: "Privacy policy", path: "/privacy" },
  { key: "terms", label: "Terms of service", path: "/terms" },
];

/**
 * Store settings and the policy pages.
 *
 * Money is entered in rupees and converted to paise on submit, so the field
 * says what the shopper will see rather than what the database stores.
 */
export function SettingsForm({
  values,
  policyDefaults,
  activity,
}: {
  values: Record<string, string>;
  policyDefaults: Record<string, string>;
  activity: {
    id: string;
    action: string;
    entity: string;
    actor: string;
    meta: string | null;
    createdAt: string;
  }[];
}) {
  const [state, action] = useActionState(saveSettingsAction, INITIAL);
  const [tab, setTab] = useState<"store" | "policies" | "activity">("store");
  const [policyKey, setPolicyKey] = useState(POLICIES[0]!.key);
  const [policyBodies, setPolicyBodies] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      POLICIES.map((policy) => [
        policy.key,
        values[`policy.${policy.key}`] ?? policyDefaults[policy.key] ?? "",
      ]),
    ),
  );

  return (
    <div className="grid gap-6">
      <div role="tablist" className="flex flex-wrap gap-1 border-b border-white/10">
        {(
          [
            ["store", "Store"],
            ["policies", "Policies"],
            ["activity", "Activity log"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={tab === value}
            onClick={() => setTab(value)}
            className={cn(
              "-mb-px border-b-2 px-4 py-3 text-[0.7rem] uppercase tracking-[0.12em] transition-colors",
              tab === value
                ? "border-gold-400 text-cream-50"
                : "border-transparent text-cream-400 hover:text-cream-100",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "activity" ? (
        <Card
          title="Recent activity"
          description="Every administrative change is recorded. Useful when two people share an account, or when a price looks wrong."
          padded={false}
        >
          {activity.length === 0 ? (
            <p className="px-5 py-12 text-center text-sm text-cream-400">
              Nothing recorded yet.
            </p>
          ) : (
            <ul className="divide-y divide-white/8">
              {activity.map((entry) => (
                <li key={entry.id} className="flex flex-wrap items-baseline gap-3 px-5 py-3">
                  <Pill tone="info">{entry.entity}</Pill>
                  <span className="text-sm text-cream-100">{entry.action}</span>
                  <span className="text-xs text-cream-400">{entry.actor}</span>
                  <span className="ml-auto text-xs tabular-nums text-cream-400/70">
                    {entry.createdAt}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      ) : (
        <form action={action} className="grid gap-6">
          {state.status === "error" ? <FormMessage>{state.message}</FormMessage> : null}
          {state.status === "success" ? (
            <FormMessage tone="success">{state.message}</FormMessage>
          ) : null}

          {tab === "store" ? (
            <>
              <Card title="Shipping & checkout">
                <FieldGroup
                  title="Thresholds"
                  description="Enter paise — ₹699 is 69900. These drive the cart's free-shipping meter and the amount charged at checkout."
                >
                  <div className="grid gap-5 sm:grid-cols-2">
                    <Input
                      label="Free shipping above (paise)"
                      name="shipping.freeThreshold"
                      type="number"
                      min={0}
                      defaultValue={values["shipping.freeThreshold"] ?? "69900"}
                      hint="69900 = ₹699"
                    />
                    <Input
                      label="Flat shipping fee (paise)"
                      name="shipping.flatFee"
                      type="number"
                      min={0}
                      defaultValue={values["shipping.flatFee"] ?? "6000"}
                      hint="6000 = ₹60"
                    />
                  </div>

                  <Input
                    label="Shipping message"
                    name="shipping.copy"
                    defaultValue={values["shipping.copy"] ?? "Free shipping on orders above ₹699"}
                    hint="Used on product pages and in the footer."
                  />

                  <Select
                    label="Cash on delivery"
                    name="checkout.codEnabled"
                    defaultValue={values["checkout.codEnabled"] ?? "true"}
                    options={[
                      { value: "true", label: "Offered at checkout" },
                      { value: "false", label: "Not offered" },
                    ]}
                  />
                </FieldGroup>
              </Card>

              <Card title="Brand & SEO">
                <FieldGroup
                  title="Defaults"
                  description="Used on the homepage and anywhere a page has not set its own."
                >
                  <Input
                    label="Default page title"
                    name="seo.defaultTitle"
                    maxLength={70}
                    defaultValue={values["seo.defaultTitle"] ?? ""}
                  />
                  <Textarea
                    label="Default meta description"
                    name="seo.defaultDescription"
                    rows={3}
                    maxLength={180}
                    defaultValue={values["seo.defaultDescription"] ?? ""}
                  />
                  <Input
                    label="Tagline"
                    name="brand.tagline"
                    defaultValue={values["brand.tagline"] ?? ""}
                  />
                  <Input
                    label="Experience line"
                    name="brand.foundedYearsCopy"
                    defaultValue={values["brand.foundedYearsCopy"] ?? ""}
                    hint="e.g. 20+ years working with moringa"
                  />
                </FieldGroup>
              </Card>
            </>
          ) : (
            <Card
              title="Policy pages"
              description="These are the published pages at /shipping, /returns, /privacy and /terms. Have them reviewed by someone qualified before you rely on them."
            >
              <div className="grid gap-5">
                <div className="flex flex-wrap gap-1">
                  {POLICIES.map((policy) => (
                    <button
                      key={policy.key}
                      type="button"
                      onClick={() => setPolicyKey(policy.key)}
                      className={cn(
                        "border px-4 py-2 text-[0.66rem] uppercase tracking-[0.12em] transition-colors",
                        policyKey === policy.key
                          ? "border-gold-400 text-cream-50"
                          : "border-white/12 text-cream-400 hover:border-white/28 hover:text-cream-100",
                      )}
                    >
                      {policy.label}
                    </button>
                  ))}
                </div>

                {/* Every policy posts, not only the visible one, so switching
                    tabs before saving never silently drops an edit. */}
                {POLICIES.map((policy) => (
                  <div key={policy.key} className={cn(policyKey !== policy.key && "hidden")}>
                    <input
                      type="hidden"
                      name={`policy.${policy.key}`}
                      value={policyBodies[policy.key] ?? ""}
                    />
                    <RichTextEditor
                      label={policy.label}
                      value={policyBodies[policy.key] ?? ""}
                      onChange={(next) =>
                        setPolicyBodies((current) => ({ ...current, [policy.key]: next }))
                      }
                      rows={20}
                    />
                    <p className="mt-3 text-xs text-cream-400">
                      Published at{" "}
                      <a
                        href={policy.path}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline underline-offset-4 hover:text-cream-200"
                      >
                        {policy.path}
                      </a>
                    </p>
                  </div>
                ))}
              </div>
            </Card>
          )}

          <SaveSettings />
        </form>
      )}
    </div>
  );
}

function SaveSettings() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="justify-self-start bg-emerald-500 px-7 py-3 text-[0.7rem] font-medium uppercase tracking-[0.14em] text-cream-50 transition-colors hover:bg-emerald-400 disabled:opacity-60"
    >
      {pending ? "Saving…" : "Save settings"}
    </button>
  );
}
