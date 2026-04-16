"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState, type CSSProperties } from "react";
import { apiClient } from "@/lib/api-client";
import { useAuth } from "@/hooks/use-auth";

type OrganizationItem = {
  id: string;
  name: string;
  slug: string;
  legalName?: string | null;
  type?: string | null;
  status?: string | null;
  industry?: string | null;
  plan?: string | null;
  nip?: string | null;
  regon?: string | null;
  krs?: string | null;
  vatEu?: string | null;
  email?: string | null;
  phone?: string | null;
  website?: string | null;
  contactFirstName?: string | null;
  contactLastName?: string | null;
  contactPosition?: string | null;
  street?: string | null;
  buildingNo?: string | null;
  unitNo?: string | null;
  postalCode?: string | null;
  city?: string | null;
  country?: string | null;
  notes?: string | null;
  rootFolderId?: string | null;
  rootFolderUrl?: string | null;
  syncEnabled?: boolean | null;
  createdAt: string;
  updatedAt: string;
};

const INITIAL_FORM = {
  name: "",
  slug: "",
  legalName: "",
  type: "CLIENT",
  status: "LEAD",
  industry: "",
  plan: "ENTERPRISE",
  nip: "",
  regon: "",
  krs: "",
  vatEu: "",
  email: "",
  phone: "",
  website: "",
  contactFirstName: "",
  contactLastName: "",
  contactPosition: "",
  street: "",
  buildingNo: "",
  unitNo: "",
  postalCode: "",
  city: "",
  country: "Polska",
  notes: "",
  rootFolderId: "",
  rootFolderUrl: "",
  syncEnabled: true,
};

