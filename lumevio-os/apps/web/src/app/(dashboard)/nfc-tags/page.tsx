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

type RedirectLinkOption = {
  id: string;
  slug: string;
  title?: string | null;
  destinationUrl: string;
  organization: {
    id: string;
    name: string;
    slug: string;
  };
};

type NfcTagItem = {
  id: string;
  uid: string;
  serialNumber?: string | null;
  tagType?: string | null;
  label?: string | null;
  status: string;
  assignedAt?: string | null;
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
  redirectLink?: {
    id: string;
    slug: string;
    title?: string | null;
    destinationUrl: string;
  } | null;
};

export default function NfcTagsPage() {
  const { isPlatformAdmin } = useAuth();

  const [organizations, setOrganizations] = useState<OrganizationOption[]>([]);
  const [campaigns, setCampaigns] = useState<CampaignOption[]>([]);
  const [redirectLinks, setRedirectLinks] = useState<RedirectLinkOption[]>([]);
  const [tags, setTags] = useState<NfcTagItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [organizationId, setOrganizationId] = useState("");
  const [campaignId, setCampaignId] = useState("");
  const [redirectLinkId, setRedirectLinkId] = useState("");
  const [uid, setUid] = useState("");
  const [serialNumber, setSerialNumber] = useState("");
  const [tagType, setTagType] = useState("NTAG213");
  const [label, setLabel] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function loadPage() {
    try {
      setLoading(true);
      setError(null);

      const tagsPromise = apiClient<NfcTagItem[]>("/nfc-tags");
      const orgsPromise = isPlatformAdmin
        ? apiClient<OrganizationOption[]>("/organizations")
        : Promise.resolve([]);
      const campaignsPromise = isPlatformAdmin
        ? apiClient<CampaignOption[]>("/campaigns")
        : Promise.resolve([]);
      const linksPromise = isPlatformAdmin
        ? apiClient<RedirectLinkOption[]>("/redirect-links")
        : Promise.resolve([]);

      const [tagsData, orgs, campaignsData, linksData] = await Promise.all([
        tagsPromise,
        orgsPromise,
        campaignsPromise,
        linksPromise,
      ]);

      setTags(tagsData);
      setOrganizations(orgs);
      setCampaigns(campaignsData);
      setRedirectLinks(linksData);
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
    return campaigns.filter((item) => item.organization.id === organizationId);
  }, [campaigns, organizationId]);

  const filteredRedirectLinks = useMemo(() => {
    if (!organizationId) return [];
    return redirectLinks.filter((item) => item.organization.id === organizationId);
  }, [redirectLinks, organizationId]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    if (!organizationId || !uid.trim()) {
      setError("Wybierz organizację i podaj UID tagu");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      await apiClient("/nfc-tags", {
        method: "POST",
        body: JSON.stringify({
          organizationId,
          campaignId: campaignId || undefined,
          redirectLinkId: redirectLinkId || undefined,
          uid: uid.trim(),
          serialNumber: serialNumber.trim() || undefined,
          tagType: tagType.trim() || undefined,
          label: label.trim() || undefined,
        }),
      });

      setOrganizationId("");
      setCampaignId("");
      setRedirectLinkId("");
      setUid("");
      setSerialNumber("");
      setTagType("NTAG213");
      setLabel("");

      await loadPage();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nie udało się utworzyć tagu");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main style={styles.page}>
      <div style={styles.header}>
        <h1 style={styles.title}>NFC Tags</h1>
        <p style={styles.subtitle}>
          Łączysz fizyczne tagi z kampaniami i redirect linkami.
        </p>
      </div>

      {isPlatformAdmin ? (
        <section style={styles.card}>
          <h2 style={styles.sectionTitle}>Dodaj tag NFC</h2>

          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.grid}>
              <select
                value={organizationId}
                onChange={(e) => {
                  setOrganizationId(e.target.value);
                  setCampaignId("");
                  setRedirectLinkId("");
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

              <select
                value={redirectLinkId}
                onChange={(e) => setRedirectLinkId(e.target.value)}
                style={styles.input}
                disabled={!organizationId}
              >
                <option value="">Opcjonalnie wybierz redirect link</option>
                {filteredRedirectLinks.map((link) => (
                  <option key={link.id} value={link.id}>
                    {link.title || link.slug}
                  </option>
                ))}
              </select>

              <input
                value={uid}
                onChange={(e) => setUid(e.target.value)}
                placeholder="UID tagu"
                style={styles.input}
              />

              <input
                value={serialNumber}
                onChange={(e) => setSerialNumber(e.target.value)}
                placeholder="Serial number"
                style={styles.input}
              />

              <input
                value={tagType}
                onChange={(e) => setTagType(e.target.value)}
                placeholder="Typ tagu"
                style={styles.input}
              />

              <input
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="Etykieta / opis"
                style={styles.input}
              />
            </div>

            <div>
              <button type="submit" disabled={submitting} style={styles.button}>
                {submitting ? "Tworzenie..." : "Utwórz tag NFC"}
              </button>
            </div>

            {error ? <p style={styles.error}>{error}</p> : null}
          </form>
        </section>
      ) : (
        <section style={styles.card}>
          <h2 style={styles.sectionTitle}>Tagi NFC organizacji</h2>
          <p style={styles.muted}>
            Tylko superadmin może dodawać nowe tagi NFC.
          </p>
        </section>
      )}

      <section style={styles.card}>
        <div style={styles.sectionHeader}>
          <h2 style={styles.sectionTitle}>Lista tagów</h2>
          <button onClick={() => void loadPage()} style={styles.secondaryButton}>
            Odśwież
          </button>
        </div>

        {loading ? (
          <p style={styles.muted}>Ładowanie...</p>
        ) : tags.length === 0 ? (
          <p style={styles.muted}>Brak tagów.</p>
        ) : (
          <div style={styles.list}>
            {tags.map((tag) => (
              <article key={tag.id} style={styles.tagCard}>
                <div style={styles.tagTop}>
                  <div>
                    <h3 style={styles.tagName}>{tag.label || tag.uid}</h3>
                    <p style={styles.tagMeta}>{tag.organization.name}</p>
                  </div>

                  <div style={styles.badges}>
                    <span style={styles.badge}>{tag.status}</span>
                    {tag.tagType ? <span style={styles.badge}>{tag.tagType}</span> : null}
                  </div>
                </div>

                <div style={styles.infoGrid}>
                  <div>
                    <span style={styles.label}>UID</span>
                    <div style={styles.value}>{tag.uid}</div>
                  </div>

                  <div>
                    <span style={styles.label}>Serial</span>
                    <div style={styles.value}>{tag.serialNumber || "—"}</div>
                  </div>

                  <div>
                    <span style={styles.label}>Kampania</span>
                    <div style={styles.value}>{tag.campaign?.name || "—"}</div>
                  </div>

                  <div>
                    <span style={styles.label}>Redirect link</span>
                    <div style={styles.value}>{tag.redirectLink?.slug || "—"}</div>
                  </div>
                </div>
              </article>
            ))}
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
  error: { margin: 0, color: "#ff8f8f" },
  muted: { color: "#9ea8d8" },
  list: { display: "grid", gap: 16 },
  tagCard: {
    background: "#0d1027",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 16,
    padding: 18,
  },
  tagTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 16,
    marginBottom: 14,
  },
  tagName: { margin: 0, fontSize: 20 },
  tagMeta: { margin: "6px 0 0 0", color: "#9ea8d8" },
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
};