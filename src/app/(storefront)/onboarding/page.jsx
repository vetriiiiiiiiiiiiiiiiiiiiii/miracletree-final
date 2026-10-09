import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { OnboardingForm } from "@/components/auth/OnboardingForm";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Welcome - Complete your profile",
  description: "Complete your Miracle Tree profile.",
  path: "/onboarding",
  noIndex: true,
});

export default async function OnboardingPage() {
  const user = await requireUser();

  // Fetch full user details from DB to check if they actually need onboarding
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { firstName: true, lastName: true, phone: true },
  });

  // If they already have a phone number, they are considered onboarded
  if (dbUser?.phone) {
    redirect("/account");
  }

  return (
    <div className="relative min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Dynamic Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-gold-500/10 blur-[120px]" />
        <div className="absolute top-[60%] -right-[10%] w-[40%] h-[40%] rounded-full bg-green-500/10 blur-[100px]" />
      </div>

      <div className="relative w-full max-w-md z-10">
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-serif text-cream-50 mb-3 tracking-tight">
            Welcome to Miracle Tree
          </h1>
          <p className="text-cream-400">
            Let's get to know you better. Please complete your profile to
            continue.
          </p>
        </div>

        {/* Glassmorphic Card */}
        <div className="backdrop-blur-xl bg-ink-900/40 border border-white/10 p-8 sm:p-10 rounded-3xl shadow-[0_8px_32px_0_rgba(0,0,0,0.36)]">
          <OnboardingForm initialData={dbUser} />
        </div>
      </div>
    </div>
  );
}
