import { Navigate } from "react-router";
import { useSettings } from "../settings/useSettings";

interface OnboardingGuardProps {
  children: React.ReactNode;
}

export function OnboardingGuard({ children }: OnboardingGuardProps) {
  const { settings, initiated } = useSettings();
  // Check if user has completed onboarding
  const hasOnboarded = settings.onboardedAt && settings.onboardedAt > 0;
  // If not onboarded, redirect to onboarding page
  if (!hasOnboarded && initiated) {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
}
