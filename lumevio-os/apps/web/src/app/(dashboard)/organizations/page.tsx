"use client";

import { FormEvent, useEffect, useState } from "react";
import { apiClient } from "@/lib/api-client";

type OrganizationItem = {
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

export default function OrganizationsPage() {
  const [items, setItems] = useState<OrganizationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [industry, setIndustry] = useState("");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editIndustry, setEditIndustry] = useState("");
  const [editPlan, setEditPlan] = useState("STARTER");
  const [editStatus, setEditStatus] = useState("LEAD");
  const [editSyncEnabled, setEditSyncEnabled] = useState(true);

  async function loadData() {
    try {
      setLoading(true);
      setError(null);
      const data = await apiClient<OrganizationItem[]>("/organizations");
      setItems(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Błąd ładowania organizacji");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();

    if (!name.trim()) {
      setError("Podaj nazwę organizacji");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const created = await apiClient<OrganizationItem>("/organizations", {
        method: "POST",
        body: JSON.stringify({
          name: name.trim(),
          industry: industry.trim() || undefined,
        }),
      });

      setItems((prev) => [created, ...prev]);
      setName("");
      setIndustry("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nie udało się utworzyć organizacji");
    } finally {
      setSubmitting(false);
    }
  }

  function startEdit(item: OrganizationItem) {
    setEditingId(item.id);
    setEditName(item.name);
    setEditIndustry(item.industry || "");
    setEditPlan(item.plan);
    setEditStatus(item.status);
    setEditSyncEnabled(item.syncEnabled);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditName("");
    setEditIndustry("");
    setEditPlan("STARTER");
    setEditStatus("LEAD");
    setEditSyncEnabled(true);
  }

  async function saveEdit(id: string) {
    try {
      setSavingId(id);
      setError(null);

      const updated = await apiClient<OrganizationItem>(`/organizations/${id}`, {
        method: "PATCH",
        body: JSON.stringify({
          name: editName.trim(),
          industry: editIndustry.trim() || undefined,
          plan: editPlan,
          status: editStatus,
          syncEnabled: editSyncEnabled,
        }),
      });

      setItems((prev) => prev.map((item) => (item.id === id ? updated : item)));
      cancelEdit();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nie udało się zapisać zmian");
    } finally {
      setSavingId(null);
    }
  }

  async function removeItem(id: string) {
    const confirmed = window.confirm(
      "Czy na pewno chcesz usunąć tę organizację? Ta operacja jest nieodwracalna."
    );
    if (!confirmed) return;

    try {
      setDeletingId(id);
      setError(null);

      await apiClient(`/organizations/${id}`, {
        method: "DELETE",
      });

      setItems((prev) => prev.filter((item) => item.id !== id));
      if (editingId === id) cancelEdit();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nie udało się usunąć organizacji");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <main style={styles.page}>
      <div style={styles.header}>
        <h1 style={styles.title}>Organizacje</h1>
        <p style={styles.subtitle}>
          Tworzysz klientów LUMEVIO, edytujesz ich dane i usuwasz zbędne rekordy.
        </p>
      </div>

      <section style={styles.card}>
        <h2 style={styles.sectionTitle}>Dodaj organizację</h2>

        <form onSubmit={handleCreate} style={styles.form}>
          <div style={styles.grid}>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nazwa organizacji"
              style={styles.input}
            />
            <input
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              placeholder="Branża"
              style={styles.input}
            />
          </div>

          <div>
            <button type="submit" disabled={submitting} style={styles.button}>
              {submitting ? "Tworzenie..." : "Utwórz organizację"}
            </button>
          </div>

          {error ? <p style={styles.error}>{error}</p> : null}
        </form>
      </section>

      <section style={styles.card}>
        <h2 style={styles.sectionTitle}>Lista organizacji</h2>

        {loading ? (
          <p style={styles.muted}>Ładowanie...</p>
        ) : items.length === 0 ? (
          <p style={styles.muted}>Brak organizacji.</p>
        ) : (
          <div style={styles.list}>
            {items.map((item) => {
              const isEditing = editingId === item.id;

              return (
                <article key={item.id} style={styles.itemCard}>
                  {!isEditing ? (
                    <>
                      <div style={styles.itemTop}>
                        <div>
                          <h3 style={styles.itemTitle}>{item.name}</h3>
                          <p style={styles.itemMeta}>
                            {item.slug} · {item.industry || "Brak branży"}
                          </p>
                        </div>

                        <div style={styles.badges}>
                          <span style={styles.badge}>{item.plan}</span>
                          <span style={styles.badge}>{item.status}</span>
                        </div>
                      </div>

                      <div style={styles.infoGrid}>
                        <div>
                          <span style={styles.label}>Sync</span>
                          <div style={styles.value}>
                            {item.syncEnabled ? "Włączony" : "Wyłączony"}
                          </div>
                        </div>

                        <div>
                          <span style={styles.label}>Folder Drive</span>
                          <div style={styles.value}>
                            {item.rootFolderUrl ? (
                              <a
                                href={item.rootFolderUrl}
                                target="_blank"
                                rel="noreferrer"
                                style={styles.inlineLink}
                              >
                                Otwórz folder
                              </a>
                            ) : (
                              "Brak"
                            )}
                          </div>
                        </div>

                        <div>
                          <span style={styles.label}>Ostatni sync</span>
                          <div style={styles.value}>
                            {item.lastSyncAt
                              ? new Date(item.lastSyncAt).toLocaleString("pl-PL")
                              : "—"}
                          </div>
                        </div>
                      </div>

                      <div style={styles.actions}>
                        <button onClick={() => startEdit(item)} style={styles.secondaryButton}>
                          Edytuj
                        </button>
                        <button
                          onClick={() => void removeItem(item.id)}
                          disabled={deletingId === item.id}
                          style={styles.dangerButton}
                        >
                          {deletingId === item.id ? "Usuwanie..." : "Usuń"}
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div style={styles.grid}>
                        <input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          placeholder="Nazwa"
                          style={styles.input}
                        />
                        <input
                          value={editIndustry}
                          onChange={(e) => setEditIndustry(e.target.value)}
                          placeholder="Branża"
                          style={styles.input}
                        />
                        <select
                          value={editPlan}
                          onChange={(e) => setEditPlan(e.target.value)}
                          style={styles.input}
                        >
                          <option value="STARTER">STARTER</option>
                          <option value="GROWTH">GROWTH</option>
                          <option value="PRO">PRO</option>
                          <option value="ENTERPRISE">ENTERPRISE</option>
                        </select>
                        <select
                          value={editStatus}
                          onChange={(e) => setEditStatus(e.target.value)}
                          style={styles.input}
                        >
                          <option value="LEAD">LEAD</option>
                          <option value="ACTIVE">ACTIVE</option>
                          <option value="PAUSED">PAUSED</option>
                          <option value="ARCHIVED">ARCHIVED</option>
                        </select>
                      </div>

                      <label style={styles.switchItem}>
                        <input
                          type="checkbox"
                          checked={editSyncEnabled}
                          onChange={(e) => setEditSyncEnabled(e.target.checked)}
                        />
                        <span>Sync enabled</span>
                      </label>

                      <div style={styles.actions}>
                        <button
                          onClick={() => void saveEdit(item.id)}
                          disabled={savingId === item.id}
                          style={styles.button}
                        >
                          {savingId === item.id ? "Zapisywanie..." : "Zapisz"}
                        </button>
                        <button onClick={cancelEdit} style={styles.secondaryButton}>
                          Anuluj
                        </button>
                      </div>
                    </>
                  )}
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
  sectionTitle: { margin: 0, marginBottom: 16, fontSize: 22, fontWeight: 700 },
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
    height: 42,
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.1)",
    padding: "0 14px",
    fontWeight: 600,
    cursor: "pointer",
    background: "transparent",
    color: "#fff",
  },
  dangerButton: {
    height: 42,
    borderRadius: 12,
    border: "1px solid rgba(255,120,120,0.28)",
    padding: "0 14px",
    fontWeight: 600,
    cursor: "pointer",
    background: "rgba(255,120,120,0.08)",
    color: "#ff9f9f",
  },
  error: { margin: 0, color: "#ff8f8f" },
  muted: { color: "#9ea8d8" },
  list: { display: "grid", gap: 16 },
  itemCard: {
    background: "#0d1027",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 16,
    padding: 18,
  },
  itemTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 16,
    marginBottom: 14,
  },
  itemTitle: { margin: 0, fontSize: 20 },
  itemMeta: { margin: "6px 0 0 0", color: "#9ea8d8" },
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
    marginBottom: 14,
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
    display: "flex",
    gap: 12,
    flexWrap: "wrap",
    marginTop: 8,
  },
  switchItem: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    marginTop: 16,
    marginBottom: 16,
    minHeight: 48,
    padding: "0 14px",
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "#0d1027",
  },
};