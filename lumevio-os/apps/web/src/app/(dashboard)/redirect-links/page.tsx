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

type RedirectLinkItem = {
  id: string;
  slug: string;
  destinationUrl: string;
  fallbackUrl?: string | null;
  title?: string | null;
  isActive: boolean;
  validFrom?: string | null;
  validTo?: string | null;
  createdAt: string;
  organization: {
    id: string;
    name: string;
    slug: string;
  };
  campaign?: {
    id: string;
    name: string;
    slug: string;
  } | null;
};

type RedirectLinkCreateResponse = {
  success: boolean;
  publicUrl: string;
  link: RedirectLinkItem;
};

export default function RedirectLinksPage() {
  const { isPlatformAdmin } = useAuth();

  const [organizations, setOrganizations] = useState<OrganizationOption[]>([]);
  const [campaigns, setCampaigns] = useState<CampaignOption[]>([]);
  const [links, setLinks] = useState<RedirectLinkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [organizationId, setOrganizationId] = useState("");
  const [campaignId, setCampaignId] = useState("");
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [destinationUrl, setDestinationUrl] = useState("");
  const [fallbackUrl, setFallbackUrl] = useState("");
  const [lastCreatedPublicUrl, setLastCreatedPublicUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function loadPage() {
    try {
      setLoading(true);
      setError(null);

      const linksPromise = apiClient<RedirectLinkItem[]>("/redirect-links");
      const orgsPromise = isPlatformAdmin
        ? apiClient<OrganizationOption[]>("/organizations")
        : Promise.resolve([]);
      const campaignsPromise = isPlatformAdmin
        ? apiClient<CampaignOption[]>("/campaigns")
        : Promise.resolve([]);

      const [linksData, orgs, campaignsData] = await Promise.all([
        linksPromise,
        orgsPromise,
        campaignsPromise,
      ]);

      setLinks(linksData);
      setOrganizations(orgs);
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
    return campaigns.filter((campaign) => campaign.organization.id === organizationId);
  }, [campaigns, organizationId]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    if (!organizationId || !destinationUrl.trim()) {
      setError("Wybierz organizację i podaj destination URL");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      setLastCreatedPublicUrl(null);

      const response = await apiClient<RedirectLinkCreateResponse>("/redirect-links", {
        method: "POST",
        body: JSON.stringify({
          organizationId,
          campaignId: campaignId || undefined,
          title: title.trim() || undefined,
          slug: slug.trim() || undefined,
          destinationUrl: destinationUrl.trim(),
          fallbackUrl: fallbackUrl.trim() || undefined,
        }),
      });

      setLastCreatedPublicUrl(response.publicUrl);
      setLinks((prev) => [response.link, ...prev]);

      setOrganizationId("");
      setCampaignId("");
      setTitle("");
      setSlug("");
      setDestinationUrl("");
      setFallbackUrl("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nie udało się utworzyć linku");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main style={styles.page}>
      <div style={styles.header}>
        <h1 style={styles.title}>Redirect Links</h1>
        <p style={styles.subtitle}>
          Publiczne linki dla kampanii, aktywacji NFC i ścieżek użytkownika.
        </p>
      </div>

      {isPlatformAdmin ? (
        <section style={styles.card}>
          <h2 style={styles.sectionTitle}>Dodaj redirect link</h2>

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
                <option value="">Opcjonalnie wybierz kampanię</option>
                {filteredCampaigns.map((campaign) => (
                  <option key={campaign.id} value={campaign.id}>
                    {campaign.name}
                  </option>
                ))}
              </select>

              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Tytuł linku"
                style={styles.input}
              />

              <input
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="Slug opcjonalny"
                style={styles.input}
              />

              <input
                value={destinationUrl}
                onChange={(e) => setDestinationUrl(e.target.value)}
                placeholder="Destination URL"
                style={styles.input}
              />

              <input
                value={fallbackUrl}
                onChange={(e) => setFallbackUrl(e.target.value)}
                placeholder="Fallback URL opcjonalny"
                style={styles.input}
              />
            </div>

            <div>
              <button type="submit" disabled={submitting} style={styles.button}>
                {submitting ? "Tworzenie..." : "Utwórz redirect link"}
              </button>
            </div>

            {lastCreatedPublicUrl ? (
              <div style={styles.successBox}>
                <div style={styles.successLabel}>Publiczny URL</div>
                <a
                  href={lastCreatedPublicUrl}
                  target="_blank"
                  rel="noreferrer"
                  style={styles.successLink}
                >
                  {lastCreatedPublicUrl}
                </a>
              </div>
            ) : null}

            {error ? <p style={styles.error}>{error}</p> : null}
          </form>
        </section>
      ) : (
        <section style={styles.card}>
          <h2 style={styles.sectionTitle}>Redirect links organizacji</h2>
          <p style={styles.muted}>
            Tylko superadmin może tworzyć nowe linki.
          </p>
        </section>
      )}

      <section style={styles.card}>
        <div style={styles.sectionHeader}>
          <h2 style={styles.sectionTitle}>Lista linków</h2>
          <button onClick={() => void loadPage()} style={styles.secondaryButton}>
            Odśwież
          </button>
        </div>

        {loading ? (
          <p style={styles.muted}>Ładowanie...</p>
        ) : links.length === 0 ? (
          <p style={styles.muted}>Brak linków.</p>
        ) : (
          <div style={styles.list}>
            {links.map((link) => {
              const publicUrl = `http://localhost:3001/r/${link.slug}`;

              return (
                <article key={link.id} style={styles.linkCard}>
                  <div style={styles.linkTop}>
                    <div>
                      <h3 style={styles.linkName}>{link.title || link.slug}</h3>
                      <p style={styles.linkMeta}>
                        {link.organization.name}
                        {link.campaign ? ` · ${link.campaign.name}` : ""}
                      </p>
                    </div>

                    <div style={styles.badges}>
                      <span style={styles.badge}>{link.isActive ? "ACTIVE" : "INACTIVE"}</span>
                    </div>
                  </div>

                  <div style={styles.infoGrid}>
                    <div>
                      <span style={styles.label}>Slug</span>
                      <div style={styles.value}>{link.slug}</div>
                    </div>

                    <div>
                      <span style={styles.label}>Destination</span>
                      <div style={styles.value}>{link.destinationUrl}</div>
                    </div>

                    <div>
                      <span style={styles.label}>Fallback</span>
                      <div style={styles.value}>{link.fallbackUrl || "—"}</div>
                    </div>

                    <div>
                      <span style={styles.label}>Public URL</span>
                      <a href={publicUrl} target="_blank" rel="noreferrer" style={styles.inlineLink}>
                        {publicUrl}
                      </a>
                    </div>
                  </div>
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
  linkCard: {
    background: "#0d1027",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 16,
    padding: 18,
  },
  linkTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 16,
    marginBottom: 14,
  },
  linkName: { margin: 0, fontSize: 20 },
  linkMeta: { margin: "6px 0 0 0", color: "#9ea8d8" },
  badges: { display: "flex", gap: 8 },
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
};