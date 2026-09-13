import { PolicyPage } from "@/components/legal/PolicyPage";
import { POLICY_DEFAULTS } from "@/lib/policies";
import { buildMetadata } from "@/lib/seo";
export const revalidate = 3600;
export const metadata = buildMetadata({
  title: "Privacy policy",
  description: "Privacy policy for Miracle Tree — Miracletree Life Science, Madurai.",
  path: "/privacy",
});
export default function Page() {
  return (
    <PolicyPage
      slug="privacy"
      title="Privacy policy"
      path="/privacy"
      fallback={POLICY_DEFAULTS.privacy}
    />
  );
}
