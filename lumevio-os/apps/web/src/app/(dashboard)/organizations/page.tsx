"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { apiClient } from "@/lib/api-client";
import { useAuth } from "@/hooks/use-auth";
import type {
  CreateOrganizationPayload,
  OrganizationListItem,
} from "@/types/organization";

export default function OrganizationsPage() {
  const { isPlatformAdmin } = useAuth();

  const [organizations, setOrganizations] = useState<OrganizationListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [name, setName] = useState("");
  const [industry, setIndustry] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function loadOrganizations() {
    try {
      setLoading(true);
      setError(null);

      const data = await apiClient<OrganizationListItem[]>("/organizations");
      setOrganizations(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Błąd ładowania organizacji");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadOrganizations();
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    if (!name.trim()) {
      setError("Podaj nazwę organizacji");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const payload: CreateOrganizationPayload = {
        name: name.trim(),
        industry: industry.trim() || undefined,
      };

      const created = await apiClient<
        OrganizationListItem & { driveSync?: { success: boolean; error?: string } }
      >("/organizations", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      setOrganizations((prev) => [created, ...prev]);
      setName("");
      setIndustry("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nie udało się utworzyć organizacji");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main style={styles.page}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Organizacje</h1>
          <p style={styles.subtitle}>
            Tu tworzysz klientów LUMEVIO i zarządzasz ich folderami oraz statusem.
          </p>
        </div>
      </div>

      {isPlatformAdmin ? (
        <section style={styles.card}>
          <h2 style={styles.sectionTitle}>Dodaj organizację</h2>

          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.formRow}>
              <div style={styles.field}>
                <label style={styles.label}>Nazwa organizacji</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="np. Żabka"
                  style={styles.input}
                />
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Branża</label>
                <input
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  placeholder="np. Retail"
                  style={styles.input}
                />
              </div>
            </div>

            <div style={styles.actions}>
              <button type="submit" disabled={submitting} style={styles.button}>
                {submitting ? "Tworzenie..." : "Utwórz organizację"}
              </button>
            </div>

            {error ? <p style={styles.error}>{error}</p> : null}
          </form>
        </section>
      ) : null}

      <section style={styles.card}>
        <div style={styles.sectionHeader}>
          <h2 style={styles.sectionTitle}>Lista organizacji</h2>
          <button onClick={() => void loadOrganizations()} style={styles.secondaryButton}>
            Odśwież
          </button>
        </div>

        {loading ? (
          <p style={styles.muted}>Ładowanie...</p>
        ) : organizations.length === 0 ? (
          <p style={styles.muted}>Brak organizacji.</p>
        ) : (
          <div style={styles.list}>
            {organizations.map((org) => (
              <article key={org.id} style={styles.orgCard}>
                <div style={styles.orgTop}>
                  <div>
                    <h3 style={styles.orgName}>{org.name}</h3>
                    <p style={styles.orgMeta}>
                      slug: <strong>{org.slug}</strong>
                    </p>
                  </div>

                  <div style={styles.badges}>
                    <span style={styles.badge}>{org.status}</span>
                    <span style={styles.badge}>{org.plan}</span>
                  </div>
                </div>

                <div style={styles.infoGrid}>
                  <div>
                    <span style={styles.infoLabel}>Branża</span>
                    <div style={styles.infoValue}>{org.industry || "—"}</div>
                  </div>

                  <div>
                    <span style={styles.infoLabel}>Sklepy</span>
                    <div style={styles.infoValue}>{org.storesCount}</div>
                  </div>

                  <div>
                    <span style={styles.infoLabel}>Sync</span>
                    <div style={styles.infoValue}>
                      {org.syncEnabled ? "Włączony" : "Wyłączony"}
                    </div>
                  </div>

                  <div>
                    <span style={styles.infoLabel}>Ostatni sync</span>
                    <div style={styles.infoValue}>
                      {org.lastSyncAt
                        ? new Date(org.lastSyncAt).toLocaleString("pl-PL")
                        : "—"}
                    </div>
                  </div>
                </div>

                <div style={styles.cardActions}>
                  <Link href={`/organizations/${org.id}`} style={styles.linkButton}>
                    Szczegóły organizacji
                  </Link>

                  {org.rootFolderUrl ? (
                    <a
                      href={org.rootFolderUrl}
                      target="_blank"
                      rel="noreferrer"
                      style={styles.linkButtonSecondary}
                    >
                      Otwórz folder
                    </a>
                  ) : (
                    <span style={styles.warning}>
                      Folder jeszcze nie został zsynchronizowany.
                    </span>
                  )}
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
    marginBottom: "24px",
  },
  title: {
    margin: 0,
    fontSize: "32px",
    fontWeight: 700,
  },
  subtitle: {
    marginTop: "8px",
    color: "#a7b0d6",
  },
  card: {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "20px",
    padding: "24px",
    marginBottom: "24px",
  },
  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "16px",
    marginBottom: "16px",
  },
  sectionTitle: {
    margin: 0,
    fontSize: "22px",
    fontWeight: 700,
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  formRow: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
    gap: "16px",
  },
  field: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  label: {
    fontSize: "14px",
    color: "#c6cff5",
  },
  input: {
    height: "48px",
    borderRadius: "14px",
    border: "1px solid rgba(255,255,255,0.12)",
    background: "#0d1027",
    color: "#fff",
    padding: "0 14px",
    outline: "none",
  },
  actions: {
    display: "flex",
    gap: "12px",
  },
  button: {
    height: "46px",
    borderRadius: "14px",
    border: "none",
    padding: "0 18px",
    fontWeight: 700,
    cursor: "pointer",
    background: "#6d7cff",
    color: "#fff",
  },
  secondaryButton: {
    height: "40px",
    borderRadius: "12px",
    border: "1px solid rgba(255,255,255,0.1)",
    padding: "0 14px",
    fontWeight: 600,
    cursor: "pointer",
    background: "transparent",
    color: "#fff",
  },
  error: {
    color: "#ff8f8f",
    margin: 0,
  },
  muted: {
    color: "#9ea8d8",
  },
  list: {
    display: "grid",
    gap: "16px",
  },
  orgCard: {
    background: "#0d1027",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "18px",
    padding: "18px",
  },
  orgTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "16px",
    marginBottom: "16px",
  },
  orgName: {
    margin: 0,
    fontSize: "20px",
  },
  orgMeta: {
    margin: "6px 0 0 0",
    color: "#9ea8d8",
  },
  badges: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
  },
  badge: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "6px 10px",
    borderRadius: "999px",
    background: "rgba(109,124,255,0.14)",
    border: "1px solid rgba(109,124,255,0.35)",
    color: "#d7dcff",
    fontSize: "12px",
    fontWeight: 700,
  },
  infoGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "16px",
    marginBottom: "16px",
  },
  infoLabel: {
    display: "block",
    fontSize: "12px",
    color: "#92a0d8",
    marginBottom: "6px",
    textTransform: "uppercase",
    letterSpacing: "0.04em",
  },
  infoValue: {
    color: "#fff",
    wordBreak: "break-word",
  },
  cardActions: {
    display: "flex",
    gap: "12px",
    alignItems: "center",
    flexWrap: "wrap",
    paddingTop: "12px",
    borderTop: "1px solid rgba(255,255,255,0.08)",
  },
  linkButton: {
    display: "inline-flex",
    textDecoration: "none",
    background: "#6d7cff",
    color: "#fff",
    padding: "10px 14px",
    borderRadius: "12px",
    fontWeight: 700,
  },
  linkButtonSecondary: {
    display: "inline-flex",
    textDecoration: "none",
    background: "#1b2249",
    border: "1px solid rgba(255,255,255,0.1)",
    color: "#fff",
    padding: "10px 14px",
    borderRadius: "12px",
    fontWeight: 600,
  },
  warning: {
    color: "#ffcf7d",
  },
};