export default function OrganizationsPage() {
  const { isPlatformAdmin } = useAuth();

  const [items, setItems] = useState<OrganizationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [provisioningId, setProvisioningId] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<OrganizationItem | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const [form, setForm] = useState(INITIAL_FORM);

  function setField<K extends keyof typeof INITIAL_FORM>(key: K, value: (typeof INITIAL_FORM)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function resetForm() {
    setEditingItem(null);
    setForm(INITIAL_FORM);
    setError(null);
  }

  function startEdit(item: OrganizationItem) {
    setEditingItem(item);
    setForm({
      name: item.name || "",
      slug: item.slug || "",
      legalName: item.legalName || "",
      type: item.type || "CLIENT",
      status: item.status || "LEAD",
      industry: item.industry || "",
      plan: item.plan || "ENTERPRISE",
      nip: item.nip || "",
      regon: item.regon || "",
      krs: item.krs || "",
      vatEu: item.vatEu || "",
      email: item.email || "",
      phone: item.phone || "",
      website: item.website || "",
      contactFirstName: item.contactFirstName || "",
      contactLastName: item.contactLastName || "",
      contactPosition: item.contactPosition || "",
      street: item.street || "",
      buildingNo: item.buildingNo || "",
      unitNo: item.unitNo || "",
      postalCode: item.postalCode || "",
      city: item.city || "",
      country: item.country || "Polska",
      notes: item.notes || "",
      rootFolderId: item.rootFolderId || "",
      rootFolderUrl: item.rootFolderUrl || "",
      syncEnabled: Boolean(item.syncEnabled ?? true),
    });
    setError(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function loadPage() {
    try {
      setLoading(true);
      setError(null);

      const data = await apiClient<OrganizationItem[]>("/organizations");
      setItems(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nie udało się pobrać organizacji");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadPage();
  }, []);

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;

    return items.filter((item) => {
      return [
        item.name,
        item.slug,
        item.legalName,
        item.industry,
        item.status,
        item.email,
        item.phone,
        item.city,
        item.nip,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(q));
    });
  }, [items, search]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    if (!form.name.trim()) {
      setError("Podaj nazwę klienta / organizacji");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const payload = {
        name: form.name.trim(),
        slug: form.slug.trim() || undefined,
        legalName: form.legalName.trim() || undefined,
        type: form.type.trim() || undefined,
        status: form.status.trim() || undefined,
        industry: form.industry.trim() || undefined,
        plan: form.plan.trim() || undefined,
        nip: form.nip.trim() || undefined,
        regon: form.regon.trim() || undefined,
        krs: form.krs.trim() || undefined,
        vatEu: form.vatEu.trim() || undefined,
        email: form.email.trim() || undefined,
        phone: form.phone.trim() || undefined,
        website: form.website.trim() || undefined,
        contactFirstName: form.contactFirstName.trim() || undefined,
        contactLastName: form.contactLastName.trim() || undefined,
        contactPosition: form.contactPosition.trim() || undefined,
        street: form.street.trim() || undefined,
        buildingNo: form.buildingNo.trim() || undefined,
        unitNo: form.unitNo.trim() || undefined,
        postalCode: form.postalCode.trim() || undefined,
        city: form.city.trim() || undefined,
        country: form.country.trim() || undefined,
        notes: form.notes.trim() || undefined,
        rootFolderId: form.rootFolderId.trim() || undefined,
        rootFolderUrl: form.rootFolderUrl.trim() || undefined,
        syncEnabled: form.syncEnabled,
      };

      if (editingItem) {
        await apiClient(`/organizations/${editingItem.id}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
      } else {
        await apiClient("/organizations", {
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
          : editingItem
            ? "Nie udało się zapisać zmian"
            : "Nie udało się utworzyć klienta",
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    const ok = window.confirm("Czy na pewno chcesz usunąć tę organizację?");
    if (!ok) return;

    try {
      setDeletingId(id);
      setError(null);

      await apiClient(`/organizations/${id}`, {
        method: "DELETE",
      });

      if (editingItem?.id === id) {
        resetForm();
      }

      await loadPage();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nie udało się usunąć organizacji");
    } finally {
      setDeletingId(null);
    }
  }

  async function handleProvisionDrive(id: string) {
    try {
      setProvisioningId(id);
      setError(null);

      await apiClient(`/organizations/${id}/drive/provision`, {
        method: "POST",
      });

      await loadPage();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nie udało się utworzyć struktury Drive");
    } finally {
      setProvisioningId(null);
    }
  }

  async function handleSyncProfile(id: string) {
    try {
      setSyncingId(id);
      setError(null);

      await apiClient(`/organizations/${id}/drive/sync-profile`, {
        method: "POST",
      });

      await loadPage();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nie udało się zsynchronizować profilu");
    } finally {
      setSyncingId(null);
    }
  }

  return (
    <main style={styles.page}>
      <div style={styles.header}>
        <div>
          <div style={styles.eyebrow}>LUMEVIO CLIENT OPERATING SYSTEM</div>
          <h1 style={styles.title}>Organizacje i klienci</h1>
          <p style={styles.subtitle}>
            Dodawaj klientów do bazy, zapisuj pełne dane firmowe i synchronizuj strukturę z Google
            Drive.
          </p>
        </div>

        <div style={styles.headerActions}>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Szukaj klienta, NIP, miasta..."
            style={styles.searchInput}
          />
        </div>
      </div>

      {isPlatformAdmin ? (
        <section style={styles.card}>
          <div style={styles.sectionHeader}>
            <div>
              <h2 style={styles.sectionTitle}>
                {editingItem ? "Edytuj klienta" : "Dodaj nowego klienta"}
              </h2>
              <p style={styles.sectionText}>
                Ta karta zapisuje klienta do bazy i może od razu spiąć go z Google Drive.
              </p>
            </div>

            {editingItem ? (
              <button type="button" onClick={resetForm} style={styles.secondaryButton}>
                Anuluj edycję
              </button>
            ) : null}
          </div>

          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.formSection}>
              <div style={styles.formSectionTitle}>Dane podstawowe</div>
              <div style={styles.grid3}>
                <input
                  value={form.name}
                  onChange={(e) => setField("name", e.target.value)}
                  placeholder="Nazwa klienta / firmy"
                  style={styles.input}
                />
                <input
                  value={form.slug}
                  onChange={(e) => setField("slug", e.target.value)}
                  placeholder="Slug opcjonalny"
                  style={styles.input}
                />
                <input
                  value={form.legalName}
                  onChange={(e) => setField("legalName", e.target.value)}
                  placeholder="Pełna nazwa prawna"
                  style={styles.input}
                />
                <input
                  value={form.type}
                  onChange={(e) => setField("type", e.target.value)}
                  placeholder="Typ klienta"
                  style={styles.input}
                />
                <select
                  value={form.status}
                  onChange={(e) => setField("status", e.target.value)}
                  style={styles.input}
                >
                  <option value="LEAD">LEAD</option>
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="ONBOARDING">ONBOARDING</option>
                  <option value="PAUSED">PAUSED</option>
                  <option value="ARCHIVED">ARCHIVED</option>
                </select>
                <input
                  value={form.industry}
                  onChange={(e) => setField("industry", e.target.value)}
                  placeholder="Branża"
                  style={styles.input}
                />
              </div>
            </div>

            <div style={styles.formSection}>
              <div style={styles.formSectionTitle}>Formalne dane firmy</div>
              <div style={styles.grid4}>
                <input
                  value={form.plan}
                  onChange={(e) => setField("plan", e.target.value)}
                  placeholder="Plan"
                  style={styles.input}
                />
                <input
                  value={form.nip}
                  onChange={(e) => setField("nip", e.target.value)}
                  placeholder="NIP"
                  style={styles.input}
                />
                <input
                  value={form.regon}
                  onChange={(e) => setField("regon", e.target.value)}
                  placeholder="REGON"
                  style={styles.input}
                />
                <input
                  value={form.krs}
                  onChange={(e) => setField("krs", e.target.value)}
                  placeholder="KRS"
                  style={styles.input}
                />
                <input
                  value={form.vatEu}
                  onChange={(e) => setField("vatEu", e.target.value)}
                  placeholder="VAT EU"
                  style={styles.input}
                />
              </div>
            </div>

            <div style={styles.formSection}>
              <div style={styles.formSectionTitle}>Kontakt</div>
              <div style={styles.grid4}>
                <input
                  value={form.email}
                  onChange={(e) => setField("email", e.target.value)}
                  placeholder="E-mail firmowy"
                  style={styles.input}
                />
                <input
                  value={form.phone}
                  onChange={(e) => setField("phone", e.target.value)}
                  placeholder="Telefon"
                  style={styles.input}
                />
                <input
                  value={form.website}
                  onChange={(e) => setField("website", e.target.value)}
                  placeholder="Strona www"
                  style={styles.input}
                />
                <input
                  value={form.contactPosition}
                  onChange={(e) => setField("contactPosition", e.target.value)}
                  placeholder="Stanowisko kontaktu"
                  style={styles.input}
                />
                <input
                  value={form.contactFirstName}
                  onChange={(e) => setField("contactFirstName", e.target.value)}
                  placeholder="Imię kontaktu"
                  style={styles.input}
                />
                <input
                  value={form.contactLastName}
                  onChange={(e) => setField("contactLastName", e.target.value)}
                  placeholder="Nazwisko kontaktu"
                  style={styles.input}
                />
              </div>
            </div>

            <div style={styles.formSection}>
              <div style={styles.formSectionTitle}>Adres</div>
              <div style={styles.grid4}>
                <input
                  value={form.street}
                  onChange={(e) => setField("street", e.target.value)}
                  placeholder="Ulica"
                  style={styles.input}
                />
                <input
                  value={form.buildingNo}
                  onChange={(e) => setField("buildingNo", e.target.value)}
                  placeholder="Nr budynku"
                  style={styles.input}
                />
                <input
                  value={form.unitNo}
                  onChange={(e) => setField("unitNo", e.target.value)}
                  placeholder="Nr lokalu"
                  style={styles.input}
                />
                <input
                  value={form.postalCode}
                  onChange={(e) => setField("postalCode", e.target.value)}
                  placeholder="Kod pocztowy"
                  style={styles.input}
                />
                <input
                  value={form.city}
                  onChange={(e) => setField("city", e.target.value)}
                  placeholder="Miasto"
                  style={styles.input}
                />
                <input
                  value={form.country}
                  onChange={(e) => setField("country", e.target.value)}
                  placeholder="Kraj"
                  style={styles.input}
                />
              </div>
            </div>

            <div style={styles.formSection}>
              <div style={styles.formSectionTitle}>Google Drive i notatki</div>
              <div style={styles.grid3}>
                <input
                  value={form.rootFolderId}
                  onChange={(e) => setField("rootFolderId", e.target.value)}
                  placeholder="Google Drive folder ID opcjonalnie"
                  style={styles.input}
                />
                <input
                  value={form.rootFolderUrl}
                  onChange={(e) => setField("rootFolderUrl", e.target.value)}
                  placeholder="Google Drive folder URL opcjonalnie"
                  style={styles.input}
                />
                <label style={styles.checkboxCard}>
                  <input
                    type="checkbox"
                    checked={form.syncEnabled}
                    onChange={(e) => setField("syncEnabled", e.target.checked)}
                  />
                  <span>Automatyczna synchronizacja z Drive</span>
                </label>
              </div>

              <textarea
                value={form.notes}
                onChange={(e) => setField("notes", e.target.value)}
                placeholder="Notatki handlowe, onboarding, potrzeby klienta, ustalenia..."
                style={styles.textarea}
              />
            </div>

            <div style={styles.actionsRow}>
              <button type="submit" disabled={submitting} style={styles.primaryButton}>
                {submitting
                  ? editingItem
                    ? "Zapisywanie..."
                    : "Tworzenie klienta..."
                  : editingItem
                    ? "Zapisz klienta"
                    : "Dodaj klienta"}
              </button>

              {editingItem ? (
                <Link href={`/organizations/${editingItem.id}`} style={styles.secondaryLinkButton}>
                  Otwórz kartę klienta
                </Link>
              ) : null}
            </div>

            {error ? <p style={styles.error}>{error}</p> : null}
          </form>
        </section>
      ) : null}

      <section style={styles.card}>
        <div style={styles.sectionHeader}>
          <div>
            <h2 style={styles.sectionTitle}>Baza klientów</h2>
            <p style={styles.sectionText}>
              Tu widzisz klientów zapisanych w bazie. Sam folder na Drive nie doda klienta do panelu
              — klient musi być zapisany w DB albo zaimportowany synchronizacją.
            </p>
          </div>

          <button onClick={() => void loadPage()} style={styles.secondaryButton}>
            Odśwież
          </button>
        </div>

        {loading ? (
          <p style={styles.muted}>Ładowanie klientów...</p>
        ) : filteredItems.length === 0 ? (
          <div style={styles.emptyState}>
            <div style={styles.emptyTitle}>Brak klientów w bazie</div>
            <div style={styles.emptyText}>
              Dodaj pierwszego klienta formularzem powyżej albo zbuduj import klientów z Drive do DB.
            </div>
          </div>
        ) : (
          <div style={styles.cardsGrid}>
            {filteredItems.map((item) => {
              const contactName = [item.contactFirstName, item.contactLastName]
                .filter(Boolean)
                .join(" ")
                .trim();

              const address = [item.street, item.buildingNo, item.unitNo ? `/${item.unitNo}` : ""]
                .filter(Boolean)
                .join(" ");

              return (
                <article key={item.id} style={styles.clientCard}>
                  <div style={styles.clientCardTop}>
                    <div style={{ minWidth: 0 }}>
                      <h3 style={styles.clientName}>{item.name}</h3>
                      <div style={styles.clientMetaLine}>
                        {item.legalName || "Brak pełnej nazwy"} · {item.industry || "Brak branży"}
                      </div>
                    </div>

                    <div style={styles.cardBadges}>
                      <span style={styles.badge}>{item.status || "UNKNOWN"}</span>
                      <span
                        style={{
                          ...styles.badge,
                          ...(item.rootFolderUrl ? styles.successBadge : styles.neutralBadge),
                        }}
                      >
                        {item.rootFolderUrl ? "DRIVE CONNECTED" : "NO DRIVE"}
                      </span>
                    </div>
                  </div>

                  <div style={styles.infoGrid}>
                    <div>
                      <div style={styles.label}>Slug</div>
                      <div style={styles.value}>{item.slug}</div>
                    </div>
                    <div>
                      <div style={styles.label}>Plan</div>
                      <div style={styles.value}>{item.plan || "—"}</div>
                    </div>
                    <div>
                      <div style={styles.label}>NIP</div>
                      <div style={styles.value}>{item.nip || "—"}</div>
                    </div>
                    <div>
                      <div style={styles.label}>Miasto</div>
                      <div style={styles.value}>{item.city || "—"}</div>
                    </div>
                    <div>
                      <div style={styles.label}>Kontakt</div>
                      <div style={styles.value}>{contactName || "—"}</div>
                    </div>
                    <div>
                      <div style={styles.label}>E-mail</div>
                      <div style={styles.value}>{item.email || "—"}</div>
                    </div>
                    <div>
                      <div style={styles.label}>Telefon</div>
                      <div style={styles.value}>{item.phone || "—"}</div>
                    </div>
                    <div>
                      <div style={styles.label}>Adres</div>
                      <div style={styles.value}>{address || "—"}</div>
                    </div>
                  </div>

                  <div style={styles.cardActions}>
                    <Link href={`/organizations/${item.id}`} style={styles.secondaryLinkButton}>
                      Szczegóły
                    </Link>

                    <button
                      type="button"
                      onClick={() => startEdit(item)}
                      style={styles.secondaryButton}
                    >
                      Edytuj
                    </button>

                    <button
                      type="button"
                      onClick={() => void handleProvisionDrive(item.id)}
                      disabled={provisioningId === item.id}
                      style={styles.secondaryButton}
                    >
                      {provisioningId === item.id ? "Provisioning..." : "Provision Drive"}
                    </button>

                    <button
                      type="button"
                      onClick={() => void handleSyncProfile(item.id)}
                      disabled={syncingId === item.id}
                      style={styles.secondaryButton}
                    >
                      {syncingId === item.id ? "Sync..." : "Sync profile"}
                    </button>

                    {item.rootFolderUrl ? (
                      <a
                        href={item.rootFolderUrl}
                        target="_blank"
                        rel="noreferrer"
                        style={styles.secondaryLinkButton}
                      >
                        Otwórz Drive
                      </a>
                    ) : null}

                    <button
                      type="button"
                      onClick={() => void handleDelete(item.id)}
                      disabled={deletingId === item.id}
                      style={styles.dangerButton}
                    >
                      {deletingId === item.id ? "Usuwanie..." : "Usuń"}
                    </button>
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

const styles: Record<string, CSSProperties> = {
  page: {
    color: "#f5f7ff",
    display: "grid",
    gap: 22,
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
    gap: 16,
    flexWrap: "wrap",
  },
  eyebrow: {
    display: "inline-flex",
    alignItems: "center",
    padding: "8px 12px",
    borderRadius: 999,
    fontSize: 11,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    color: "#cdd6ff",
    border: "1px solid rgba(138,154,255,0.22)",
    background: "rgba(90,110,255,0.08)",
    marginBottom: 14,
  },
  title: {
    margin: 0,
    fontSize: 34,
    lineHeight: 1.02,
    fontWeight: 900,
  },
  subtitle: {
    margin: "10px 0 0 0",
    maxWidth: 880,
    color: "#99a6d3",
    fontSize: 15,
    lineHeight: 1.65,
  },
  headerActions: {
    display: "flex",
    gap: 12,
    alignItems: "center",
  },
  searchInput: {
    height: 46,
    minWidth: 320,
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.1)",
    background: "rgba(10,16,36,0.86)",
    color: "#fff",
    padding: "0 14px",
    outline: "none",
  },
  card: {
    borderRadius: 24,
    border: "1px solid rgba(255,255,255,0.08)",
    background:
      "linear-gradient(180deg, rgba(14,20,44,0.88) 0%, rgba(10,15,36,0.92) 100%)",
    boxShadow: "0 20px 60px rgba(0,0,0,0.24)",
    padding: 22,
  },
  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 16,
    flexWrap: "wrap",
    marginBottom: 18,
  },
  sectionTitle: {
    margin: 0,
    fontSize: 28,
    fontWeight: 800,
  },
  sectionText: {
    margin: "8px 0 0 0",
    color: "#95a0cb",
    fontSize: 14,
    lineHeight: 1.6,
    maxWidth: 880,
  },
  form: {
    display: "grid",
    gap: 18,
  },
  formSection: {
    display: "grid",
    gap: 12,
    padding: 16,
    borderRadius: 18,
    border: "1px solid rgba(255,255,255,0.06)",
    background: "rgba(255,255,255,0.02)",
  },
  formSectionTitle: {
    fontSize: 13,
    fontWeight: 800,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: "#9fb0ef",
  },
  grid3: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: 12,
  },
  grid4: {
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
    gap: 12,
  },
  input: {
    height: 48,
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.1)",
    background: "#0b1025",
    color: "#fff",
    padding: "0 14px",
    outline: "none",
  },
  textarea: {
    minHeight: 130,
    borderRadius: 16,
    border: "1px solid rgba(255,255,255,0.1)",
    background: "#0b1025",
    color: "#fff",
    padding: 14,
    outline: "none",
    resize: "vertical",
    fontFamily: "inherit",
  },
  checkboxCard: {
    minHeight: 48,
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.1)",
    background: "#0b1025",
    color: "#fff",
    padding: "0 14px",
    display: "flex",
    alignItems: "center",
    gap: 10,
  },
  actionsRow: {
    display: "flex",
    gap: 12,
    flexWrap: "wrap",
  },
  primaryButton: {
    height: 48,
    padding: "0 18px",
    borderRadius: 14,
    border: "none",
    cursor: "pointer",
    fontWeight: 800,
    color: "#fff",
    background: "linear-gradient(90deg, #d91cff 0%, #7f7dff 48%, #10d7ff 100%)",
    boxShadow: "0 10px 28px rgba(109,124,255,0.35)",
  },
  secondaryButton: {
    height: 42,
    padding: "0 14px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "transparent",
    color: "#fff",
    cursor: "pointer",
    fontWeight: 700,
    textDecoration: "none",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryLinkButton: {
    height: 42,
    padding: "0 14px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "transparent",
    color: "#fff",
    cursor: "pointer",
    fontWeight: 700,
    textDecoration: "none",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
  },
  dangerButton: {
    height: 42,
    padding: "0 14px",
    borderRadius: 12,
    border: "1px solid rgba(255,120,120,0.2)",
    background: "rgba(255,80,80,0.08)",
    color: "#ffb3b3",
    cursor: "pointer",
    fontWeight: 700,
  },
  error: {
    margin: 0,
    color: "#ff9c9c",
    fontSize: 14,
  },
  muted: {
    color: "#9aa6d4",
    margin: 0,
  },
  emptyState: {
    display: "grid",
    gap: 8,
    borderRadius: 18,
    border: "1px dashed rgba(255,255,255,0.12)",
    padding: 22,
    color: "#aab5de",
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 800,
    color: "#eef2ff",
  },
  emptyText: {
    fontSize: 14,
    lineHeight: 1.6,
  },
  cardsGrid: {
    display: "grid",
    gap: 16,
  },
  clientCard: {
    borderRadius: 20,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(7,11,28,0.86)",
    padding: 18,
    display: "grid",
    gap: 16,
  },
  clientCardTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 16,
    flexWrap: "wrap",
  },
  clientName: {
    margin: 0,
    fontSize: 26,
    fontWeight: 900,
  },
  clientMetaLine: {
    marginTop: 6,
    color: "#9ea9d4",
    fontSize: 14,
  },
  cardBadges: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
  },
  badge: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 34,
    padding: "0 12px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 800,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.04)",
    color: "#e7ebff",
  },
  successBadge: {
    color: "#70ffb8",
    background: "rgba(43,214,122,0.12)",
    border: "1px solid rgba(43,214,122,0.24)",
  },
  neutralBadge: {
    color: "#c8d2ff",
  },
  infoGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
    gap: 14,
  },
  label: {
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    color: "#8493c7",
    marginBottom: 6,
  },
  value: {
    color: "#f5f7ff",
    fontSize: 14,
    lineHeight: 1.5,
    wordBreak: "break-word",
  },
  cardActions: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
  },
};