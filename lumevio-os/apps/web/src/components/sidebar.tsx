"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { getUser } from "@/lib/auth";

type NavItem = {
  href: string;
  label: string;
  adminOnly?: boolean;
};

const items: NavItem[] = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/organizations", label: "Organizacje", adminOnly: true },
  { href: "/users", label: "Użytkownicy", adminOnly: true },
  { href: "/stores", label: "Sklepy" },
  { href: "/campaigns", label: "Kampanie" },
  { href: "/redirect-links", label: "Redirect Links" },
  { href: "/nfc-tags", label: "NFC Tags" },
  { href: "/analytics", label: "Analityka" },
  { href: "/documents", label: "Dokumenty" },
  { href: "/drive", label: "Drive" },
  { href: "/settings", label: "Ustawienia", adminOnly: true },
];

export function Sidebar() {
  const pathname = usePathname();
  const user = getUser();
  const isAdmin = !!user?.isPlatformAdmin;

  const visibleItems = items.filter((item) => {
    if (item.adminOnly && !isAdmin) return false;
    return true;
  });

  return (
    <aside style={styles.sidebar}>
      <div style={styles.brandWrap}>
        <div style={styles.logo}>L</div>
        <div>
          <div style={styles.brand}>LUMEVIO OS</div>
          <div style={styles.subbrand}>
            {isAdmin ? "Superadmin Console" : "Client Workspace"}
          </div>
        </div>
      </div>

      <nav style={styles.nav}>
        {visibleItems.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");

          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                ...styles.link,
                ...(active ? styles.linkActive : {}),
              }}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

const styles: Record<string, React.CSSProperties> = {
  sidebar: {
    width: 280,
    minHeight: "100vh",
    borderRight: "1px solid rgba(255,255,255,0.08)",
    background:
      "radial-gradient(circle at top left, rgba(109,124,255,0.16), transparent 28%), #060919",
    padding: 20,
    position: "sticky",
    top: 0,
    backdropFilter: "blur(14px)",
  },
  brandWrap: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    marginBottom: 28,
  },
  logo: {
    width: 44,
    height: 44,
    borderRadius: 16,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(135deg, #6d7cff, #8d6bff)",
    color: "#fff",
    fontWeight: 800,
    fontSize: 18,
    boxShadow: "0 0 24px rgba(109,124,255,0.3)",
  },
  brand: {
    fontWeight: 800,
    fontSize: 18,
    color: "#fff",
  },
  subbrand: {
    fontSize: 12,
    color: "#9ea8d8",
  },
  nav: {
    display: "grid",
    gap: 8,
  },
  link: {
    display: "flex",
    alignItems: "center",
    minHeight: 46,
    padding: "0 14px",
    borderRadius: 14,
    color: "#cfd6ff",
    textDecoration: "none",
    background: "transparent",
    border: "1px solid transparent",
    fontWeight: 600,
    transition: "all 0.2s ease",
  },
  linkActive: {
    background: "rgba(109,124,255,0.14)",
    border: "1px solid rgba(109,124,255,0.35)",
    color: "#fff",
    boxShadow: "0 0 20px rgba(109,124,255,0.12)",
  },
};