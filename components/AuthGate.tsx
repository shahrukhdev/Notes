"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function AuthGate({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const isAuthPage =
    pathname.startsWith("/login") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/forgot-password") ||
    pathname.startsWith("/reset-password");

  const isProtected =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/tags") ||
    pathname.startsWith("/categories") ||
    pathname.startsWith("/profile") ||
    pathname.startsWith("/notes");

  useEffect(() => {
    if (loading) return; // ⛔ wait until user is resolved

    // ❌ not logged in → protect routes
    if (!user && isProtected) {
      router.replace("/login");
    }

    // ❌ logged in → block auth pages
    if (user && isAuthPage) {
      router.replace("/dashboard");
    }
  }, [user, loading, pathname]);

  // 🔥 CRITICAL: prevent UI flash
  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
}