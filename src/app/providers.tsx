"use client";

import { AuthProvider, useAuth } from "@/lib/auth-context";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";

function OnboardingGuard({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (loading || !user) return;
    // Skip redirect if already on onboarding, login, register, or reset-password
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
    <AuthProvider>
      <OnboardingGuard>{children}</OnboardingGuard>
    </AuthProvider>
  );
}
