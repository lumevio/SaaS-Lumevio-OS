"use client";

import { FormEvent, useEffect, useState, type CSSProperties } from "react";
import { apiClient } from "@/lib/api-client";

type SettingsPayload = {
  platformName: string;
  supportEmail: string;
  accentColor: string;
  appBaseUrl: string;
  apiBaseUrl: string;
  publicBaseUrl: string;
  defaultCampaignPageType: string;
  defaultCampaignPageMode: string;
  defaultCampaignDomain: string;
  defaultTagPrefix: string;
  trackIp: boolean;
  trackUserAgent: boolean;
  trackReferer: boolean;
  allowCustomDomains: boolean;
  maintenanceMode: boolean;
  googleDriveEnabled: boolean;
  googleDriveScriptUrl: string;
  googleDriveRootFolderId: string;
  googleDriveRootFolderUrl: string;
};

const INITIAL_SETTINGS: SettingsPayload = {
  platformName: "LUMEVIO OS",
  supportEmail: "admin@lumevio.pl",
  accentColor: "#6d7cff",
  appBaseUrl: "http://127.0.0.1:3000",
  apiBaseUrl: "http://127.0.0.1:3001",
  publicBaseUrl: "http://127.0.0.1:3002",
  defaultCampaignPageType: "landing",
  defaultCampaignPageMode: "hosted",
  defaultCampaignDomain: "lumevio",
  defaultTagPrefix: "nfc",
  trackIp: true,
  trackUserAgent: true,
  trackReferer: true,
  allowCustomDomains: false,
  maintenanceMode: false,
  googleDriveEnabled: false,
  googleDriveScriptUrl: "",
  googleDriveRootFolderId: "",
  googleDriveRootFolderUrl: "",
};

