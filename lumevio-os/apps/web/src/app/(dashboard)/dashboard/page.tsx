"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiClient } from "@/lib/api-client";

type DashboardOverview = {
  kpis: {
    organizationsCount: number;
    usersCount: number;
    storesCount: number;
    campaignsCount: number;
    redirectLinksCount: number;
    eventsCount: number;
  };
  latestOrganizations: Array<{
    id: string;
    name: string;
    slug: string;
    status: string;
    plan: string;
    createdAt: string;
    rootFolderUrl?: string | null;
  }>;
  latestEvents: Array<{
    id: string;
    type: string;
    createdAt: string;
    organization?: {
      id: string;
      name: string;
      slug: string;
    } | null;
    campaign?: {
      id: string;
      name: string;
      slug: string;
    } | null;
    redirectLink?: {
      id: string;
      slug: string;
      title?: string | null;
    } | null;
  }>;
};

export default function DashboardPage() {
  const [data, setData] = useState<DashboardOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadDashboard() {
    try {
      setLoading(true);
      setError(null);

      const response = await apiClient<DashboardOverview>("/dashboard/overview");
      setData(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Błąd ładowania dashboardu");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadDashboard();
  }, []);

  if (loading) {
    return <div style={styles.loading}>Ładowanie dashboardu...</div>;
  }

  if (error || !data) {
    return (
      <div style={styles.loading}>
        <div>
          <p style={styles.error}>{error || "Nie udało się załadować danych."}</p>
          <button onClick={() => void loadDashboard()} style={styles.retryButton}>
            Spróbuj ponownie
          </button>
        </div>
      </div>
    );
  }

  const { kpis, latestOrganizations, latestEvents } = data;

  return (
    <main style={styles.page}>
      <div style={styles.header}>
        <h1 style={styles.title}>Dashboard</h1>
        <p style={styles.subtitle}>
          Przegląd systemu LUMEVIO OS: klienci, operacje, linki i eventy.
        </p>
      </div>

      <section style={styles.kpiGrid}>
        <article style={styles.kpiCard}>
          <div style={styles.kpiLabel}>Organizacje</div>
          <div style={styles.kpiValue}>{kpis.organizationsCount}</div>
        </article>

        <article style={styles.kpiCard}>
          <div style={styles.kpiLabel}>Użytkownicy</div>
          <div style={styles.kpiValue}>{kpis.usersCount}</div>
        </article>

        <article style={styles.kpiCard}>
          <div style={styles.kpiLabel}>Sklepy</div>
          <div style={styles.kpiValue}>{kpis.storesCount}</div>
        </article>

        <article style={styles.kpiCard}>
          <div style={styles.kpiLabel}>Kampanie</div>
          <div style={styles.kpiValue}>{kpis.campaignsCount}</div>
        </article>

        <article style={styles.kpiCard}>
          <div style={styles.kpiLabel}>Redirect Links</div>
          <div style={styles.kpiValue}>{kpis.redirectLinksCount}</div>
        </article>

        <article style={styles.kpiCard}>
          <div style={styles.kpiLabel}>Eventy</div>
          <div style={styles.kpiValue}>{kpis.eventsCount}</div>
        </article>
      </section>

      <section style={styles.gridTwo}>
        <div style={styles.card}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>Najnowsze organizacje</h2>
            <Link href="/organizations" style={styles.linkButton}>
              Zobacz wszystkie
            </Link>
          </div>

          {latestOrganizations.length === 0 ? (
            <p style={styles.muted}>Brak organizacji.</p>
          ) : (
            <div style={styles.stack}>
              {latestOrganizations.map((org) => (
                <article key={org.id} style={styles.itemCard}>
                  <div style={styles.itemTop}>
                    <div>
                      <div style={styles.itemTitle}>{org.name}</div>
                      <div style={styles.itemMeta}>
                        {org.slug} · {org.status} · {org.plan}
                      </div>
                    </div>

                    <Link href={`/organizations/${org.id}`} style={styles.inlineLink}>
                      Szczegóły
                    </Link>
                  </div>

                  {org.rootFolderUrl ? (
                    <a
                      href={org.rootFolderUrl}
                      target="_blank"
                      rel="noreferrer"
                      style={styles.driveLink}
                    >
                      Otwórz folder Drive
                    </a>
                  ) : null}
                </article>
              ))}
            </div>
          )}
        </div>

        <div style={styles.card}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>Najnowsze eventy</h2>
            <Link href="/analytics" style={styles.linkButton}>
              Zobacz analitykę
            </Link>
          </div>

          {latestEvents.length === 0 ? (
            <p style={styles.muted}>Brak eventów.</p>
          ) : (
            <div style={styles.stack}>
              {latestEvents.map((event) => (
                <article key={event.id} style={styles.itemCard}>
                  <div style={styles.itemTitle}>{event.type}</div>
                  <div style={styles.itemMeta}>
                    {new Date(event.createdAt).toLocaleString("pl-PL")}
                  </div>
                  <div style={styles.detailLine}>
                    Organizacja: {event.organization?.name || "—"}
                  </div>
                  <div style={styles.detailLine}>
                    Kampania: {event.campaign?.name || "—"}
                  </div>
                  <div style={styles.detailLine}>
                    Link: {event.redirectLink?.slug || "—"}
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    color: "#fff",
  },
  loading: {
    minHeight: "50vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#fff",
  },
  header: {
    marginBottom: 24,
  },
  title: {
    margin: 0,
    fontSize: 32,
    fontWeight: 800,
  },
  subtitle: {
    marginTop: 8,
    color: "#9ea8d8",
  },
  kpiGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: 18,
    marginBottom: 24,
  },
  kpiCard: {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 20,
    padding: 20,
  },
  kpiLabel: {
    color: "#96a2d8",
    fontSize: 13,
    textTransform: "uppercase",
    letterSpacing: "0.04em",
    marginBottom: 10,
  },
  kpiValue: {
    fontSize: 34,
    fontWeight: 800,
  },
  gridTwo: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
    gap: 24,
  },
  card: {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 20,
    padding: 24,
  },
  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    margin: 0,
    fontSize: 22,
    fontWeight: 700,
  },
  linkButton: {
    display: "inline-flex",
    textDecoration: "none",
    background: "#1b2249",
    border: "1px solid rgba(255,255,255,0.1)",
    color: "#fff",
    padding: "10px 14px",
    borderRadius: "12px",
    fontWeight: 600,
  },
  stack: {
    display: "grid",
    gap: 12,
  },
  itemCard: {
    background: "#0d1027",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 14,
    padding: 14,
  },
  itemTop: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    alignItems: "flex-start",
  },
  itemTitle: {
    fontWeight: 700,
    color: "#fff",
  },
  itemMeta: {
    marginTop: 6,
    color: "#9ea8d8",
    fontSize: 14,
  },
  detailLine: {
    marginTop: 8,
    color: "#c8d1ff",
    fontSize: 14,
  },
  inlineLink: {
    color: "#9ab0ff",
    textDecoration: "none",
    fontWeight: 600,
  },
  driveLink: {
    marginTop: 10,
    display: "inline-flex",
    color: "#9ab0ff",
    textDecoration: "none",
  },
  muted: {
    color: "#9ea8d8",
  },
  error: {
    color: "#ff8f8f",
    marginBottom: 12,
  },
  retryButton: {
    height: 42,
    borderRadius: 12,
    border: "none",
    background: "#6d7cff",
    color: "#fff",
    padding: "0 14px",
    fontWeight: 700,
    cursor: "pointer",
  },
};