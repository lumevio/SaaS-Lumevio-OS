"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { apiClient } from "@/lib/api-client";
import { useAuth } from "@/hooks/use-auth";

type OrganizationOption = {
  id: string;
  name: string;
  slug: string;
};

type CampaignOption = {
  id: string;
  name: string;
  slug: string;
  organization: {
    id: string;
    name: string;
    slug: string;
  };
};

type CampaignPageItem = {
  id: string;
  slug: string;
  title: string;
  templateType: string;
  status: string;
  pageMode?: string;
  externalUrl?: string | null;
  customDomain?: string | null;
  publishedAt?: string | null;
  createdAt: string;
  campaign: {
    id: string;
    name: string;
    slug: string;
  };
  organization: {
    id: string;
    name: string;
    slug: string;
  };
};

type CreatePageResponse = {
  success: boolean;
  publicUrl: string;
  page: CampaignPageItem;
};

export default function CampaignPagesPage() {
  const { isPlatformAdmin } = useAuth();

  const [pageMode, setPageMode] = useState("hosted");
  const [externalUrl, setExternalUrl] = useState("");
  const [organizations, setOrganizations] = useState<OrganizationOption[]>([]);
  const [campaigns, setCampaigns] = useState<CampaignOption[]>([]);
  const [pages, setPages] = useState<CampaignPageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [publishingId, setPublishingId] = useState<string | null>(null);

  const [organizationId, setOrganizationId] = useState("");
  const [campaignId, setCampaignId] = useState("");
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [templateType, setTemplateType] = useState("landing");
  const [heroTitle, setHeroTitle] = useState("");
  const [heroDescription, setHeroDescription] = useState("");
  const [ctaLabel, setCtaLabel] = useState("");
  const [ctaUrl, setCtaUrl] = useState("");
  const [formTitle, setFormTitle] = useState("");
  const [lastPublicUrl, setLastPublicUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function loadPage() {
    try {
      setLoading(true);
      setError(null);

      const pagesPromise = apiClient<CampaignPageItem[]>("/campaign-pages");
      const orgsPromise = isPlatformAdmin
        ? apiClient<OrganizationOption[]>("/organizations")
        : Promise.resolve([]);
      const campaignsPromise = isPlatformAdmin
        ? apiClient<CampaignOption[]>("/campaigns")
        : Promise.resolve([]);

      const [pagesData, orgsData, campaignsData] = await Promise.all([
        pagesPromise,
        orgsPromise,
        campaignsPromise,
      ]);

      setPages(pagesData);
      setOrganizations(orgsData);
      setCampaigns(campaignsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Błąd ładowania danych");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadPage();
  }, [isPlatformAdmin]);

  const filteredCampaigns = useMemo(() => {
    if (!organizationId) return [];
    return campaigns.filter((c) => c.organization.id === organizationId);
  }, [campaigns, organizationId]);

  function getPagePublicUrl(page: CampaignPageItem) {
    if (page.pageMode === "external_redirect") {
      return `http://localhost:3001/api/public/page/${page.slug}`;
    }

    return `http://localhost:3002/${page.slug}`;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    if (!organizationId || !campaignId || !title.trim()) {
      setError("Wybierz organizację, kampanię i podaj tytuł strony");
      return;
    }

    if (pageMode === "external_redirect" && !externalUrl.trim()) {
      setError("Dla trybu redirect podaj zewnętrzny URL klienta");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      setLastPublicUrl(null);

      const response = await apiClient<CreatePageResponse>("/campaign-pages", {
        method: "POST",
        body: JSON.stringify({
          organizationId,
          campaignId,
          title: title.trim(),
          slug: slug.trim() || undefined,
          templateType,
          pageMode,
          externalUrl:
            pageMode === "external_redirect"
              ? externalUrl.trim() || undefined
              : undefined,
          jsonConfig: {
            heroTitle:
              pageMode === "hosted" ? heroTitle.trim() || undefined : undefined,
            heroDescription:
              pageMode === "hosted"
                ? heroDescription.trim() || undefined
                : undefined,
            ctaLabel:
              pageMode === "hosted" ? ctaLabel.trim() || undefined : undefined,
            ctaUrl:
              pageMode === "hosted" ? ctaUrl.trim() || undefined : undefined,
            formTitle:
              pageMode === "hosted" ? formTitle.trim() || undefined : undefined,
          },
        }),
      });

      setPages((prev) => [response.page, ...prev]);
      setLastPublicUrl(response.publicUrl);

      setOrganizationId("");
      setCampaignId("");
      setTitle("");
      setSlug("");
      setTemplateType("landing");
      setPageMode("hosted");
      setExternalUrl("");
      setHeroTitle("");
      setHeroDescription("");
      setCtaLabel("");
      setCtaUrl("");
      setFormTitle("");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Nie udało się utworzyć strony"
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handlePublish(id: string) {
    try {
      setPublishingId(id);
      setError(null);

      await apiClient(`/campaign-pages/${id}/publish`, {
        method: "PATCH",
      });

      await loadPage();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Nie udało się opublikować strony"
      );
    } finally {
      setPublishingId(null);
    }
  }

  return (
    <main style={styles.page}>
      <div style={styles.header}>
        <h1 style={styles.title}>Campaign Pages</h1>
        <p style={styles.subtitle}>
          Tworzysz publiczne landing page kampanii pod LUMEVIO GO albo redirect
          do zewnętrznej strony klienta.
        </p>
      </div>

      {isPlatformAdmin ? (
        <section style={styles.card}>
          <h2 style={styles.sectionTitle}>Dodaj stronę kampanii</h2>

          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.grid}>
              <select
                value={organizationId}
                onChange={(e) => {
                  setOrganizationId(e.target.value);
                  setCampaignId("");
                }}
                style={styles.input}
              >
                <option value="">Wybierz organizację</option>
                {organizations.map((org) => (
                  <option key={org.id} value={org.id}>
                    {org.name}
                  </option>
                ))}
              </select>

              <select
                value={campaignId}
                onChange={(e) => setCampaignId(e.target.value)}
                style={styles.input}
                disabled={!organizationId}
              >
                <option value="">Wybierz kampanię</option>
                {filteredCampaigns.map((campaign) => (
                  <option key={campaign.id} value={campaign.id}>
                    {campaign.name}
                  </option>
                ))}
              </select>

              <select
                value={pageMode}
                onChange={(e) => setPageMode(e.target.value)}
                style={styles.input}
              >
                <option value="hosted">Hosted by LUMEVIO</option>
                <option value="external_redirect">
                  Redirect to client page
                </option>
              </select>

              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Tytuł strony"
                style={styles.input}
              />

              <input
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="Slug opcjonalny"
                style={styles.input}
              />

              <select
                value={templateType}
                onChange={(e) => setTemplateType(e.target.value)}
                style={styles.input}
                disabled={pageMode === "external_redirect"}
              >
                <option value="landing">Landing</option>
                <option value="contest">Contest</option>
                <option value="coupon">Coupon</option>
                <option value="quiz">Quiz</option>
              </select>

              <input
                value={externalUrl}
                onChange={(e) => setExternalUrl(e.target.value)}
                placeholder="External URL klienta"
                style={styles.input}
                disabled={pageMode !== "external_redirect"}
              />

              <input
                value={heroTitle}
                onChange={(e) => setHeroTitle(e.target.value)}
                placeholder="Hero title"
                style={styles.input}
                disabled={pageMode !== "hosted"}
              />

              <input
                value={heroDescription}
                onChange={(e) => setHeroDescription(e.target.value)}
                placeholder="Hero description"
                style={styles.input}
                disabled={pageMode !== "hosted"}
              />

              <input
                value={ctaLabel}
                onChange={(e) => setCtaLabel(e.target.value)}
                placeholder="CTA label"
                style={styles.input}
                disabled={pageMode !== "hosted"}
              />

              <input
                value={ctaUrl}
                onChange={(e) => setCtaUrl(e.target.value)}
                placeholder="CTA URL"
                style={styles.input}
                disabled={pageMode !== "hosted"}
              />

              <input
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="Form title"
                style={styles.input}
                disabled={pageMode !== "hosted"}
              />
            </div>

            <div>
              <button type="submit" disabled={submitting} style={styles.button}>
                {submitting ? "Tworzenie..." : "Utwórz stronę"}
              </button>
            </div>

            {lastPublicUrl ? (
              <div style={styles.successBox}>
                <div style={styles.successLabel}>Publiczny URL</div>
                <a
                  href={lastPublicUrl}
                  target="_blank"
                  rel="noreferrer"
                  style={styles.successLink}
                >
                  {lastPublicUrl}
                </a>
              </div>
            ) : null}

            {error ? <p style={styles.error}>{error}</p> : null}
          </form>
        </section>
      ) : (
        <section style={styles.card}>
          <h2 style={styles.sectionTitle}>Strony kampanii</h2>
          <p style={styles.muted}>
            Tylko superadmin może tworzyć i publikować strony.
          </p>
        </section>
      )}

      <section style={styles.card}>
        <div style={styles.sectionHeader}>
          <h2 style={styles.sectionTitle}>Lista stron</h2>
          <button onClick={() => void loadPage()} style={styles.secondaryButton}>
            Odśwież
          </button>
        </div>

        {loading ? (
          <p style={styles.muted}>Ładowanie...</p>
        ) : pages.length === 0 ? (
          <p style={styles.muted}>Brak stron kampanii.</p>
        ) : (
          <div style={styles.list}>
            {pages.map((page) => {
              const publicUrl = getPagePublicUrl(page);

              return (
                <article key={page.id} style={styles.pageCard}>
                  <div style={styles.pageTop}>
                    <div>
                      <h3 style={styles.pageName}>{page.title}</h3>
                      <p style={styles.pageMeta}>
                        {page.organization.name} · {page.campaign.name}
                      </p>
                    </div>

                    <div style={styles.badges}>
                      <span style={styles.badge}>{page.status}</span>
                      <span style={styles.badge}>{page.templateType}</span>
                      <span style={styles.badge}>
                        {page.pageMode === "external_redirect"
                          ? "redirect"
                          : "hosted"}
                      </span>
                    </div>
                  </div>

                  <div style={styles.infoGrid}>
                    <div>
                      <span style={styles.label}>Slug</span>
                      <div style={styles.value}>{page.slug}</div>
                    </div>

                    <div>
                      <span style={styles.label}>Tryb</span>
                      <div style={styles.value}>
                        {page.pageMode === "external_redirect"
                          ? "Redirect do strony klienta"
                          : "Hosted by LUMEVIO"}
                      </div>
                    </div>

                    <div>
                      <span style={styles.label}>Public URL</span>
                      <a
                        href={publicUrl}
                        target="_blank"
                        rel="noreferrer"
                        style={styles.inlineLink}
                      >
                        {publicUrl}
                      </a>
                    </div>

                    <div>
                      <span style={styles.label}>Published</span>
                      <div style={styles.value}>
                        {page.publishedAt
                          ? new Date(page.publishedAt).toLocaleString("pl-PL")
                          : "—"}
                      </div>
                    </div>

                    <div>
                      <span style={styles.label}>External URL</span>
                      <div style={styles.value}>
                        {page.externalUrl || "—"}
                      </div>
                    </div>
                  </div>

                  {isPlatformAdmin ? (
                    <div style={styles.actions}>
                      <button
                        onClick={() => void handlePublish(page.id)}
                        disabled={
                          publishingId === page.id ||
                          page.status === "published"
                        }
                        style={styles.publishButton}
                      >
                        {page.status === "published"
                          ? "Opublikowano"
                          : publishingId === page.id
                          ? "Publikacja..."
                          : "Publikuj"}
                      </button>
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { color: "#fff" },
  header: { marginBottom: 24 },
  title: { margin: 0, fontSize: 32, fontWeight: 800 },
  subtitle: { marginTop: 8, color: "#9ea8d8" },
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
  form: { display: "grid", gap: 16 },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: 16,
  },
  input: {
    height: 48,
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "#0d1027",
    color: "#fff",
    padding: "0 14px",
    outline: "none",
  },
  button: {
    height: 46,
    borderRadius: 14,
    border: "none",
    padding: "0 18px",
    fontWeight: 700,
    cursor: "pointer",
    background: "#6d7cff",
    color: "#fff",
  },
  publishButton: {
    height: 42,
    borderRadius: 12,
    border: "none",
    padding: "0 14px",
    fontWeight: 700,
    cursor: "pointer",
    background: "#6d7cff",
    color: "#fff",
  },
  secondaryButton: {
    height: 40,
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.1)",
    padding: "0 14px",
    fontWeight: 600,
    cursor: "pointer",
    background: "transparent",
    color: "#fff",
  },
  successBox: {
    background: "rgba(80,200,120,0.08)",
    border: "1px solid rgba(80,200,120,0.24)",
    borderRadius: 14,
    padding: 14,
  },
  successLabel: {
    fontSize: 12,
    color: "#98e2ae",
    marginBottom: 8,
    textTransform: "uppercase",
  },
  successLink: {
    color: "#fff",
    textDecoration: "none",
    wordBreak: "break-word",
  },
  error: { margin: 0, color: "#ff8f8f" },
  muted: { color: "#9ea8d8" },
  list: { display: "grid", gap: 16 },
  pageCard: {
    background: "#0d1027",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 16,
    padding: 18,
  },
  pageTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 16,
    marginBottom: 14,
  },
  pageName: { margin: 0, fontSize: 20 },
  pageMeta: { margin: "6px 0 0 0", color: "#9ea8d8" },
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
  infoGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
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
  inlineLink: {
    color: "#9ab0ff",
    textDecoration: "none",
    wordBreak: "break-word",
  },
  actions: {
    marginTop: 14,
    paddingTop: 12,
    borderTop: "1px solid rgba(255,255,255,0.08)",
  },
};