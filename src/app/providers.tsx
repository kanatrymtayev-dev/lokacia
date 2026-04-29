"use client";

import { AuthProvider, useAuth } from "@/lib/auth-context";
import { I18nProvider } from "@/lib/i18n";
import ErrorBoundary from "@/components/ui/error-boundary";
import SmoothScroll from "@/components/smooth-scroll";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";

function OnboardingGuard({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (loading || !user) return;
    const skip = ["/onboarding", "/login", "/register", "/reset-password"];
    if (skip.some((p) => pathname.startsWith(p))) return;

    if (!user.onboarding_completed) {
      router.push("/onboarding");
    }
  }, [user, loading, pathname, router]);

  return <>{children}</>;
}

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary>
      <I18nProvider>
        <AuthProvider>
          <SmoothScroll />
          <OnboardingGuard>{children}</OnboardingGuard>
        </AuthProvider>
      </I18nProvider>
    </ErrorBoundary>
  );
}
