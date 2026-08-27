import type { Metadata } from "next";
import { PolicyPage } from "@/components/legal/PolicyPage";
import { POLICY_DEFAULTS } from "@/lib/policies";
import { buildMetadata } from "@/lib/seo";

export const revalidate = 3600;

export const metadata: Metadata = buildMetadata({
  title: "Shipping policy",
  description: "Shipping policy for Miracle Tree — Miracletree Life Science, Madurai.",
  path: "/shipping",
});

export default function Page() {
  return (
    <PolicyPage
      slug="shipping"
      title="Shipping policy"
      path="/shipping"
      fallback={POLICY_DEFAULTS.shipping!}
    />
  );
}
