"use client";

import { FormEvent, useEffect, useState } from "react";
import { apiClient } from "@/lib/api-client";

type SettingsData = {
  id: string;
  platformName: string;
  supportEmail?: string | null;
  appBaseUrl?: string | null;
  apiBaseUrl?: string | null;
  goBaseUrl?: string | null;
  defaultCampaignPreset: string;
  defaultPageMode: string;
  defaultUtmSource?: string | null;
  defaultUtmMedium?: string | null;
  trackIp: boolean;
  trackUserAgent: boolean;
  trackReferer: boolean;
  allowCustomDomains: boolean;
  maintenanceMode: boolean;
  primaryColor?: string | null;
};

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [platformName, setPlatformName] = useState("");
  const [supportEmail, setSupportEmail] = useState("");
  const [appBaseUrl, setAppBaseUrl] = useState("");
  const [apiBaseUrl, setApiBaseUrl] = useState("");
  const [goBaseUrl, setGoBaseUrl] = useState("");
  const [defaultCampaignPreset, setDefaultCampaignPreset] = useState("landing");
  const [defaultPageMode, setDefaultPageMode] = useState("hosted");
  const [defaultUtmSource, setDefaultUtmSource] = useState("lumevio");
  const [defaultUtmMedium, setDefaultUtmMedium] = useState("nfc");
  const [trackIp, setTrackIp] = useState(true);
  const [trackUserAgent, setTrackUserAgent] = useState(true);
  const [trackReferer, setTrackReferer] = useState(true);
  const [allowCustomDomains, setAllowCustomDomains] = useState(false);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [primaryColor, setPrimaryColor] = useState("#6d7cff");

  async function loadSettings() {
    try {
      setLoading(true);
      setError(null);

      const data = await apiClient<SettingsData>("/settings");

      setPlatformName(data.platformName || "");
      setSupportEmail(data.supportEmail || "");
      setAppBaseUrl(data.appBaseUrl || "");
      setApiBaseUrl(data.apiBaseUrl || "");
      setGoBaseUrl(data.goBaseUrl || "");
      setDefaultCampaignPreset(data.defaultCampaignPreset || "landing");
      setDefaultPageMode(data.defaultPageMode || "hosted");
      setDefaultUtmSource(data.defaultUtmSource || "lumevio");
      setDefaultUtmMedium(data.defaultUtmMedium || "nfc");
      setTrackIp(!!data.trackIp);
      setTrackUserAgent(!!data.trackUserAgent);
      setTrackReferer(!!data.trackReferer);
      setAllowCustomDomains(!!data.allowCustomDomains);
      setMaintenanceMode(!!data.maintenanceMode);
      setPrimaryColor(data.primaryColor || "#6d7cff");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Błąd ładowania ustawień");
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
      setSaving(true);
      setError(null);
      setSuccess(null);

      await apiClient("/settings", {
        method: "PATCH",
        body: JSON.stringify({
          platformName,
          supportEmail,
          appBaseUrl,
          apiBaseUrl,
          goBaseUrl,
          defaultCampaignPreset,
          defaultPageMode,
          defaultUtmSource,
          defaultUtmMedium,
          trackIp,
          trackUserAgent,
          trackReferer,
          allowCustomDomains,
          maintenanceMode,
          primaryColor,
        }),
      });

      setSuccess("Ustawienia zostały zapisane");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nie udało się zapisać ustawień");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <main style={styles.page}>Ładowanie ustawień...</main>;
  }

  return (
    <main style={styles.page}>
      <div style={styles.header}>
        <h1 style={styles.title}>Ustawienia</h1>
        <p style={styles.subtitle}>
          Zarządzasz konfiguracją platformy, trackingiem, domenami i domyślnymi ustawieniami kampanii.
        </p>
      </div>

      <form onSubmit={handleSubmit} style={styles.form}>
        <section style={styles.card}>
          <h2 style={styles.sectionTitle}>Platforma</h2>
          <div style={styles.grid}>
            <input value={platformName} onChange={(e) => setPlatformName(e.target.value)} placeholder="Platform name" style={styles.input} />
            <input value={supportEmail} onChange={(e) => setSupportEmail(e.target.value)} placeholder="Support email" style={styles.input} />
            <input value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} placeholder="Primary color" style={styles.input} />
          </div>
        </section>

        <section style={styles.card}>
          <h2 style={styles.sectionTitle}>Domeny i URL</h2>
          <div style={styles.grid}>
            <input value={appBaseUrl} onChange={(e) => setAppBaseUrl(e.target.value)} placeholder="App base URL" style={styles.input} />
            <input value={apiBaseUrl} onChange={(e) => setApiBaseUrl(e.target.value)} placeholder="API base URL" style={styles.input} />
            <input value={goBaseUrl} onChange={(e) => setGoBaseUrl(e.target.value)} placeholder="GO base URL" style={styles.input} />
          </div>
        </section>

        <section style={styles.card}>
          <h2 style={styles.sectionTitle}>Domyślne kampanie</h2>
          <div style={styles.grid}>
            <select value={defaultCampaignPreset} onChange={(e) => setDefaultCampaignPreset(e.target.value)} style={styles.input}>
              <option value="landing">Landing</option>
              <option value="contest">Contest</option>
              <option value="coupon">Coupon</option>
              <option value="quiz">Quiz</option>
              <option value="lead_form">Lead Form</option>
            </select>

            <select value={defaultPageMode} onChange={(e) => setDefaultPageMode(e.target.value)} style={styles.input}>
              <option value="hosted">Hosted</option>
              <option value="external_redirect">External redirect</option>
            </select>

            <input value={defaultUtmSource} onChange={(e) => setDefaultUtmSource(e.target.value)} placeholder="Default UTM source" style={styles.input} />
            <input value={defaultUtmMedium} onChange={(e) => setDefaultUtmMedium(e.target.value)} placeholder="Default UTM medium" style={styles.input} />
          </div>
        </section>

        <section style={styles.card}>
          <h2 style={styles.sectionTitle}>Tracking i funkcje</h2>
          <div style={styles.switchGrid}>
            <label style={styles.switchItem}>
              <input type="checkbox" checked={trackIp} onChange={(e) => setTrackIp(e.target.checked)} />
              <span>Zapisuj IP</span>
            </label>

            <label style={styles.switchItem}>
              <input type="checkbox" checked={trackUserAgent} onChange={(e) => setTrackUserAgent(e.target.checked)} />
              <span>Zapisuj User-Agent</span>
            </label>

            <label style={styles.switchItem}>
              <input type="checkbox" checked={trackReferer} onChange={(e) => setTrackReferer(e.target.checked)} />
              <span>Zapisuj Referer</span>
            </label>

            <label style={styles.switchItem}>
              <input type="checkbox" checked={allowCustomDomains} onChange={(e) => setAllowCustomDomains(e.target.checked)} />
              <span>Zezwól na custom domains</span>
            </label>

            <label style={styles.switchItem}>
              <input type="checkbox" checked={maintenanceMode} onChange={(e) => setMaintenanceMode(e.target.checked)} />
              <span>Maintenance mode</span>
            </label>
          </div>
        </section>

        <div style={styles.actions}>
          <button type="submit" disabled={saving} style={styles.button}>
            {saving ? "Zapisywanie..." : "Zapisz ustawienia"}
          </button>
        </div>

        {success ? <p style={styles.success}>{success}</p> : null}
        {error ? <p style={styles.error}>{error}</p> : null}
      </form>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { color: "#fff" },
  header: { marginBottom: 24 },
  title: { margin: 0, fontSize: 32, fontWeight: 800 },
  subtitle: { marginTop: 8, color: "#9ea8d8" },
  form: { display: "grid", gap: 24 },
  card: {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 20,
    padding: 24,
  },
  sectionTitle: { margin: 0, marginBottom: 16, fontSize: 22, fontWeight: 700 },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: 16,
  },
  switchGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: 16,
  },
  switchItem: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    minHeight: 48,
    padding: "0 14px",
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "#0d1027",
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
  actions: { display: "flex", gap: 12 },
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
  success: { margin: 0, color: "#9affb4" },
  error: { margin: 0, color: "#ff8f8f" },
};