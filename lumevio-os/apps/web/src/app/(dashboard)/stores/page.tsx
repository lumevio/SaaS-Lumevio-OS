"use client";

import { FormEvent, useEffect, useState, type CSSProperties } from "react";
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
  status?: string | null;
  healthScore?: number | null;
  createdAt: string;
  organization?: {
    id: string;
    name: string;
    slug: string;
  } | null;
};

const INITIAL_FORM = {
  organizationId: "",
  name: "",
  city: "",
  address: "",
  zone: "",
};

export default function StoresPage() {
  const { isPlatformAdmin } = useAuth();

  const [organizations, setOrganizations] = useState<OrganizationOption[]>([]);
  const [stores, setStores] = useState<StoreItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingStore, setEditingStore] = useState<StoreItem | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [organizationId, setOrganizationId] = useState(INITIAL_FORM.organizationId);
  const [name, setName] = useState(INITIAL_FORM.name);
  const [city, setCity] = useState(INITIAL_FORM.city);
  const [address, setAddress] = useState(INITIAL_FORM.address);
  const [zone, setZone] = useState(INITIAL_FORM.zone);

  function resetForm() {
    setEditingStore(null);
    setOrganizationId(INITIAL_FORM.organizationId);
    setName(INITIAL_FORM.name);
    setCity(INITIAL_FORM.city);
    setAddress(INITIAL_FORM.address);
    setZone(INITIAL_FORM.zone);
  }

  function startEdit(store: StoreItem) {
    setEditingStore(store);
    setOrganizationId(store.organization?.id ?? "");
    setName(store.name ?? "");
    setCity(store.city ?? "");
    setAddress(store.address ?? "");
    setZone(store.zone ?? "");
    setError(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function loadPage() {
    try {
      setLoading(true);
      setError(null);

      const storesPromise = apiClient<StoreItem[]>("/stores");
      const orgsPromise = isPlatformAdmin
        ? apiClient<OrganizationOption[]>("/organizations")
        : Promise.resolve<OrganizationOption[]>([]);

      const [storesData, orgsData] = await Promise.all([storesPromise, orgsPromise]);

      setStores(storesData);
      setOrganizations(orgsData);
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

    if (isPlatformAdmin && !organizationId) {
      setError("Wybierz organizację");
      return;
    }

    if (!name.trim()) {
      setError("Podaj nazwę sklepu");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const payload = {
        organizationId: organizationId || undefined,
        name: name.trim(),
        city: city.trim() || undefined,
        address: address.trim() || undefined,
        zone: zone.trim() || undefined,
      };

      if (editingStore) {
        await apiClient(`/stores/${editingStore.id}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
      } else {
        await apiClient("/stores", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }

      resetForm();
      await loadPage();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : editingStore
            ? "Nie udało się zaktualizować sklepu"
            : "Nie udało się utworzyć sklepu",
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    const ok = window.confirm("Czy na pewno chcesz usunąć ten sklep?");
    if (!ok) return;

    try {
      setDeletingId(id);
      setError(null);

      await apiClient(`/stores/${id}`, {
        method: "DELETE",
      });

      if (editingStore?.id === id) {
        resetForm();
      }

      await loadPage();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Błąd usuwania sklepu");
    } finally {
      setDeletingId(null);
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
          <div style={styles.sectionHeader}>
            <div>
              <h2 style={styles.sectionTitle}>
                {editingStore ? "Edytuj sklep" : "Dodaj sklep"}
              </h2>
              <p style={styles.muted}>
                {editingStore
                  ? "Zmieniasz dane istniejącej lokalizacji."
                  : "Tworzysz nową lokalizację dla organizacji."}
              </p>
            </div>

            {editingStore ? (
              <button
                type="button"
                onClick={resetForm}
                style={styles.secondaryButton}
              >
                Anuluj edycję
              </button>
            ) : null}
          </div>

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

            <div style={styles.actionsRow}>
              <button type="submit" disabled={submitting} style={styles.button}>
                {submitting
                  ? editingStore
                    ? "Zapisywanie..."
                    : "Tworzenie..."
                  : editingStore
                    ? "Zapisz zmiany"
                    : "Utwórz sklep"}
              </button>

              {editingStore ? (
                <button
                  type="button"
                  onClick={resetForm}
                  style={styles.secondaryButton}
                >
                  Wyczyść formularz
                </button>
              ) : null}
            </div>

            {error ? <p style={styles.error}>{error}</p> : null}
          </form>
        </section>
      ) : (
        <section style={styles.card}>
          <h2 style={styles.sectionTitle}>Sklepy organizacji</h2>
          <p style={styles.muted}>Tylko superadmin może dodawać nowe sklepy.</p>
          {error ? <p style={styles.error}>{error}</p> : null}
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
                    <p style={styles.storeOrg}>
                      {store.organization?.name || "Brak organizacji"}
                    </p>
                  </div>

                  <div style={styles.badges}>
                    <span style={styles.badge}>{store.status || "active"}</span>
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

                {isPlatformAdmin ? (
                  <div style={styles.itemActions}>
                    <button
                      type="button"
                      onClick={() => startEdit(store)}
                      style={styles.secondaryButtonSmall}
                    >
                      Edytuj
                    </button>

                    <button
                      type="button"
                      onClick={() => void handleDelete(store.id)}
                      disabled={deletingId === store.id}
                      style={styles.dangerButtonSmall}
                    >
                      {deletingId === store.id ? "Usuwanie..." : "Usuń"}
                    </button>
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

const styles: Record<string, CSSProperties> = {
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
    flexWrap: "wrap",
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
  actionsRow: {
    display: "flex",
    gap: 12,
    flexWrap: "wrap",
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
  secondaryButtonSmall: {
    height: 36,
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.1)",
    padding: "0 12px",
    fontWeight: 600,
    cursor: "pointer",
    background: "transparent",
    color: "#fff",
  },
  dangerButtonSmall: {
    height: 36,
    borderRadius: 12,
    border: "1px solid rgba(255,102,102,0.28)",
    padding: "0 12px",
    fontWeight: 600,
    cursor: "pointer",
    background: "rgba(255,80,80,0.08)",
    color: "#ff9d9d",
  },
  error: {
    margin: 0,
    color: "#ff8f8f",
  },
  muted: {
    color: "#9ea8d8",
    marginTop: 8,
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
    fontSize: 12,
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
  itemActions: {
    display: "flex",
    gap: 10,
    marginTop: 18,
    flexWrap: "wrap",
  },
};