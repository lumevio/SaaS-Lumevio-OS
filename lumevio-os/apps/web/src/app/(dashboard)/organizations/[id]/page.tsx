"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api-client";

type OrganizationDetails = {
  id: string;
  name: string;
  slug: string;
  industry?: string | null;
  plan: string;
  status: string;
  storesCount: number;
  rootFolderId?: string | null;
  rootFolderUrl?: string | null;
  syncEnabled: boolean;
  lastSyncAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

export default function OrganizationDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [organization, setOrganization] = useState<OrganizationDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadOrganization() {
    try {
      setLoading(true);
      setError(null);

      const resolved = await params;
      const data = await apiClient<OrganizationDetails>(`/organizations/${resolved.id}`);
      setOrganization(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Błąd ładowania organizacji");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadOrganization();
  }, [params]);

  if (loading) {
    return <div style={styles.loading}>Ładowanie organizacji...</div>;
  }

  if (error || !organization) {
    return (
      <div style={styles.loading}>
        <div>
          <p style={styles.error}>{error || "Nie znaleziono organizacji."}</p>
          <Link href="/organizations" style={styles.backLink}>
            Wróć do organizacji
          </Link>
        </div>
      </div>
    );
  }

  return (
    <main style={styles.page}>
      <Link href="/organizations" style={styles.backLink}>
        ← Wróć do organizacji
      </Link>

      <div style={styles.header}>
        <h1 style={styles.title}>{organization.name}</h1>
        <p style={styles.subtitle}>
          Szczegóły organizacji, synchronizacja Drive i status operacyjny.
        </p>
      </div>

      <section style={styles.card}>
        <div style={styles.infoGrid}>
          <div>
            <span style={styles.label}>Slug</span>
            <div style={styles.value}>{organization.slug}</div>
          </div>

          <div>
            <span style={styles.label}>Branża</span>
            <div style={styles.value}>{organization.industry || "—"}</div>
          </div>

          <div>
            <span style={styles.label}>Plan</span>
            <div style={styles.value}>{organization.plan}</div>
          </div>

          <div>
            <span style={styles.label}>Status</span>
            <div style={styles.value}>{organization.status}</div>
          </div>

          <div>
            <span style={styles.label}>Liczba sklepów</span>
            <div style={styles.value}>{organization.storesCount}</div>
          </div>

          <div>
            <span style={styles.label}>Sync</span>
            <div style={styles.value}>{organization.syncEnabled ? "Włączony" : "Wyłączony"}</div>
          </div>

          <div>
            <span style={styles.label}>Ostatni sync</span>
            <div style={styles.value}>
              {organization.lastSyncAt
                ? new Date(organization.lastSyncAt).toLocaleString("pl-PL")
                : "—"}
            </div>
          </div>

          <div>
            <span style={styles.label}>Utworzono</span>
            <div style={styles.value}>
              {new Date(organization.createdAt).toLocaleString("pl-PL")}
            </div>
          </div>
        </div>

        {organization.rootFolderUrl ? (
          <div style={styles.actions}>
            <a
              href={organization.rootFolderUrl}
              target="_blank"
              rel="noreferrer"
              style={styles.buttonLink}
            >
              Otwórz folder Google Drive
            </a>
          </div>
        ) : null}
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
  backLink: {
    display: "inline-flex",
    textDecoration: "none",
    color: "#9ab0ff",
    fontWeight: 600,
    marginBottom: 16,
  },
  header: { marginBottom: 24 },
  title: { margin: 0, fontSize: 32, fontWeight: 800 },
  subtitle: { marginTop: 8, color: "#9ea8d8" },
  card: {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 20,
    padding: 24,
  },
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
  actions: {
    marginTop: 20,
    paddingTop: 16,
    borderTop: "1px solid rgba(255,255,255,0.08)",
  },
  buttonLink: {
    display: "inline-flex",
    textDecoration: "none",
    background: "#6d7cff",
    color: "#fff",
    padding: "10px 14px",
    borderRadius: 12,
    fontWeight: 700,
  },
  error: { color: "#ff8f8f" },
};