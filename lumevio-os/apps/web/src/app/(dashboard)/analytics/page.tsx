"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api-client";

type EventItem = {
  id: string;
  type: string;
  createdAt: string;
  sessionId?: string | null;
  payload?: Record<string, unknown> | null;
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
};

type SummaryResponse = {
  totals: {
    landingViews: number;
    ctaClicks: number;
    formSubmits: number;
    redirectOpens: number;
    ctaRate: number;
    formRate: number;
  };
  recentEvents: EventItem[];
};

export default function AnalyticsPage() {
  const [summary, setSummary] = useState<SummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadAnalytics() {
    try {
      setLoading(true);
      setError(null);

      const data = await apiClient<SummaryResponse>("/events/summary");
      setSummary(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Błąd ładowania analityki");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadAnalytics();
  }, []);

  return (
    <main style={styles.page}>
      <div style={styles.header}>
        <h1 style={styles.title}>Analityka</h1>
        <p style={styles.subtitle}>
          Lejek kampanii: wejścia, CTA, formularze, redirecty i ostatnie eventy.
        </p>
      </div>

      {loading ? (
        <section style={styles.card}>
          <p style={styles.muted}>Ładowanie...</p>
        </section>
      ) : error ? (
        <section style={styles.card}>
          <p style={styles.error}>{error}</p>
        </section>
      ) : summary ? (
        <>
          <section style={styles.kpiGrid}>
            <article style={styles.kpiCard}>
              <div style={styles.kpiLabel}>Landing views</div>
              <div style={styles.kpiValue}>{summary.totals.landingViews}</div>
            </article>

            <article style={styles.kpiCard}>
              <div style={styles.kpiLabel}>CTA clicks</div>
              <div style={styles.kpiValue}>{summary.totals.ctaClicks}</div>
            </article>

            <article style={styles.kpiCard}>
              <div style={styles.kpiLabel}>Form submits</div>
              <div style={styles.kpiValue}>{summary.totals.formSubmits}</div>
            </article>

            <article style={styles.kpiCard}>
              <div style={styles.kpiLabel}>Redirect opens</div>
              <div style={styles.kpiValue}>{summary.totals.redirectOpens}</div>
            </article>

            <article style={styles.kpiCard}>
              <div style={styles.kpiLabel}>CTA rate</div>
              <div style={styles.kpiValue}>{summary.totals.ctaRate}%</div>
            </article>

            <article style={styles.kpiCard}>
              <div style={styles.kpiLabel}>Form rate</div>
              <div style={styles.kpiValue}>{summary.totals.formRate}%</div>
            </article>
          </section>

          <section style={styles.card}>
            <div style={styles.sectionHeader}>
              <h2 style={styles.sectionTitle}>Ostatnie eventy</h2>
              <button onClick={() => void loadAnalytics()} style={styles.button}>
                Odśwież
              </button>
            </div>

            {summary.recentEvents.length === 0 ? (
              <p style={styles.muted}>Brak eventów.</p>
            ) : (
              <div style={styles.list}>
                {summary.recentEvents.map((event) => (
                  <article key={event.id} style={styles.item}>
                    <div style={styles.itemTop}>
                      <strong>{event.type}</strong>
                      <span>{new Date(event.createdAt).toLocaleString("pl-PL")}</span>
                    </div>

                    <div style={styles.meta}>
                      <div>Organizacja: {event.organization?.name || "—"}</div>
                      <div>Kampania: {event.campaign?.name || "—"}</div>
                      <div>Link: {event.redirectLink?.slug || "—"}</div>
                      <div>Session: {event.sessionId || "—"}</div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </>
      ) : null}
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { color: "#fff" },
  header: { marginBottom: 24 },
  title: { margin: 0, fontSize: 32, fontWeight: 800 },
  subtitle: { marginTop: 8, color: "#9ea8d8" },
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
  kpiValue: { fontSize: 34, fontWeight: 800 },
  card: {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
  },
  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 16,
    marginBottom: 16,
  },
  sectionTitle: { margin: 0, fontSize: 22, fontWeight: 700 },
  button: {
    height: 40,
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.1)",
    padding: "0 14px",
    fontWeight: 600,
    cursor: "pointer",
    background: "transparent",
    color: "#fff",
  },
  list: { display: "grid", gap: 12 },
  item: {
    background: "#0d1027",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 14,
    padding: 14,
  },
  itemTop: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 8,
  },
  meta: {
    color: "#9ea8d8",
    display: "grid",
    gap: 4,
  },
  muted: { color: "#9ea8d8" },
  error: { color: "#ff8f8f" },
};