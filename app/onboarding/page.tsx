import { Suspense } from "react";
import { OnboardingForm } from "./onboarding-form";

export default function OnboardingPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
      <OnboardingForm />
    </Suspense>
  );
}
