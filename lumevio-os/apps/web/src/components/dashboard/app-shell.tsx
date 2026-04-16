"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

type AppShellProps = {
  children: ReactNode;
};

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/organizations", label: "Organizacje" },
  { href: "/stores", label: "Sklepy" },
  { href: "/campaigns", label: "Kampanie" },
  { href: "/redirect-links", label: "Redirect Links" },
  { href: "/nfc-tags", label: "NFC Tags" },
  { href: "/campaign-pages", label: "Campaign Pages" },
  { href: "/analytics", label: "Analityka" },
  { href: "/documents", label: "Dokumenty" },
  { href: "/drive", label: "Drive" },
  { href: "/settings", label: "Ustawienia" },
];

function isActive(pathname: string, href: string) {
  if (href === "/dashboard") {
    return pathname === "/" || pathname === "/dashboard";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

function formatSegment(segment: string) {
  return decodeURIComponent(segment)
    .replace(/-/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function buildBreadcrumb(pathname: string) {
  const clean = pathname.replace(/^\/+/, "");
  if (!clean) return ["Strona główna", "Dashboard"];

  const parts = clean.split("/").filter(Boolean);
  return ["Strona główna", ...parts.map(formatSegment)];
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname() || "/dashboard";
  const breadcrumbs = buildBreadcrumb(pathname);

  return (
    <div className="lv-app">
      <aside className="lv-sidebar">
        <div className="lv-brand">
          <div className="lv-brand-mark">
            <img
              src="/lumevio-logo.png"
              alt="LUMEVIO"
              className="lv-brand-logo"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
            <span className="lv-brand-fallback">L</span>
          </div>

          <div>
            <div className="lv-brand-title">LUMEVIO OS</div>
            <div className="lv-brand-subtitle">Phygital Operating System</div>
          </div>
        </div>

        <div className="lv-sidebar-section">Główne moduły</div>

        <nav className="lv-nav">
          {NAV_ITEMS.map((item) => {
            const active = isActive(pathname, item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`lv-nav-item ${active ? "is-active" : ""}`}
              >
                <span className="lv-nav-dot" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="lv-sidebar-footer">
          <div className="lv-enterprise-card">
            <div className="lv-enterprise-mark">L</div>
            <div>
              <div className="lv-enterprise-title">LUMEVIO Enterprise</div>
              <div className="lv-enterprise-subtitle">Offline growth infrastructure</div>
            </div>
          </div>
        </div>
      </aside>

      <div className="lv-main">
        <header className="lv-topbar">
          <div className="lv-breadcrumbs">
            {breadcrumbs.map((item, index) => (
              <span key={`${item}-${index}`}>
                {index > 0 ? <span className="lv-breadcrumb-sep">/</span> : null}
                <span className={index === breadcrumbs.length - 1 ? "is-current" : ""}>
                  {item}
                </span>
              </span>
            ))}
          </div>

          <div className="lv-topbar-right">
            <div className="lv-badge-pill">Enterprise-ready</div>

            <div className="lv-user-chip">
              <div className="lv-user-avatar">P</div>
              <div>
                <div className="lv-user-name">Przemek Admin</div>
                <div className="lv-user-email">admin@lumevio.pl</div>
              </div>
            </div>

            <button type="button" className="lv-ghost-button">
              Wyloguj
            </button>
          </div>
        </header>

        <main className="lv-content">
          <div className="lv-content-glow lv-content-glow-a" />
          <div className="lv-content-glow lv-content-glow-b" />
          {children}
        </main>
      </div>
    </div>
  );
}