export default function SettingsPage() {
  const [settings, setSettings] = useState<SettingsPayload>(INITIAL_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function setField<K extends keyof SettingsPayload>(
    key: K,
    value: SettingsPayload[K],
  ) {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
    setSaved(false);
  }

  async function loadSettings() {
    try {
      setLoading(true);
      setError(null);
      const data = await apiClient<SettingsPayload>("/settings");
      setSettings({
        ...INITIAL_SETTINGS,
        ...data,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nie udało się pobrać ustawień");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadSettings();
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    try {
      setSubmitting(true);
      setSaved(false);
      setError(null);

      const data = await apiClient<SettingsPayload>("/settings", {
        method: "PUT",
        body: JSON.stringify(settings),
      });

      setSettings({
        ...INITIAL_SETTINGS,
        ...data,
      });
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nie udało się zapisać ustawień");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <div style={styles.loading}>Ładowanie ustawień...</div>;
  }

  return (
    <main style={styles.page}>
      <form onSubmit={handleSubmit} style={styles.form}>
        <section style={styles.sectionCard}>
          <h2 style={styles.sectionTitle}>Platforma</h2>
          <div style={styles.grid3}>
            <input
              value={settings.platformName}
              onChange={(e) => setField("platformName", e.target.value)}
              placeholder="Nazwa platformy"
              style={styles.input}
            />
            <input
              value={settings.supportEmail}
              onChange={(e) => setField("supportEmail", e.target.value)}
              placeholder="E-mail supportu"
              style={styles.input}
            />
            <input
              value={settings.accentColor}
              onChange={(e) => setField("accentColor", e.target.value)}
              placeholder="#6d7cff"
              style={styles.input}
            />
          </div>
        </section>

        <section style={styles.sectionCard}>
          <h2 style={styles.sectionTitle}>Domeny i URL</h2>
          <div style={styles.grid3}>
            <input
              value={settings.appBaseUrl}
              onChange={(e) => setField("appBaseUrl", e.target.value)}
              placeholder="App base URL"
              style={styles.input}
            />
            <input
              value={settings.apiBaseUrl}
              onChange={(e) => setField("apiBaseUrl", e.target.value)}
              placeholder="API base URL"
              style={styles.input}
            />
            <input
              value={settings.publicBaseUrl}
              onChange={(e) => setField("publicBaseUrl", e.target.value)}
              placeholder="Public base URL"
              style={styles.input}
            />
          </div>
        </section>

        <section style={styles.sectionCard}>
          <h2 style={styles.sectionTitle}>Domyślne kampanie</h2>
          <div style={styles.grid4}>
            <select
              value={settings.defaultCampaignPageType}
              onChange={(e) => setField("defaultCampaignPageType", e.target.value)}
              style={styles.input}
            >
              <option value="landing">Landing</option>
              <option value="contest">Contest</option>
              <option value="coupon">Coupon</option>
              <option value="quiz">Quiz</option>
              <option value="lead_form">Lead Form</option>
            </select>

            <select
              value={settings.defaultCampaignPageMode}
              onChange={(e) => setField("defaultCampaignPageMode", e.target.value)}
              style={styles.input}
            >
              <option value="hosted">Hosted</option>
              <option value="external">External</option>
            </select>

            <input
              value={settings.defaultCampaignDomain}
              onChange={(e) => setField("defaultCampaignDomain", e.target.value)}
              placeholder="Default campaign domain"
              style={styles.input}
            />

            <input
              value={settings.defaultTagPrefix}
              onChange={(e) => setField("defaultTagPrefix", e.target.value)}
              placeholder="Default tag prefix"
              style={styles.input}
            />
          </div>
        </section>

        <section style={styles.sectionCard}>
          <h2 style={styles.sectionTitle}>Tracking i funkcje</h2>
          <div style={styles.checkboxGrid}>
            <label style={styles.checkboxCard}>
              <input
                type="checkbox"
                checked={settings.trackIp}
                onChange={(e) => setField("trackIp", e.target.checked)}
              />
              <span>Zapisuj IP</span>
            </label>

            <label style={styles.checkboxCard}>
              <input
                type="checkbox"
                checked={settings.trackUserAgent}
                onChange={(e) => setField("trackUserAgent", e.target.checked)}
              />
              <span>Zapisuj User-Agent</span>
            </label>

            <label style={styles.checkboxCard}>
              <input
                type="checkbox"
                checked={settings.trackReferer}
                onChange={(e) => setField("trackReferer", e.target.checked)}
              />
              <span>Zapisuj Referer</span>
            </label>

            <label style={styles.checkboxCard}>
              <input
                type="checkbox"
                checked={settings.allowCustomDomains}
                onChange={(e) => setField("allowCustomDomains", e.target.checked)}
              />
              <span>Zezwól na custom domains</span>
            </label>

            <label style={styles.checkboxCard}>
              <input
                type="checkbox"
                checked={settings.maintenanceMode}
                onChange={(e) => setField("maintenanceMode", e.target.checked)}
              />
              <span>Maintenance mode</span>
            </label>
          </div>
        </section>

        <section style={styles.sectionCard}>
          <h2 style={styles.sectionTitle}>Google Drive</h2>
          <div style={styles.checkboxGridSingle}>
            <label style={styles.checkboxCard}>
              <input
                type="checkbox"
                checked={settings.googleDriveEnabled}
                onChange={(e) => setField("googleDriveEnabled", e.target.checked)}
              />
              <span>Włącz integrację Google Drive</span>
            </label>
          </div>

          <div style={styles.grid3}>
            <input
              value={settings.googleDriveScriptUrl}
              onChange={(e) => setField("googleDriveScriptUrl", e.target.value)}
              placeholder="Apps Script Web App URL"
              style={styles.input}
            />
            <input
              value={settings.googleDriveRootFolderId}
              onChange={(e) => setField("googleDriveRootFolderId", e.target.value)}
              placeholder="Google Drive root folder ID"
              style={styles.input}
            />
            <input
              value={settings.googleDriveRootFolderUrl}
              onChange={(e) => setField("googleDriveRootFolderUrl", e.target.value)}
              placeholder="Google Drive root folder URL"
              style={styles.input}
            />
          </div>
        </section>

        <div style={styles.actions}>
          <button type="submit" disabled={submitting} style={styles.saveButton}>
            {submitting ? "Zapisywanie..." : "Zapisz ustawienia"}
          </button>

          {saved ? <span style={styles.saved}>Ustawienia zapisane.</span> : null}
          {error ? <span style={styles.error}>{error}</span> : null}
        </div>
      </form>
    </main>
  );
}

const styles: Record<string, CSSProperties> = {
  page: {
    display: "grid",
    gap: 24,
  },
  form: {
    display: "grid",
    gap: 22,
  },
  sectionCard: {
    borderRadius: 28,
    border: "1px solid rgba(255,255,255,0.08)",
    background:
      "linear-gradient(180deg, rgba(10,14,35,0.92) 0%, rgba(6,10,26,0.96) 100%)",
    padding: 24,
    display: "grid",
    gap: 18,
  },
  sectionTitle: {
    margin: 0,
    fontSize: 22,
    fontWeight: 900,
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
    height: 48,
    borderRadius: 16,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(8,12,30,0.82)",
    color: "#fff",
    padding: "0 14px",
    outline: "none",
  },
  checkboxGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
    gap: 14,
  },
  checkboxGridSingle: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: 14,
  },
  checkboxCard: {
    minHeight: 48,
    borderRadius: 16,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.03)",
    padding: "0 14px",
    display: "flex",
    alignItems: "center",
    gap: 10,
    color: "#fff",
    fontWeight: 600,
  },
  actions: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
  },
  saveButton: {
    minHeight: 48,
    borderRadius: 16,
    border: "none",
    padding: "0 18px",
    fontWeight: 800,
    cursor: "pointer",
    color: "#08101F",
    background: "linear-gradient(90deg, #E45CFF 0%, #8D8CFF 46%, #42D7FF 100%)",
  },
  saved: {
    color: "#8BE7AE",
    fontWeight: 700,
  },
  error: {
    color: "#FF9D9D",
    fontWeight: 700,
  },
  loading: {
    color: "#fff",
  },
};