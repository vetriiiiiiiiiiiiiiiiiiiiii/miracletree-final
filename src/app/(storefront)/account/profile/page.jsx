import { requireUser } from "@/lib/auth";
import { buildMetadata } from "@/lib/seo";
import { ProfileForm } from "@/components/account/ProfileForm";
import { formatDate } from "@/lib/utils";
export const dynamic = "force-dynamic";
export const metadata = buildMetadata({
  title: "Your details",
  description: "Update your name, phone number and email preferences.",
  path: "/account/profile",
  noIndex: true,
});
export default async function ProfilePage() {
  const user = await requireUser();
  return (
    <div className="max-w-xl">
      <h2 className="text-title text-cream-50">Your details</h2>
      <p className="mt-3 text-sm text-cream-400">
        Member since {formatDate(user.createdAt, { day: undefined })}
      </p>

      <div className="mt-10">
        <ProfileForm
          defaults={{
            firstName: user.firstName ?? "",
            lastName: user.lastName ?? "",
            phone: user.phone ?? "",
            marketingOptIn: user.marketingOptIn,
            email: user.email,
          }}
        />
      </div>
    </div>
  );
}
