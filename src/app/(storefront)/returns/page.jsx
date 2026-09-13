import { PolicyPage } from "@/components/legal/PolicyPage";
import { POLICY_DEFAULTS } from "@/lib/policies";
import { buildMetadata } from "@/lib/seo";
export const revalidate = 3600;
export const metadata = buildMetadata({
  title: "Returns & refunds",
  description:
    "Returns & refunds for Miracle Tree — Miracletree Life Science, Madurai.",
  path: "/returns",
});
export default function Page() {
  return (
    <PolicyPage
      slug="returns"
      title="Returns & refunds"
      path="/returns"
      fallback={POLICY_DEFAULTS.returns}
    />
  );
}
