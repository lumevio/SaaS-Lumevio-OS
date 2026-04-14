"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";

export function Topbar() {
  const router = useRouter();
  const { user, logout } = useAuth();

  function handleLogout() {
    logout();
    router.push("/login");
  }

  return (
    <header style={styles.topbar}>
      <div>
        <div style={styles.title}>LUMEVIO OS</div>
        <div style={styles.subtitle}>
          Retail intelligence, NFC operations, analytics, campaigns
        </div>
      </div>

      <div style={styles.right}>
        <div style={styles.userBox}>
          <div style={styles.userName}>
            {user?.firstName || "Admin"} {user?.lastName || ""}
          </div>
          <div style={styles.userEmail}>{user?.email || "brak sesji"}</div>
        </div>

        <div style={styles.roleBadge}>
          {user?.isPlatformAdmin ? "SUPERADMIN" : "CLIENT"}
        </div>

        <button onClick={handleLogout} style={styles.logoutButton}>
          Wyloguj
        </button>
      </div>
    </header>
  );
}

const styles: Record<string, React.CSSProperties> = {
  topbar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 16,
    padding: "24px 28px 8px 28px",
  },
  title: {
    fontSize: 28,
    fontWeight: 800,
    color: "#fff",
    letterSpacing: "-0.02em",
  },
  subtitle: {
    marginTop: 4,
    color: "#98a3d8",
    fontSize: 14,
  },
  right: {
    display: "flex",
    alignItems: "center",
    gap: 12,
  },
  userBox: {
    textAlign: "right",
  },
  userName: {
    color: "#fff",
    fontWeight: 700,
    fontSize: 14,
  },
  userEmail: {
    color: "#98a3d8",
    fontSize: 12,
  },
  roleBadge: {
    padding: "8px 12px",
    borderRadius: 999,
    background: "rgba(109,124,255,0.12)",
    border: "1px solid rgba(109,124,255,0.35)",
    color: "#fff",
    fontWeight: 700,
    fontSize: 12,
  },
  logoutButton: {
    height: 42,
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.1)",
    background: "transparent",
    color: "#fff",
    padding: "0 14px",
    fontWeight: 700,
    cursor: "pointer",
  },
};