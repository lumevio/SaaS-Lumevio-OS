"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api-client";

type CampaignDetails = {
  id: string;
  name: string;
  slug: string;
  type: string;
  objective?: string | null;
  status: string;
  interactions: number;
  leads: number;
  conversionRate: number;
  createdAt: string;
  updatedAt: string;
  organization: {
    id: string;
    name: string;
    slug: string;
    industry?: string | null;
    plan: string;
    status: string;
  };
  store?: {
    id: string;
    name: string;
    city?: string | null;
    address?: string | null;
    zone?: string | null;
    status: string;
  } | null;
  redirectLinks?: Array<{
    id: string;
    slug: string;
    title?: string | null;
    destinationUrl: string;
    fallbackUrl?: string | null;
    isActive: boolean;
    createdAt: string;
  }>;
  documents?: Array<{
    id: string;
    name: string;
    documentType: string;
    fileUrl?: string | null;
    createdAt: string;
  }>;
  events?: Array<{
    id: string;
    type: string;
    createdAt: string;
    redirectLink?: {
      id: string;
      slug: string;
      title?: string | null;
    } | null;
  }>;
  nfcTags?: Array<{
    id: string;
    uid: string;
    serialNumber?: string | null;
    tagType?: string | null;
    label?: string | null;
    status: string;
    assignedAt?: string | null;
    redirectLink?: {
      id: string;
      slug: string;
      title?: string | null;
    } | null;
  }>;
};

type CampaignSummary = {
  campaignId: string;
  organizationId: string;
  totals: {
    landingViews: number;
    ctaClicks: number;
    formSubmits: number;
    redirectOpens: number;
    ctaRate: number;
    formRate: number;
  };
  latestEvents: Array<{
    id: string;
    type: string;
    createdAt: string;
    sessionId?: string | null;
    redirectLink?: {
      id: string;
      slug: string;
      title?: string | null;
    } | null;
  }>;
};

