"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { PropsWithChildren, useMemo } from "react";

type NavItem = {
  label: string;
  href: string;
  accent?: boolean;
};

const NAV_MAIN: NavItem[] = [
  { label: "Dashboard", href: "/" },
  { label: "Organizacje", href: "/organizations", accent: true },
  { label: "Sklepy", href: "/stores" },
  { label: "Kampanie", href: "/campaigns" },
  { label: "Redirect Links", href: "/redirect-links" },
  { label: "NFC Tags", href: "/nfc-tags" },
  { label: "Campaign Pages", href: "/campaign-pages" },
  { label: "Analityka", href: "/analytics" },
  { label: "Dokumenty", href: "/documents" },
  { label: "Drive", href: "/drive" },
  { label: "Ustawienia", href: "/settings" },
];

export default function DashboardLayout({ children }: PropsWithChildren) {
  const pathname = usePathname();
  const router = useRouter();

  const pageMeta = useMemo(() => {
    if (pathname.startsWith("/organizations")) {
      return {
        eyebrow: "Client operating system",
        title: "Organizacje",
        subtitle:
          "Pełna karta klienta LUMEVIO: dane firmowe, kontakt, Drive, operacje i onboarding.",
      };
    }

    if (pathname.startsWith("/stores")) {
      return {
        eyebrow: "Physical world structure",
        title: "Sklepy",
        subtitle:
          "Lokalizacje, strefy, półki i fizyczna struktura wdrożeń gotowa pod kampanie i tagi NFC.",
      };
    }

    if (pathname.startsWith("/campaigns")) {
      return {
        eyebrow: "Phygital activation layer",
        title: "Kampanie",
        subtitle:
          "Kampanie klientów, cele, packi PDF, struktura wdrożeń i flow operacyjne.",
      };
    }

    if (pathname.startsWith("/redirect-links")) {
      return {
        eyebrow: "Activation routing",
        title: "Redirect Links",
        subtitle:
          "Publiczne linki, QR export, print assets i routing wejść kampanii.",
      };
    }

    if (pathname.startsWith("/nfc-tags")) {
      return {
        eyebrow: "NFC operating layer",
        title: "NFC Tags",
        subtitle:
          "Rejestr tagów, przypisania do kampanii i przygotowanie pod bridge ACR122U.",
      };
    }

    if (pathname.startsWith("/campaign-pages")) {
      return {
        eyebrow: "Hosted campaign layer",
        title: "Campaign Pages",
        subtitle:
          "Landing pages, formularze, quizy i builder doświadczeń kampanii.",
      };
    }

    if (pathname.startsWith("/analytics")) {
      return {
        eyebrow: "Offline intelligence",
        title: "Analityka",
        subtitle:
          "Pomiar interakcji w świecie fizycznym, performance kampanii i insighty operacyjne.",
      };
    }

    if (pathname.startsWith("/documents")) {
      return {
        eyebrow: "Document operations",
        title: "Dokumenty",
        subtitle:
          "Oferty, briefy, packi klienta, raporty i dokumentacja wdrożeń.",
      };
    }

    if (pathname.startsWith("/drive")) {
      return {
        eyebrow: "Cloud workspace",
        title: "Drive",
        subtitle:
          "Foldery klientów, kampanii i pełna struktura operacyjna LUMEVIO na Google Drive.",
      };
    }

    if (pathname.startsWith("/settings")) {
      return {
        eyebrow: "Platform control",
        title: "Ustawienia",
        subtitle:
          "Konfiguracja systemu, branding, role, integracje i parametry platformy.",
      };
    }

    return {
      eyebrow: "LUMEVIO OS",
      title: "Panel administracyjny",
      subtitle:
        "System operacyjny dla świata fizycznego: klienci, kampanie, tagi, analityka i operacje.",
    };
  }, [pathname]);

  async function handleLogout() {
    try {
      localStorage.removeItem("auth_token");
      localStorage.removeItem("access_token");
      router.push("/login");
      router.refresh();
    } catch {
      router.push("/login");
    }
  }

  return (
    <div style={styles.viewport}>
      <div style={styles.backgroundGlowTop} />
      <div style={styles.backgroundGlowLeft} />
      <div style={styles.backgroundGrid} />

      <aside style={styles.sidebar}>
        <div style={styles.sidebarInner}>
          <Link href="/" style={styles.brandWrap}>
            <div style={styles.logoBadge}>
              <Image
                src="/logo.png"
                alt="LUMEVIO"
                width={130}
                height={30}
                style={styles.logoImage}
                priority
              />
            </div>

            <div>
              <div style={styles.brandTitle}>LUMEVIO OS</div>
              <div style={styles.brandSubtitle}>Phygital Operating System</div>
            </div>
          </Link>

          <div style={styles.navSectionLabel}>Główne moduły</div>

          <nav style={styles.nav}>
            {NAV_MAIN.map((item) => {
              const active =
                item.href === "/"
                  ? pathname === "/"
                  : pathname === item.href || pathname.startsWith(`${item.href}/`);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  style={{
                    ...styles.navItem,
                    ...(active ? styles.navItemActive : {}),
                    ...(item.accent ? styles.navItemAccent : {}),
                  }}
                >
                  <span
                    style={{
                      ...styles.navDot,
                      ...(active ? styles.navDotActive : {}),
                    }}
                  />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div style={styles.sidebarFooter}>
            <div style={styles.sidebarFooterBadge}>L</div>
            <div>
              <div style={styles.sidebarFooterTitle}>LUMEVIO Enterprise</div>
              <div style={styles.sidebarFooterText}>Offline growth infrastructure</div>
            </div>
          </div>
        </div>
      </aside>

      <div style={styles.contentShell}>
        <header style={styles.topbar}>
          <div>
            <div style={styles.eyebrow}>{pageMeta.eyebrow}</div>
            <h1 style={styles.pageTitle}>{pageMeta.title}</h1>
            <p style={styles.pageSubtitle}>{pageMeta.subtitle}</p>
          </div>

          <div style={styles.topbarRight}>
            <div style={styles.topBadge}>Enterprise-ready</div>

            <div style={styles.userCard}>
              <div style={styles.userAvatar}>P</div>
              <div>
                <div style={styles.userName}>Przemek Admin</div>
                <div style={styles.userEmail}>admin@lumevio.pl</div>
              </div>
            </div>

            <button type="button" onClick={handleLogout} style={styles.logoutButton}>
              Wyloguj
            </button>
          </div>
        </header>

        <main style={styles.main}>{children}</main>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  viewport: {
    minHeight: "100vh",
    display: "grid",
    gridTemplateColumns: "280px minmax(0, 1fr)",
    background:
      "radial-gradient(circle at top center, rgba(20,32,86,0.45) 0%, rgba(2,6,25,1) 34%, rgba(1,3,18,1) 100%)",
    color: "#F8FAFC",
    position: "relative",
    overflow: "hidden",
  },
  backgroundGlowTop: {
    position: "fixed",
    top: -120,
    left: "34%",
    width: 720,
    height: 320,
    borderRadius: 9999,
    background:
      "radial-gradient(circle, rgba(109,124,255,0.22) 0%, rgba(66,215,255,0.10) 34%, rgba(0,0,0,0) 72%)",
    filter: "blur(24px)",
    pointerEvents: "none",
  },
  backgroundGlowLeft: {
    position: "fixed",
    left: -140,
    bottom: -120,
    width: 420,
    height: 420,
    borderRadius: "50%",
    background:
      "radial-gradient(circle, rgba(228,92,255,0.14) 0%, rgba(109,124,255,0.08) 36%, rgba(0,0,0,0) 74%)",
    filter: "blur(24px)",
    pointerEvents: "none",
  },
  backgroundGrid: {
    position: "fixed",
    inset: 0,
    backgroundImage:
      "linear-gradient(rgba(255,255,255,0.018) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.018) 1px, transparent 1px)",
    backgroundSize: "48px 48px",
    maskImage:
      "radial-gradient(circle at center, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.65) 45%, rgba(0,0,0,0) 100%)",
    pointerEvents: "none",
  },
  sidebar: {
    position: "sticky",
    top: 0,
    height: "100vh",
    borderRight: "1px solid rgba(255,255,255,0.06)",
    background:
      "linear-gradient(180deg, rgba(7,10,31,0.92) 0%, rgba(4,7,24,0.96) 100%)",
    backdropFilter: "blur(14px)",
    zIndex: 2,
  },
  sidebarInner: {
    display: "flex",
    flexDirection: "column",
    height: "100%",
    padding: 22,
  },
  brandWrap: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    textDecoration: "none",
    color: "#fff",
    marginBottom: 26,
  },
  logoBadge: {
    width: 54,
    height: 54,
    borderRadius: 18,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background:
      "linear-gradient(135deg, rgba(216,92,255,0.20) 0%, rgba(109,124,255,0.20) 48%, rgba(66,215,255,0.22) 100%)",
    border: "1px solid rgba(255,255,255,0.10)",
    boxShadow: "0 18px 50px rgba(0,0,0,0.35)",
    overflow: "hidden",
  },
  logoImage: {
    width: "92%",
    height: "auto",
    objectFit: "contain",
  },
  brandTitle: {
    fontSize: 22,
    fontWeight: 800,
    lineHeight: 1.05,
    letterSpacing: "-0.02em",
  },
  brandSubtitle: {
    marginTop: 4,
    fontSize: 12,
    color: "#93A4E8",
  },
  navSectionLabel: {
    fontSize: 11,
    letterSpacing: "0.18em",
    textTransform: "uppercase",
    color: "#6D7CBB",
    marginBottom: 12,
    paddingLeft: 4,
  },
  nav: {
    display: "grid",
    gap: 8,
  },
  navItem: {
    minHeight: 48,
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "0 14px",
    borderRadius: 16,
    color: "#D5DEFF",
    textDecoration: "none",
    border: "1px solid transparent",
    background: "transparent",
    transition: "all 0.18s ease",
    fontWeight: 600,
  },
  navItemAccent: {
    boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.02)",
  },
  navItemActive: {
    background:
      "linear-gradient(90deg, rgba(22,30,74,0.88) 0%, rgba(16,25,60,0.94) 100%)",
    border: "1px solid rgba(116,135,255,0.24)",
    color: "#FFFFFF",
    boxShadow: "0 12px 30px rgba(0,0,0,0.25)",
  },
  navDot: {
    width: 8,
    height: 8,
    borderRadius: "50%",
    background: "rgba(255,255,255,0.12)",
  },
  navDotActive: {
    background:
      "linear-gradient(135deg, rgba(228,92,255,1) 0%, rgba(66,215,255,1) 100%)",
    boxShadow: "0 0 20px rgba(109,124,255,0.65)",
  },
  sidebarFooter: {
    marginTop: "auto",
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 18,
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.06)",
  },
  sidebarFooterBadge: {
    width: 36,
    height: 36,
    borderRadius: 12,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 800,
    background:
      "linear-gradient(135deg, rgba(228,92,255,0.26) 0%, rgba(66,215,255,0.26) 100%)",
  },
  sidebarFooterTitle: {
    fontSize: 13,
    fontWeight: 700,
  },
  sidebarFooterText: {
    fontSize: 11,
    color: "#90A2E8",
    marginTop: 2,
  },
  contentShell: {
    minWidth: 0,
    position: "relative",
    zIndex: 1,
  },
  topbar: {
    display: "flex",
    justifyContent: "space-between",
    gap: 24,
    alignItems: "flex-start",
    padding: "26px 30px 10px",
  },
  eyebrow: {
    display: "inline-flex",
    alignItems: "center",
    minHeight: 30,
    padding: "0 12px",
    borderRadius: 999,
    border: "1px solid rgba(105,124,255,0.18)",
    background:
      "linear-gradient(90deg, rgba(216,92,255,0.14) 0%, rgba(109,124,255,0.10) 50%, rgba(66,215,255,0.12) 100%)",
    color: "#B6C5FF",
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    marginBottom: 16,
  },
  pageTitle: {
    margin: 0,
    fontSize: 46,
    lineHeight: 0.96,
    letterSpacing: "-0.04em",
    fontWeight: 900,
    background:
      "linear-gradient(90deg, #FFFFFF 0%, #EAE6FF 24%, #B9C6FF 58%, #7DDCFF 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },
  pageSubtitle: {
    marginTop: 12,
    marginBottom: 0,
    color: "#AAB8EF",
    fontSize: 17,
    lineHeight: 1.55,
    maxWidth: 780,
  },
  topbarRight: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
    justifyContent: "flex-end",
  },
  topBadge: {
    minHeight: 40,
    padding: "0 14px",
    borderRadius: 999,
    display: "inline-flex",
    alignItems: "center",
    fontWeight: 700,
    color: "#ECF3FF",
    background:
      "linear-gradient(90deg, rgba(228,92,255,0.22) 0%, rgba(109,124,255,0.18) 50%, rgba(66,215,255,0.20) 100%)",
    border: "1px solid rgba(255,255,255,0.08)",
  },
  userCard: {
    minHeight: 54,
    padding: "0 12px 0 10px",
    borderRadius: 18,
    display: "flex",
    alignItems: "center",
    gap: 10,
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.06)",
  },
  userAvatar: {
    width: 34,
    height: 34,
    borderRadius: 12,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 800,
    background:
      "linear-gradient(135deg, rgba(228,92,255,0.32) 0%, rgba(66,215,255,0.28) 100%)",
  },
  userName: {
    fontWeight: 700,
    fontSize: 14,
  },
  userEmail: {
    fontSize: 12,
    color: "#97A8E7",
    marginTop: 2,
  },
  logoutButton: {
    minHeight: 46,
    borderRadius: 16,
    border: "1px solid rgba(255,255,255,0.10)",
    padding: "0 16px",
    fontWeight: 800,
    cursor: "pointer",
    color: "#fff",
    background: "rgba(255,255,255,0.03)",
  },
  main: {
    padding: "8px 30px 34px",
  },
};