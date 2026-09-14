import { PolicyPage } from "@/components/legal/PolicyPage";
import { POLICY_DEFAULTS } from "@/lib/policies";
import { buildMetadata } from "@/lib/seo";
export const revalidate = 3600;
export const metadata = buildMetadata({
  title: "Terms of service",
  description: "Terms of service for Miracle Tree — Miracletree Life Science, Madurai.",
  path: "/terms",
});
export default function Page() {
  return (
    <PolicyPage
      slug="terms"
      title="Terms of service"
      path="/terms"
      fallback={POLICY_DEFAULTS.terms}
    />
  );
}
