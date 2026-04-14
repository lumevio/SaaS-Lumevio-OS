"use client";

import { FormEvent, useEffect, useState } from "react";
import { apiClient } from "@/lib/api-client";
import { useAuth } from "@/hooks/use-auth";

type OrganizationOption = {
  id: string;
  name: string;
  slug: string;
};

type StoreItem = {
  id: string;
  name: string;
  city?: string | null;
  address?: string | null;
  zone?: string | null;
  status: string;
  healthScore?: number | null;
  createdAt: string;
  organization: {
    id: string;
    name: string;
    slug: string;
  };
};

export default function StoresPage() {
  const { isPlatformAdmin } = useAuth();

  const [organizations, setOrganizations] = useState<OrganizationOption[]>([]);
  const [stores, setStores] = useState<StoreItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [organizationId, setOrganizationId] = useState("");
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [zone, setZone] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function loadPage() {
    try {
      setLoading(true);
      setError(null);

      const storesPromise = apiClient<StoreItem[]>("/stores");
      const orgsPromise = isPlatformAdmin
        ? apiClient<OrganizationOption[]>("/organizations")
        : Promise.resolve([]);

      const [storesData, orgs] = await Promise.all([storesPromise, orgsPromise]);

      setStores(storesData);
      setOrganizations(orgs);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Błąd ładowania danych");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadPage();
  }, [isPlatformAdmin]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    if (!organizationId || !name.trim()) {
      setError("Wybierz organizację i podaj nazwę sklepu");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      await apiClient("/stores", {
        method: "POST",
        body: JSON.stringify({
          organizationId,
          name: name.trim(),
          city: city.trim() || undefined,
          address: address.trim() || undefined,
          zone: zone.trim() || undefined,
        }),
      });

      setOrganizationId("");
      setName("");
      setCity("");
      setAddress("");
      setZone("");

      await loadPage();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nie udało się utworzyć sklepu");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main style={styles.page}>
      <div style={styles.header}>
        <h1 style={styles.title}>Sklepy</h1>
        <p style={styles.subtitle}>
          Zarządzasz lokalizacjami klientów i przygotowujesz bazę pod kampanie oraz NFC.
        </p>
      </div>

      {isPlatformAdmin ? (
        <section style={styles.card}>
          <h2 style={styles.sectionTitle}>Dodaj sklep</h2>

          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.grid}>
              <select
                value={organizationId}
                onChange={(e) => setOrganizationId(e.target.value)}
                style={styles.input}
              >
                <option value="">Wybierz organizację</option>
                {organizations.map((org) => (
                  <option key={org.id} value={org.id}>
                    {org.name}
                  </option>
                ))}
              </select>

              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nazwa sklepu"
                style={styles.input}
              />

              <input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Miasto"
                style={styles.input}
              />

              <input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Adres"
                style={styles.input}
              />

              <input
                value={zone}
                onChange={(e) => setZone(e.target.value)}
                placeholder="Strefa / region"
                style={styles.input}
              />
            </div>

            <div>
              <button type="submit" disabled={submitting} style={styles.button}>
                {submitting ? "Tworzenie..." : "Utwórz sklep"}
              </button>
            </div>

            {error ? <p style={styles.error}>{error}</p> : null}
          </form>
        </section>
      ) : (
        <section style={styles.card}>
          <h2 style={styles.sectionTitle}>Sklepy organizacji</h2>
          <p style={styles.muted}>
            Tylko superadmin może dodawać nowe sklepy.
          </p>
        </section>
      )}

      <section style={styles.card}>
        <div style={styles.sectionHeader}>
          <h2 style={styles.sectionTitle}>Lista sklepów</h2>
          <button onClick={() => void loadPage()} style={styles.secondaryButton}>
            Odśwież
          </button>
        </div>

        {loading ? (
          <p style={styles.muted}>Ładowanie...</p>
        ) : stores.length === 0 ? (
          <p style={styles.muted}>Brak sklepów.</p>
        ) : (
          <div style={styles.list}>
            {stores.map((store) => (
              <article key={store.id} style={styles.storeCard}>
                <div style={styles.storeTop}>
                  <div>
                    <h3 style={styles.storeName}>{store.name}</h3>
                    <p style={styles.storeOrg}>{store.organization.name}</p>
                  </div>

                  <div style={styles.badges}>
                    <span style={styles.badge}>{store.status}</span>
                  </div>
                </div>

                <div style={styles.infoGrid}>
                  <div>
                    <span style={styles.label}>Miasto</span>
                    <div style={styles.value}>{store.city || "—"}</div>
                  </div>

                  <div>
                    <span style={styles.label}>Adres</span>
                    <div style={styles.value}>{store.address || "—"}</div>
                  </div>

                  <div>
                    <span style={styles.label}>Strefa</span>
                    <div style={styles.value}>{store.zone || "—"}</div>
                  </div>

                  <div>
                    <span style={styles.label}>Health score</span>
                    <div style={styles.value}>{store.healthScore ?? "—"}</div>
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
  storeCard: {
    background: "#0d1027",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 16,
    padding: 18,
  },
  storeTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 16,
    marginBottom: 14,
  },
  storeName: {
    margin: 0,
    fontSize: 20,
  },
  storeOrg: {
    margin: "6px 0 0 0",
    color: "#9ea8d8",
  },
  badges: {
    display: "flex",
    gap: 8,
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
};