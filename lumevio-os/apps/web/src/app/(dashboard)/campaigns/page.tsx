"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { apiClient } from "@/lib/api-client";
import { useAuth } from "@/hooks/use-auth";

type OrganizationOption = {
  id: string;
  name: string;
  slug: string;
};

type StoreOption = {
  id: string;
  name: string;
  city?: string | null;
  organization: {
    id: string;
    name: string;
    slug: string;
  };
};

type CampaignItem = {
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
  organization: {
    id: string;
    name: string;
    slug: string;
  };
  store?: {
    id: string;
    name: string;
    city?: string | null;
  } | null;
};

export default function CampaignsPage() {
  const { isPlatformAdmin } = useAuth();

  const [organizations, setOrganizations] = useState<OrganizationOption[]>([]);
  const [stores, setStores] = useState<StoreOption[]>([]);
  const [campaigns, setCampaigns] = useState<CampaignItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [organizationId, setOrganizationId] = useState("");
  const [storeId, setStoreId] = useState("");
  const [name, setName] = useState("");
  const [type, setType] = useState("NFC Promo");
  const [objective, setObjective] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function loadPage() {
    try {
      setLoading(true);
      setError(null);

      const campaignsPromise = apiClient<CampaignItem[]>("/campaigns");
      const orgsPromise = isPlatformAdmin
        ? apiClient<OrganizationOption[]>("/organizations")
        : Promise.resolve([]);
      const storesPromise = isPlatformAdmin
        ? apiClient<StoreOption[]>("/stores")
        : Promise.resolve([]);

      const [campaignsData, orgs, storesData] = await Promise.all([
        campaignsPromise,
        orgsPromise,
        storesPromise,
      ]);

      setCampaigns(campaignsData);
      setOrganizations(orgs);
      setStores(storesData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Błąd ładowania danych");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadPage();
  }, [isPlatformAdmin]);

  const filteredStores = useMemo(() => {
    if (!organizationId) return [];
    return stores.filter((store) => store.organization.id === organizationId);
  }, [stores, organizationId]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    if (!organizationId || !name.trim() || !type.trim()) {
      setError("Wybierz organizację i podaj nazwę oraz typ kampanii");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      await apiClient("/campaigns", {
        method: "POST",
        body: JSON.stringify({
          organizationId,
          storeId: storeId || undefined,
          name: name.trim(),
          type: type.trim(),
          objective: objective.trim() || undefined,
        }),
      });

      setOrganizationId("");
      setStoreId("");
      setName("");
      setType("NFC Promo");
      setObjective("");

      await loadPage();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nie udało się utworzyć kampanii");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main style={styles.page}>
      <div style={styles.header}>
        <h1 style={styles.title}>Kampanie</h1>
        <p style={styles.subtitle}>
          Zarządzasz kampaniami klientów, przypisujesz je do sklepów i przygotowujesz pod NFC.
        </p>
      </div>

      {isPlatformAdmin ? (
        <section style={styles.card}>
          <h2 style={styles.sectionTitle}>Dodaj kampanię</h2>

          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.grid}>
              <select
                value={organizationId}
                onChange={(e) => {
                  setOrganizationId(e.target.value);
                  setStoreId("");
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
                value={storeId}
                onChange={(e) => setStoreId(e.target.value)}
                style={styles.input}
                disabled={!organizationId}
              >
                <option value="">Opcjonalnie wybierz sklep</option>
                {filteredStores.map((store) => (
                  <option key={store.id} value={store.id}>
                    {store.name} {store.city ? `(${store.city})` : ""}
                  </option>
                ))}
              </select>

              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nazwa kampanii"
                style={styles.input}
              />

              <input
                value={type}
                onChange={(e) => setType(e.target.value)}
                placeholder="Typ kampanii"
                style={styles.input}
              />

              <input
                value={objective}
                onChange={(e) => setObjective(e.target.value)}
                placeholder="Cel kampanii"
                style={styles.input}
              />
            </div>

            <div>
              <button type="submit" disabled={submitting} style={styles.button}>
                {submitting ? "Tworzenie..." : "Utwórz kampanię"}
              </button>
            </div>

            {error ? <p style={styles.error}>{error}</p> : null}
          </form>
        </section>
      ) : (
        <section style={styles.card}>
          <h2 style={styles.sectionTitle}>Kampanie organizacji</h2>
          <p style={styles.muted}>
            Tylko superadmin może tworzyć nowe kampanie.
          </p>
        </section>
      )}

      <section style={styles.card}>
        <div style={styles.sectionHeader}>
          <h2 style={styles.sectionTitle}>Lista kampanii</h2>
          <button onClick={() => void loadPage()} style={styles.secondaryButton}>
            Odśwież
          </button>
        </div>

        {loading ? (
          <p style={styles.muted}>Ładowanie...</p>
        ) : campaigns.length === 0 ? (
          <p style={styles.muted}>Brak kampanii.</p>
        ) : (
          <div style={styles.list}>
            {campaigns.map((campaign) => (
              <article key={campaign.id} style={styles.campaignCard}>
                <div style={styles.campaignTop}>
                  <div>
                    <h3 style={styles.campaignName}>{campaign.name}</h3>
                    <p style={styles.campaignMeta}>
                      {campaign.organization.name}
                      {campaign.store ? ` · ${campaign.store.name}` : ""}
                    </p>
                  </div>

                  <div style={styles.badges}>
                    <span style={styles.badge}>{campaign.status}</span>
                    <span style={styles.badge}>{campaign.type}</span>
                  </div>
                </div>

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
                    <span style={styles.label}>Interactions</span>
                    <div style={styles.value}>{campaign.interactions}</div>
                  </div>

                  <div>
                    <span style={styles.label}>Leads</span>
                    <div style={styles.value}>{campaign.leads}</div>
                  </div>

                  <div>
                    <span style={styles.label}>Conversion rate</span>
                    <div style={styles.value}>{campaign.conversionRate}%</div>
                  </div>
                </div>

                <div style={styles.actions}>
                  <Link href={`/campaigns/${campaign.id}`} style={styles.inlineLink}>
                    Szczegóły kampanii
                  </Link>
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
  page: {
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
  sectionTitle: {
    margin: 0,
    fontSize: 22,
    fontWeight: 700,
  },
  form: {
    display: "grid",
    gap: 16,
  },
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
  error: {
    margin: 0,
    color: "#ff8f8f",
  },
  muted: {
    color: "#9ea8d8",
  },
  list: {
    display: "grid",
    gap: 16,
  },
  campaignCard: {
    background: "#0d1027",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 16,
    padding: 18,
  },
  campaignTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 16,
    marginBottom: 14,
  },
  campaignName: {
    margin: 0,
    fontSize: 20,
  },
  campaignMeta: {
    margin: "6px 0 0 0",
    color: "#9ea8d8",
  },
  badges: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
  },
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
  value: {
    color: "#fff",
    wordBreak: "break-word",
  },
  actions: {
    marginTop: 14,
    paddingTop: 12,
    borderTop: "1px solid rgba(255,255,255,0.08)",
  },
  inlineLink: {
    display: "inline-flex",
    color: "#9ab0ff",
    textDecoration: "none",
    fontWeight: 600,
  },
};