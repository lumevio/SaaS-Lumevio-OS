"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState, type CSSProperties } from "react";
import { apiClient } from "@/lib/api-client";

type ClientProfileResponse = {
  organization: {
    id: string;
    name: string;
    legalName?: string | null;
    slug: string;
    type?: string | null;
    status?: string | null;
    industry?: string | null;
    nip?: string | null;
    regon?: string | null;
    krs?: string | null;
    vatEu?: string | null;
    email?: string | null;
    phone?: string | null;
    website?: string | null;
    contact?: {
      firstName?: string | null;
      lastName?: string | null;
      position?: string | null;
    };
    address?: {
      street?: string | null;
      buildingNo?: string | null;
      unitNo?: string | null;
      postalCode?: string | null;
      city?: string | null;
      country?: string | null;
    };
    notes?: string | null;
    createdAt?: string | null;
    updatedAt?: string | null;
  };
  drive: {
    syncEnabled?: boolean | null;
    folderId?: string | null;
    folderUrl?: string | null;
    rootFolderName: string;
    blueprint: {
      root: string;
      folders: Array<{
        name: string;
        files: string[];
      }>;
    };
  };
  operations: {
    totalCampaigns: number;
    totalStores: number;
    latestCampaigns: Array<{
      id: string;
      name: string;
      slug?: string | null;
      type?: string | null;
      status?: string | null;
      createdAt?: string | null;
    }>;
    latestStores: Array<{
      id: string;
      name: string;
      city?: string | null;
      region?: string | null;
      addressLine1?: string | null;
      createdAt?: string | null;
    }>;
  };
  clientProfileFiles: {
    jsonFileName: string;
    txtFileName: string;
  };
};

type OrganizationUpdatePayload = {
  name?: string;
  slug?: string;
  legalName?: string;
  type?: string;
  status?: string;
  industry?: string;
  plan?: string;
  nip?: string;
  regon?: string;
  krs?: string;
  vatEu?: string;
  email?: string;
  phone?: string;
  website?: string;
  contactFirstName?: string;
  contactLastName?: string;
  contactPosition?: string;
  street?: string;
  buildingNo?: string;
  unitNo?: string;
  postalCode?: string;
  city?: string;
  country?: string;
  notes?: string;
  rootFolderId?: string;
  rootFolderUrl?: string;
  syncEnabled?: boolean;
};

type Props = {
  params: Promise<{
    id: string;
  }>;
};