export default function CampaignDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [campaign, setCampaign] = useState<CampaignDetails | null>(null);
  const [summary, setSummary] = useState<CampaignSummary | null>(null);
  const [campaignId, setCampaignId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadCampaign() {
    try {
      setLoading(true);
      setError(null);

      const resolved = await params;
      setCampaignId(resolved.id);

      const [campaignData, summaryData] = await Promise.all([
        apiClient<CampaignDetails>(`/campaigns/${resolved.id}`),
        apiClient<CampaignSummary>(`/events/summary/campaign/${resolved.id}`),
      ]);

      setCampaign(campaignData);
      setSummary(summaryData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Błąd ładowania kampanii");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadCampaign();
  }, [params]);

  if (loading) {
    return <div style={styles.loading}>Ładowanie kampanii...</div>;
  }

  if (error || !campaign) {
    return (
      <div style={styles.loading}>
        <div>
          <p style={styles.error}>{error || "Nie znaleziono kampanii."}</p>
          <Link href="/campaigns" style={styles.backLink}>
            Wróć do kampanii
          </Link>
        </div>
      </div>
    );
  }

  return (
    <main style={styles.page}>
      <div style={styles.topRow}>
        <div>
          <Link href="/campaigns" style={styles.backLink}>
            ← Wróć do kampanii
          </Link>
          <h1 style={styles.title}>{campaign.name}</h1>
          <p style={styles.subtitle}>
            Szczegóły kampanii, KPI, linki, tagi NFC i aktywność.
          </p>
        </div>

        <div style={styles.badges}>
          <span style={styles.badge}>{campaign.status}</span>
          <span style={styles.badge}>{campaign.type}</span>
        </div>
      </div>

      <section style={styles.kpiGrid}>
        <article style={styles.kpiCard}>
          <div style={styles.kpiLabel}>Landing views</div>
          <div style={styles.kpiValue}>{summary?.totals.landingViews ?? 0}</div>
        </article>

        <article style={styles.kpiCard}>
          <div style={styles.kpiLabel}>CTA clicks</div>
          <div style={styles.kpiValue}>{summary?.totals.ctaClicks ?? 0}</div>
        </article>

        <article style={styles.kpiCard}>
          <div style={styles.kpiLabel}>Form submits</div>
          <div style={styles.kpiValue}>{summary?.totals.formSubmits ?? 0}</div>
        </article>

        <article style={styles.kpiCard}>
          <div style={styles.kpiLabel}>Redirect opens</div>
          <div style={styles.kpiValue}>{summary?.totals.redirectOpens ?? 0}</div>
        </article>

        <article style={styles.kpiCard}>
          <div style={styles.kpiLabel}>CTA rate</div>
          <div style={styles.kpiValue}>{summary?.totals.ctaRate ?? 0}%</div>
        </article>

        <article style={styles.kpiCard}>
          <div style={styles.kpiLabel}>Form rate</div>
          <div style={styles.kpiValue}>{summary?.totals.formRate ?? 0}%</div>
        </article>
      </section>

      <section style={styles.card}>
        <h2 style={styles.sectionTitle}>Dane kampanii</h2>

        <div style={styles.infoGrid}>
          <div>
            <span style={styles.label}>Slug</span>
            <div style={styles.value}>{campaign.slug}</div>
          </div>

          <div>
            <span style={styles.label}>Cel</span>
            <div style={styles.value}>{campaign.objective || "—"}</div>
          </div>

          <div>
            <span style={styles.label}>Organizacja</span>
            <div style={styles.value}>{campaign.organization.name}</div>
          </div>

          <div>
            <span style={styles.label}>Sklep</span>
            <div style={styles.value}>{campaign.store?.name || "—"}</div>
          </div>

          <div>
            <span style={styles.label}>Miasto</span>
            <div style={styles.value}>{campaign.store?.city || "—"}</div>
          </div>

          <div>
            <span style={styles.label}>Utworzono</span>
            <div style={styles.value}>
              {new Date(campaign.createdAt).toLocaleString("pl-PL")}
            </div>
          </div>
        </div>
      </section>

      <section style={styles.gridTwo}>
        <div style={styles.card}>
          <h2 style={styles.sectionTitle}>Redirect links</h2>

          {campaign.redirectLinks?.length ? (
            <div style={styles.stack}>
              {campaign.redirectLinks.map((link) => (
                <article key={link.id} style={styles.itemCard}>
                  <div style={styles.itemTitle}>{link.title || link.slug}</div>
                  <div style={styles.itemMeta}>{link.destinationUrl}</div>
                  <div style={styles.itemMeta}>
                    Status: {link.isActive ? "ACTIVE" : "INACTIVE"}
                  </div>
                  <a
                    href={`http://localhost:3001/r/${link.slug}`}
                    target="_blank"
                    rel="noreferrer"
                    style={styles.inlineLink}
                  >
                    Otwórz publiczny link
                  </a>
                </article>
              ))}
            </div>
          ) : (
            <p style={styles.muted}>Brak redirect linków.</p>
          )}
        </div>

        <div style={styles.card}>
          <h2 style={styles.sectionTitle}>NFC tags</h2>

          {campaign.nfcTags?.length ? (
            <div style={styles.stack}>
              {campaign.nfcTags.map((tag) => (
                <article key={tag.id} style={styles.itemCard}>
                  <div style={styles.itemTitle}>{tag.label || tag.uid}</div>
                  <div style={styles.itemMeta}>
                    {tag.tagType || "—"} · {tag.status}
                  </div>
                  <div style={styles.detailLine}>UID: {tag.uid}</div>
                  <div style={styles.detailLine}>
                    Link: {tag.redirectLink?.slug || "—"}
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <p style={styles.muted}>Brak przypiętych tagów NFC.</p>
          )}
        </div>
      </section>

      <section style={styles.gridTwo}>
        <div style={styles.card}>
          <h2 style={styles.sectionTitle}>Ostatnie eventy kampanii</h2>

          {summary?.latestEvents?.length ? (
            <div style={styles.stack}>
              {summary.latestEvents.map((event) => (
                <article key={event.id} style={styles.itemCard}>
                  <div style={styles.itemTitle}>{event.type}</div>
                  <div style={styles.itemMeta}>
                    {new Date(event.createdAt).toLocaleString("pl-PL")}
                  </div>
                  <div style={styles.detailLine}>
                    Link: {event.redirectLink?.slug || "—"}
                  </div>
                  <div style={styles.detailLine}>
                    Session: {event.sessionId || "—"}
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <p style={styles.muted}>Brak eventów.</p>
          )}
        </div>

        <div style={styles.card}>
          <h2 style={styles.sectionTitle}>Dokumenty</h2>

          {campaign.documents?.length ? (
            <div style={styles.stack}>
              {campaign.documents.map((doc) => (
                <article key={doc.id} style={styles.itemCard}>
                  <div style={styles.itemTitle}>{doc.name}</div>
                  <div style={styles.itemMeta}>{doc.documentType}</div>
                  {doc.fileUrl ? (
                    <a
                      href={doc.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      style={styles.inlineLink}
                    >
                      Otwórz dokument
                    </a>
                  ) : null}
                </article>
              ))}
            </div>
          ) : (
            <p style={styles.muted}>Brak dokumentów.</p>
          )}
        </div>
      </section>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { color: "#fff" },
  loading: {
    minHeight: "50vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#fff",
  },
  topRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 16,
    marginBottom: 24,
  },
  title: { margin: "12px 0 8px 0", fontSize: 32, fontWeight: 800 },
  subtitle: { margin: 0, color: "#9ea8d8" },
  backLink: {
    display: "inline-flex",
    textDecoration: "none",
    color: "#9ab0ff",
    fontWeight: 600,
  },
  badges: { display: "flex", gap: 8, flexWrap: "wrap" },
  badge: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "6px 10px",
    borderRadius: 999,
    background: "rgba(109,124,255,0.14)",
    border: "1px solid rgba(109,124,255,0.35)",
    color: "#d7dcff",
    fontSize: "12px",
    fontWeight: 700,
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
  kpiValue: { fontSize: 34, fontWeight: 800 },
  card: {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
  },
  sectionTitle: { margin: 0, marginBottom: 16, fontSize: 22, fontWeight: 700 },
  infoGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: 16,
  },
  label: {
    display: "block",
    fontSize: 12,
    color: "#92a0d8",
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: "0.04em",
  },
  value: { color: "#fff", wordBreak: "break-word" },
  gridTwo: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
    gap: 24,
  },
  stack: { display: "grid", gap: 12 },
  itemCard: {
    background: "#0d1027",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 14,
    padding: 14,
  },
  itemTitle: { fontWeight: 700, color: "#fff" },
  itemMeta: {
    marginTop: 6,
    color: "#9ea8d8",
    fontSize: 14,
    wordBreak: "break-word",
  },
  detailLine: { marginTop: 8, color: "#c8d1ff", fontSize: 14 },
  inlineLink: {
    marginTop: 8,
    display: "inline-flex",
    color: "#9ab0ff",
    textDecoration: "none",
  },
  muted: { color: "#9ea8d8" },
  error: { color: "#ff8f8f" },
};