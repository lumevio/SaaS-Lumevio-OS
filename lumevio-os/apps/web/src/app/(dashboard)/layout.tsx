"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { useAuth } from "@/hooks/use-auth";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { ready, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!ready) return;

    if (!isAuthenticated) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [ready, isAuthenticated, pathname, router]);

  if (!ready) {
    return <div style={styles.loading}>Ładowanie...</div>;
  }

  if (!isAuthenticated) {
    return <div style={styles.loading}>Przekierowanie do logowania...</div>;
  }

  return <DashboardShell>{children}</DashboardShell>;
}

const styles: Record<string, React.CSSProperties> = {
  loading: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#05051b",
    color: "#fff",
    fontSize: 18,
  },
};