export default function OrganizationDetailsPage({ params }: Props) {
  const [organizationId, setOrganizationId] = useState<string>("");
  const [profile, setProfile] = useState<ClientProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [provisioning, setProvisioning] = useState(false);
  const [syncingJson, setSyncingJson] = useState(false);
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<OrganizationUpdatePayload>({
    name: "",
    slug: "",
    legalName: "",
    type: "ENTERPRISE",
    status: "ACTIVE",
    industry: "",
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
    country: "Poland",
    notes: "",
    rootFolderId: "",
    rootFolderUrl: "",
    syncEnabled: true,
  });

  useEffect(() => {
    async function resolveParamsAndLoad() {
      const resolved = await params;
      setOrganizationId(resolved.id);
    }

    void resolveParamsAndLoad();
  }, [params]);

  useEffect(() => {
    if (!organizationId) return;
    void loadProfile(organizationId);
  }, [organizationId]);

  async function loadProfile(id: string) {
    try {
      setLoading(true);
      setError(null);
      setSaved(false);

      const data = await apiClient<ClientProfileResponse>(`/organizations/${id}/profile`);
      setProfile(data);

      setForm({
        name: data.organization.name || "",
        slug: data.organization.slug || "",
        legalName: data.organization.legalName || "",
        type: data.organization.type || "ENTERPRISE",
        status: data.organization.status || "ACTIVE",
        industry: data.organization.industry || "",
        nip: data.organization.nip || "",
        regon: data.organization.regon || "",
        krs: data.organization.krs || "",
        vatEu: data.organization.vatEu || "",
        email: data.organization.email || "",
        phone: data.organization.phone || "",
        website: data.organization.website || "",
        contactFirstName: data.organization.contact?.firstName || "",
        contactLastName: data.organization.contact?.lastName || "",
        contactPosition: data.organization.contact?.position || "",
        street: data.organization.address?.street || "",
        buildingNo: data.organization.address?.buildingNo || "",
        unitNo: data.organization.address?.unitNo || "",
        postalCode: data.organization.address?.postalCode || "",
        city: data.organization.address?.city || "",
        country: data.organization.address?.country || "Poland",
        notes: data.organization.notes || "",
        rootFolderId: data.drive.folderId || "",
        rootFolderUrl: data.drive.folderUrl || "",
        syncEnabled: data.drive.syncEnabled ?? true,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nie udało się pobrać profilu klienta");
    } finally {
      setLoading(false);
    }
  }

  function setField<K extends keyof OrganizationUpdatePayload>(
    key: K,
    value: OrganizationUpdatePayload[K],
  ) {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
    setSaved(false);
  }

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    if (!organizationId) return;

    try {
      setSaving(true);
      setError(null);
      setSaved(false);

      await apiClient(`/organizations/${organizationId}`, {
        method: "PATCH",
        body: JSON.stringify(form),
      });

      await loadProfile(organizationId);
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nie udało się zapisać organizacji");
    } finally {
      setSaving(false);
    }
  }

  async function handleProvisionDrive() {
    if (!organizationId) return;

    try {
      setProvisioning(true);
      setError(null);

      await apiClient(`/organizations/${organizationId}/drive/provision`, {
        method: "POST",
      });

      await loadProfile(organizationId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nie udało się utworzyć struktury Drive");
    } finally {
      setProvisioning(false);
    }
  }

  async function handleSyncJson() {
    if (!organizationId) return;

    try {
      setSyncingJson(true);
      setError(null);

      await apiClient(`/organizations/${organizationId}/drive/sync-profile`, {
        method: "POST",
      });

      await loadProfile(organizationId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nie udało się zapisać profilu do Drive");
    } finally {
      setSyncingJson(false);
    }
  }

  async function copyJsonPreview() {
    if (!profile) return;

    try {
      await navigator.clipboard.writeText(JSON.stringify(profile, null, 2));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nie udało się skopiować JSON");
    }
  }

  const driveConnected = useMemo(() => {
    return Boolean(profile?.drive?.folderUrl);
  }, [profile]);

  if (loading || !profile) {
    return (
      <main style={styles.page}>
        <div style={styles.loadingBox}>Ładowanie profilu klienta...</div>
      </main>
    );
  }

  return (
    <main style={styles.page}>
      <div style={styles.topBackRow}>
        <Link href="/organizations" style={styles.backLink}>
          ← Wróć do organizacji
        </Link>
      </div>

      <section style={styles.heroCard}>
        <div style={styles.heroGlow} />

        <div style={styles.heroTop}>
          <div>
            <div style={styles.heroPill}>Client Profile</div>
            <h1 style={styles.heroTitle}>{profile.organization.name}</h1>
            <p style={styles.heroSubtitle}>
              Pełna karta klienta LUMEVIO: dane firmy, kontakt, operacje, Drive i JSON profilowy.
            </p>
          </div>

          <div style={styles.heroBadges}>
            <span style={styles.badge}>{profile.organization.type || "ENTERPRISE"}</span>
            <span style={styles.badgePrimary}>{profile.organization.status || "ACTIVE"}</span>
            <span
              style={{
                ...styles.badge,
                ...(driveConnected ? styles.driveBadgeOn : styles.driveBadgeOff),
              }}
            >
              {driveConnected ? "DRIVE CONNECTED" : "NO DRIVE"}
            </span>
          </div>
        </div>

        <div style={styles.metricsGrid}>
          <div style={styles.metricCard}>
            <div style={styles.metricLabel}>Kampanie</div>
            <div style={styles.metricValue}>{profile.operations.totalCampaigns}</div>
          </div>

          <div style={styles.metricCard}>
            <div style={styles.metricLabel}>Sklepy</div>
            <div style={styles.metricValue}>{profile.operations.totalStores}</div>
          </div>

          <div style={styles.metricCardWide}>
            <div style={styles.metricLabel}>Folder klienta</div>
            {profile.drive.folderUrl ? (
              <a
                href={profile.drive.folderUrl}
                target="_blank"
                rel="noreferrer"
                style={styles.driveLink}
              >
                Otwórz folder Google Drive
              </a>
            ) : (
              <div style={styles.metricMuted}>Folder nie został jeszcze utworzony</div>
            )}
          </div>
        </div>
      </section>

      <form onSubmit={handleSave} style={styles.contentGrid}>
        <section style={styles.formCard}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>Dane klienta</h2>
            <div style={styles.formActions}>
              <button type="submit" disabled={saving} style={styles.primaryButton}>
                {saving ? "Zapisywanie..." : "Zapisz zmiany"}
              </button>

              <button
                type="button"
                onClick={() => void handleProvisionDrive()}
                disabled={provisioning}
                style={styles.secondaryButton}
              >
                {provisioning ? "Provisioning..." : "Utwórz / odtwórz Drive"}
              </button>

              <button
                type="button"
                onClick={() => void handleSyncJson()}
                disabled={syncingJson}
                style={styles.secondaryButton}
              >
                {syncingJson ? "Zapisywanie JSON..." : "Zapisz profil do Drive JSON"}
              </button>
            </div>
          </div>

          {saved ? <div style={styles.successBox}>Zmiany zapisane.</div> : null}
          {error ? <div style={styles.errorBox}>{error}</div> : null}

          <div style={styles.formSection}>
            <div style={styles.formSectionTitle}>Dane podstawowe</div>
            <div style={styles.grid4}>
              <input
                value={form.name || ""}
                onChange={(e) => setField("name", e.target.value)}
                placeholder="Nazwa organizacji"
                style={styles.input}
              />
              <input
                value={form.legalName || ""}
                onChange={(e) => setField("legalName", e.target.value)}
                placeholder="Pełna nazwa prawna"
                style={styles.input}
              />
              <input
                value={form.slug || ""}
                onChange={(e) => setField("slug", e.target.value)}
                placeholder="Slug"
                style={styles.input}
              />
              <input
                value={form.industry || ""}
                onChange={(e) => setField("industry", e.target.value)}
                placeholder="Branża"
                style={styles.input}
              />
            </div>

            <div style={styles.grid4}>
              <select
                value={form.type || "ENTERPRISE"}
                onChange={(e) => setField("type", e.target.value)}
                style={styles.input}
              >
                <option value="ENTERPRISE">ENTERPRISE</option>
                <option value="MID_MARKET">MID_MARKET</option>
                <option value="SMB">SMB</option>
                <option value="PILOT">PILOT</option>
                <option value="PARTNER">PARTNER</option>
              </select>

              <select
                value={form.status || "ACTIVE"}
                onChange={(e) => setField("status", e.target.value)}
                style={styles.input}
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="ONBOARDING">ONBOARDING</option>
                <option value="PENDING">PENDING</option>
                <option value="INACTIVE">INACTIVE</option>
                <option value="ARCHIVED">ARCHIVED</option>
              </select>

              <input
                value={form.nip || ""}
                onChange={(e) => setField("nip", e.target.value)}
                placeholder="NIP"
                style={styles.input}
              />
              <input
                value={form.regon || ""}
                onChange={(e) => setField("regon", e.target.value)}
                placeholder="REGON"
                style={styles.input}
              />
            </div>

            <div style={styles.grid4}>
              <input
                value={form.krs || ""}
                onChange={(e) => setField("krs", e.target.value)}
                placeholder="KRS"
                style={styles.input}
              />
              <input
                value={form.vatEu || ""}
                onChange={(e) => setField("vatEu", e.target.value)}
                placeholder="VAT EU"
                style={styles.input}
              />
              <input
                value={form.email || ""}
                onChange={(e) => setField("email", e.target.value)}
                placeholder="E-mail"
                style={styles.input}
              />
              <input
                value={form.phone || ""}
                onChange={(e) => setField("phone", e.target.value)}
                placeholder="Telefon"
                style={styles.input}
              />
            </div>

            <div style={styles.grid2}>
              <input
                value={form.website || ""}
                onChange={(e) => setField("website", e.target.value)}
                placeholder="Strona WWW"
                style={styles.input}
              />
            </div>
          </div>

          <div style={styles.formSection}>
            <div style={styles.formSectionTitle}>Kontakt i adres</div>

            <div style={styles.grid4}>
              <input
                value={form.contactFirstName || ""}
                onChange={(e) => setField("contactFirstName", e.target.value)}
                placeholder="Imię kontaktu"
                style={styles.input}
              />
              <input
                value={form.contactLastName || ""}
                onChange={(e) => setField("contactLastName", e.target.value)}
                placeholder="Nazwisko kontaktu"
                style={styles.input}
              />
              <input
                value={form.contactPosition || ""}
                onChange={(e) => setField("contactPosition", e.target.value)}
                placeholder="Stanowisko"
                style={styles.input}
              />
              <input
                value={form.country || ""}
                onChange={(e) => setField("country", e.target.value)}
                placeholder="Kraj"
                style={styles.input}
              />
            </div>

            <div style={styles.grid4}>
              <input
                value={form.street || ""}
                onChange={(e) => setField("street", e.target.value)}
                placeholder="Ulica"
                style={styles.input}
              />
              <input
                value={form.buildingNo || ""}
                onChange={(e) => setField("buildingNo", e.target.value)}
                placeholder="Nr budynku"
                style={styles.input}
              />
              <input
                value={form.unitNo || ""}
                onChange={(e) => setField("unitNo", e.target.value)}
                placeholder="Nr lokalu"
                style={styles.input}
              />
              <input
                value={form.postalCode || ""}
                onChange={(e) => setField("postalCode", e.target.value)}
                placeholder="Kod pocztowy"
                style={styles.input}
              />
            </div>

            <div style={styles.grid2}>
              <input
                value={form.city || ""}
                onChange={(e) => setField("city", e.target.value)}
                placeholder="Miasto"
                style={styles.input}
              />
            </div>
          </div>

          <div style={styles.formSection}>
            <div style={styles.formSectionTitle}>Drive i notatki</div>

            <div style={styles.grid3}>
              <input
                value={form.rootFolderId || ""}
                onChange={(e) => setField("rootFolderId", e.target.value)}
                placeholder="Root folder ID"
                style={styles.input}
              />
              <input
                value={form.rootFolderUrl || ""}
                onChange={(e) => setField("rootFolderUrl", e.target.value)}
                placeholder="Root folder URL"
                style={styles.input}
              />
              <label style={styles.checkboxCard}>
                <input
                  type="checkbox"
                  checked={Boolean(form.syncEnabled)}
                  onChange={(e) => setField("syncEnabled", e.target.checked)}
                />
                <span>Włącz synchronizację Drive</span>
              </label>
            </div>

            <textarea
              value={form.notes || ""}
              onChange={(e) => setField("notes", e.target.value)}
              placeholder="Notatki operacyjne, handlowe i wdrożeniowe..."
              style={styles.textarea}
            />
          </div>
        </section>

        <aside style={styles.sideColumn}>
          <section style={styles.sideCard}>
            <div style={styles.sectionHeaderSmall}>
              <h3 style={styles.sectionTitleSmall}>Blueprint Drive</h3>
            </div>

            <div style={styles.driveRootBox}>
              <div style={styles.driveRootLabel}>Root</div>
              <div style={styles.driveRootValue}>{profile.drive.rootFolderName}</div>
            </div>

            <div style={styles.folderList}>
              {profile.drive.blueprint.folders.map((folder) => (
                <div key={folder.name} style={styles.folderCard}>
                  <div style={styles.folderName}>{folder.name}</div>
                  <div style={styles.folderFiles}>
                    {folder.files.length === 0 ? (
                      <div style={styles.folderEmpty}>Brak plików startowych</div>
                    ) : (
                      folder.files.map((file) => (
                        <div key={file} style={styles.fileBadge}>
                          {file}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section style={styles.sideCard}>
            <div style={styles.sectionHeaderSmall}>
              <h3 style={styles.sectionTitleSmall}>Client Profile JSON</h3>
              <button type="button" onClick={() => void copyJsonPreview()} style={styles.copyButton}>
                {copied ? "Skopiowano" : "Kopiuj JSON"}
              </button>
            </div>

            <pre style={styles.jsonBox}>{JSON.stringify(profile, null, 2)}</pre>
          </section>

          <section style={styles.sideCard}>
            <h3 style={styles.sectionTitleSmall}>Ostatnie kampanie</h3>
            <div style={styles.miniList}>
              {profile.operations.latestCampaigns.length === 0 ? (
                <div style={styles.emptyMini}>Brak kampanii</div>
              ) : (
                profile.operations.latestCampaigns.map((campaign) => (
                  <div key={campaign.id} style={styles.miniItem}>
                    <div style={styles.miniItemTitle}>{campaign.name}</div>
                    <div style={styles.miniItemMeta}>
                      {campaign.slug || "—"} · {campaign.status || "ACTIVE"}
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          <section style={styles.sideCard}>
            <h3 style={styles.sectionTitleSmall}>Ostatnie sklepy</h3>
            <div style={styles.miniList}>
              {profile.operations.latestStores.length === 0 ? (
                <div style={styles.emptyMini}>Brak sklepów</div>
              ) : (
                profile.operations.latestStores.map((store) => (
                  <div key={store.id} style={styles.miniItem}>
                    <div style={styles.miniItemTitle}>{store.name}</div>
                    <div style={styles.miniItemMeta}>{store.city || "—"}</div>
                  </div>
                ))
              )}
            </div>
          </section>
        </aside>
      </form>
    </main>
  );
}

const styles: Record<string, CSSProperties> = {
  page: {
    display: "grid",
    gap: 24,
    color: "#fff",
  },
  topBackRow: {
    display: "flex",
    alignItems: "center",
  },
  backLink: {
    color: "#9ab0ff",
    textDecoration: "none",
    fontWeight: 700,
  },
  loadingBox: {
    borderRadius: 20,
    padding: 20,
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
  },
  heroCard: {
    position: "relative",
    overflow: "hidden",
    borderRadius: 28,
    border: "1px solid rgba(255,255,255,0.08)",
    background:
      "linear-gradient(180deg, rgba(13,18,44,0.92) 0%, rgba(10,14,35,0.96) 100%)",
    padding: 24,
    boxShadow: "0 30px 80px rgba(0,0,0,0.32)",
  },
  heroGlow: {
    position: "absolute",
    top: -120,
    right: -120,
    width: 340,
    height: 340,
    borderRadius: "50%",
    background:
      "radial-gradient(circle, rgba(228,92,255,0.16) 0%, rgba(66,215,255,0.12) 38%, rgba(0,0,0,0) 70%)",
    filter: "blur(16px)",
    pointerEvents: "none",
  },
  heroTop: {
    display: "flex",
    justifyContent: "space-between",
    gap: 18,
    alignItems: "flex-start",
    flexWrap: "wrap",
    marginBottom: 20,
  },
  heroPill: {
    display: "inline-flex",
    alignItems: "center",
    minHeight: 30,
    padding: "0 12px",
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.08)",
    background:
      "linear-gradient(90deg, rgba(228,92,255,0.14) 0%, rgba(109,124,255,0.10) 48%, rgba(66,215,255,0.12) 100%)",
    color: "#C7D5FF",
    fontSize: 12,
    fontWeight: 800,
    letterSpacing: "0.14em",
    textTransform: "uppercase",
    marginBottom: 14,
  },
  heroTitle: {
    margin: 0,
    fontSize: 36,
    lineHeight: 1.02,
    fontWeight: 900,
    letterSpacing: "-0.03em",
    background:
      "linear-gradient(90deg, #FFFFFF 0%, #EEE8FF 32%, #C3CFFF 62%, #85E7FF 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },
  heroSubtitle: {
    margin: "12px 0 0 0",
    maxWidth: 920,
    color: "#AAB7EE",
    fontSize: 16,
    lineHeight: 1.65,
  },
  heroBadges: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
  },
  badge: {
    display: "inline-flex",
    alignItems: "center",
    minHeight: 34,
    padding: "0 12px",
    borderRadius: 999,
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
    color: "#DCE5FF",
    fontSize: 12,
    fontWeight: 800,
  },
  badgePrimary: {
    display: "inline-flex",
    alignItems: "center",
    minHeight: 34,
    padding: "0 12px",
    borderRadius: 999,
    background:
      "linear-gradient(90deg, rgba(228,92,255,0.18) 0%, rgba(109,124,255,0.16) 50%, rgba(66,215,255,0.18) 100%)",
    border: "1px solid rgba(255,255,255,0.10)",
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: 800,
  },
  driveBadgeOn: {
    background: "rgba(80,200,120,0.12)",
    border: "1px solid rgba(80,200,120,0.22)",
    color: "#bfffd2",
  },
  driveBadgeOff: {
    background: "rgba(255,90,90,0.12)",
    border: "1px solid rgba(255,90,90,0.20)",
    color: "#ffc4c4",
  },
  metricsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: 16,
  },
  metricCard: {
    borderRadius: 18,
    border: "1px solid rgba(255,255,255,0.06)",
    background: "rgba(255,255,255,0.025)",
    padding: 18,
    display: "grid",
    gap: 8,
  },
  metricCardWide: {
    borderRadius: 18,
    border: "1px solid rgba(255,255,255,0.06)",
    background: "rgba(255,255,255,0.025)",
    padding: 18,
    display: "grid",
    gap: 8,
  },
  metricLabel: {
    fontSize: 12,
    color: "#8FA4E8",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    fontWeight: 700,
  },
  metricValue: {
    fontSize: 32,
    fontWeight: 900,
    letterSpacing: "-0.04em",
  },
  metricMuted: {
    color: "#A4B2E7",
  },
  driveLink: {
    color: "#8bdfff",
    textDecoration: "none",
    fontWeight: 700,
  },
  contentGrid: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1.45fr) minmax(360px, 0.9fr)",
    gap: 24,
    alignItems: "start",
  },
  formCard: {
    borderRadius: 28,
    border: "1px solid rgba(255,255,255,0.08)",
    background:
      "linear-gradient(180deg, rgba(10,14,35,0.92) 0%, rgba(6,10,26,0.96) 100%)",
    padding: 24,
    display: "grid",
    gap: 18,
  },
  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    gap: 16,
    alignItems: "flex-start",
    flexWrap: "wrap",
  },
  sectionTitle: {
    margin: 0,
    fontSize: 24,
    fontWeight: 900,
    letterSpacing: "-0.02em",
  },
  formActions: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
  },
  primaryButton: {
    minHeight: 46,
    borderRadius: 14,
    border: "none",
    padding: "0 18px",
    fontWeight: 800,
    cursor: "pointer",
    color: "#08101F",
    background: "linear-gradient(90deg, #E45CFF 0%, #8D8CFF 46%, #42D7FF 100%)",
  },
  secondaryButton: {
    minHeight: 46,
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.10)",
    padding: "0 14px",
    fontWeight: 700,
    cursor: "pointer",
    background: "rgba(255,255,255,0.03)",
    color: "#fff",
  },
  successBox: {
    borderRadius: 16,
    padding: 14,
    background: "rgba(80,200,120,0.10)",
    border: "1px solid rgba(80,200,120,0.20)",
    color: "#c8ffd7",
    fontWeight: 700,
  },
  errorBox: {
    borderRadius: 16,
    padding: 14,
    background: "rgba(255,90,90,0.10)",
    border: "1px solid rgba(255,90,90,0.18)",
    color: "#ffc0c0",
    fontWeight: 700,
  },
  formSection: {
    borderRadius: 22,
    border: "1px solid rgba(255,255,255,0.06)",
    background: "rgba(255,255,255,0.025)",
    padding: 18,
    display: "grid",
    gap: 16,
  },
  formSectionTitle: {
    fontSize: 18,
    fontWeight: 800,
    color: "#F6F8FF",
  },
  grid2: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: 16,
  },
  grid3: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: 16,
  },
  grid4: {
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
    gap: 16,
  },
  input: {
    height: 50,
    borderRadius: 16,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(8,12,30,0.82)",
    color: "#fff",
    padding: "0 14px",
    outline: "none",
    fontSize: 14,
  },
  textarea: {
    minHeight: 140,
    borderRadius: 16,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(8,12,30,0.82)",
    color: "#fff",
    padding: 14,
    outline: "none",
    fontSize: 14,
    resize: "vertical",
  },
  checkboxCard: {
    minHeight: 50,
    borderRadius: 16,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(8,12,30,0.82)",
    padding: "0 14px",
    display: "flex",
    alignItems: "center",
    gap: 10,
    color: "#fff",
    fontWeight: 600,
  },
  sideColumn: {
    display: "grid",
    gap: 18,
  },
  sideCard: {
    borderRadius: 24,
    border: "1px solid rgba(255,255,255,0.08)",
    background:
      "linear-gradient(180deg, rgba(10,14,35,0.92) 0%, rgba(6,10,26,0.96) 100%)",
    padding: 20,
    display: "grid",
    gap: 16,
  },
  sectionHeaderSmall: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    alignItems: "center",
  },
  sectionTitleSmall: {
    margin: 0,
    fontSize: 18,
    fontWeight: 900,
  },
  copyButton: {
    minHeight: 36,
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.10)",
    padding: "0 12px",
    fontWeight: 700,
    cursor: "pointer",
    background: "rgba(255,255,255,0.03)",
    color: "#fff",
  },
  driveRootBox: {
    borderRadius: 18,
    border: "1px solid rgba(255,255,255,0.06)",
    background: "rgba(255,255,255,0.025)",
    padding: 16,
  },
  driveRootLabel: {
    fontSize: 12,
    color: "#8FA4E8",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    fontWeight: 700,
    marginBottom: 8,
  },
  driveRootValue: {
    fontSize: 18,
    fontWeight: 800,
  },
  folderList: {
    display: "grid",
    gap: 12,
  },
  folderCard: {
    borderRadius: 16,
    border: "1px solid rgba(255,255,255,0.06)",
    background: "rgba(255,255,255,0.025)",
    padding: 14,
    display: "grid",
    gap: 10,
  },
  folderName: {
    fontWeight: 800,
  },
  folderFiles: {
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
  },
  folderEmpty: {
    color: "#9aace7",
    fontSize: 13,
  },
  fileBadge: {
    borderRadius: 999,
    padding: "6px 10px",
    fontSize: 12,
    background: "rgba(109,124,255,0.12)",
    border: "1px solid rgba(109,124,255,0.20)",
    color: "#dfe5ff",
  },
  jsonBox: {
    margin: 0,
    padding: 14,
    borderRadius: 16,
    background: "rgba(8,12,30,0.92)",
    border: "1px solid rgba(255,255,255,0.06)",
    color: "#dce6ff",
    overflowX: "auto",
    fontSize: 12,
    lineHeight: 1.55,
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
  },
  miniList: {
    display: "grid",
    gap: 10,
  },
  miniItem: {
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.06)",
    background: "rgba(255,255,255,0.025)",
    padding: 12,
  },
  miniItemTitle: {
    fontWeight: 800,
  },
  miniItemMeta: {
    marginTop: 6,
    color: "#9aace7",
    fontSize: 13,
  },
  emptyMini: {
    color: "#9aace7",
  },
};