"use client";

import { useEffect, useMemo, useState, type CSSProperties, type FormEvent } from "react";
import { getCampaignPage, trackEvent } from "../../lib/api";
import { getOrCreateSessionId } from "../../lib/session";

type CampaignPageData = {
  id: string;
  slug: string;
  title: string;
  templateType: string;
  status: string;
  pageMode?: string;
  externalUrl?: string | null;
  jsonConfig?: {
    heroTitle?: string;
    heroDescription?: string;
    ctaLabel?: string;
    ctaUrl?: string;
    formTitle?: string;
    backgroundImage?: string;
  } | null;
  campaign: {
    id: string;
    name: string;
    slug: string;
    organizationId: string;
  };
  organization: {
    id: string;
    name: string;
    slug: string;
  };
};

export default function PublicCampaignPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const [data, setData] = useState<CampaignPageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function getSessionIdFromUrl() {
    if (typeof window === "undefined") return "";
    const url = new URL(window.location.href);
    return url.searchParams.get("session_id") || "";
  }

  function resolveSessionId() {
    const fromUrl = getSessionIdFromUrl();
    if (fromUrl) return fromUrl;
    return getOrCreateSessionId();
  }

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        setLoading(true);
        setError(null);

        const resolved = await params;
        const result = await getCampaignPage(resolved.slug);

        if (!active) return;
        setData(result);

        const sessionId = resolveSessionId();

        await trackEvent({
          type: "landing_view",
          organizationId: result.organization.id,
          campaignId: result.campaign.id,
          sessionId,
          payload: {
            slug: result.slug,
            templateType: result.templateType,
            path: `/${result.slug}`,
            userAgent:
              typeof navigator !== "undefined" ? navigator.userAgent : "",
            href:
              typeof window !== "undefined" ? window.location.href : "",
          },
        });
      } catch (err) {
        if (!active) return;
        setError(
          err instanceof Error ? err.message : "Błąd ładowania strony kampanii"
        );
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, [params]);

  const config = useMemo(() => data?.jsonConfig || {}, [data]);

  async function handleCtaClick() {
    if (!data) return;

    try {
      const sessionId = resolveSessionId();

      await trackEvent({
        type: "cta_click",
        organizationId: data.organization.id,
        campaignId: data.campaign.id,
        sessionId,
        payload: {
          slug: data.slug,
          ctaLabel: config.ctaLabel || "Sprawdź",
          ctaUrl: config.ctaUrl || "",
        },
      });

      if (config.ctaUrl) {
        window.open(config.ctaUrl, "_blank", "noopener,noreferrer");
      }
    } catch (err) {
      console.error(err);
    }
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!data) return;

    try {
      const sessionId = resolveSessionId();

      await trackEvent({
        type: "form_submit",
        organizationId: data.organization.id,
        campaignId: data.campaign.id,
        sessionId,
        payload: {
          slug: data.slug,
          name: formName,
          email: formEmail,
        },
      });

      setSubmitted(true);
      setFormName("");
      setFormEmail("");
    } catch (err) {
      console.error(err);
    }
  }

  if (loading) {
    return (
      <main style={styles.centered}>
        <div style={styles.box}>Ładowanie strony kampanii...</div>
      </main>
    );
  }

  if (error || !data) {
    return (
      <main style={styles.centered}>
        <div style={styles.box}>
          <h1 style={{ marginTop: 0 }}>Błąd</h1>
          <p style={{ color: "#ff9f9f" }}>{error || "Nie znaleziono strony."}</p>
        </div>
      </main>
    );
  }

  if (data.status !== "published") {
    return (
      <main style={styles.centered}>
        <div style={styles.box}>
          <h1 style={{ marginTop: 0 }}>Strona nie jest opublikowana</h1>
          <p style={{ color: "#9ea8d8" }}>
            Ta kampania nie została jeszcze publicznie opublikowana.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main style={styles.page}>
      <section style={styles.hero}>
        <div style={styles.overlay} />
        <div style={styles.heroContent}>
          <div style={styles.brand}>{data.organization.name}</div>
          <h1 style={styles.heroTitle}>
            {config.heroTitle || data.title || data.campaign.name}
          </h1>
          <p style={styles.heroDescription}>
            {config.heroDescription ||
              "Interaktywna kampania LUMEVIO. Odbierz ofertę, dołącz do aktywacji i wejdź w świat phygital."}
          </p>

          <div style={styles.heroActions}>
            <button onClick={handleCtaClick} style={styles.primaryButton}>
              {config.ctaLabel || "Sprawdź więcej"}
            </button>
          </div>
        </div>
      </section>

      <section style={styles.contentWrap}>
        <div style={styles.grid}>
          <article style={styles.card}>
            <h2 style={styles.cardTitle}>O kampanii</h2>
            <p style={styles.cardText}>
              To jest publiczna strona kampanii LUMEVIO. Możesz później podmieniać treści,
              grafikę, formularze, quizy, kupony i konkursy.
            </p>

            <div style={styles.metaList}>
              <div>
                <strong>Kampania:</strong> {data.campaign.name}
              </div>
              <div>
                <strong>Slug:</strong> {data.slug}
              </div>
              <div>
                <strong>Typ:</strong> {data.templateType}
              </div>
            </div>
          </article>

          <article style={styles.card}>
            <h2 style={styles.cardTitle}>
              {config.formTitle || "Dołącz do kampanii"}
            </h2>

            {submitted ? (
              <div style={styles.successBox}>
                Dziękujemy. Formularz został wysłany.
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={styles.form}>
                <input
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Imię"
                  style={styles.input}
                />
                <input
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  placeholder="Email"
                  type="email"
                  style={styles.input}
                />
                <button type="submit" style={styles.submitButton}>
                  Wyślij
                </button>
              </form>
            )}
          </article>
        </div>
      </section>
    </main>
  );
}

const styles: Record<string, CSSProperties> = {
  page: {
    minHeight: "100vh",
    background:
      "radial-gradient(circle at top, rgba(109,124,255,0.16), transparent 22%), #05081a",
    color: "#fff",
  },
  centered: {
    minHeight: "100vh",
    display: "grid",
    placeItems: "center",
    padding: 24,
    background: "#05081a",
    color: "#fff",
  },
  box: {
    width: "100%",
    maxWidth: 720,
    borderRadius: 24,
    padding: 32,
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
  },
  hero: {
    position: "relative",
    overflow: "hidden",
    minHeight: 520,
    display: "flex",
    alignItems: "center",
    padding: "64px 24px",
  },
  overlay: {
    position: "absolute",
    inset: 0,
    background:
      "linear-gradient(180deg, rgba(5,8,26,0.4), rgba(5,8,26,0.88))",
  },
  heroContent: {
    position: "relative",
    zIndex: 2,
    width: "100%",
    maxWidth: 1100,
    margin: "0 auto",
  },
  brand: {
    display: "inline-flex",
    padding: "8px 12px",
    borderRadius: 999,
    background: "rgba(109,124,255,0.14)",
    border: "1px solid rgba(109,124,255,0.35)",
    fontWeight: 700,
    marginBottom: 18,
  },
  heroTitle: {
    margin: 0,
    fontSize: "clamp(38px, 7vw, 72px)",
    lineHeight: 1,
    fontWeight: 900,
    maxWidth: 900,
  },
  heroDescription: {
    marginTop: 20,
    maxWidth: 760,
    color: "#c6cff5",
    fontSize: 18,
    lineHeight: 1.6,
  },
  heroActions: {
    marginTop: 28,
    display: "flex",
    gap: 12,
    flexWrap: "wrap",
  },
  primaryButton: {
    height: 52,
    padding: "0 20px",
    borderRadius: 14,
    border: "none",
    background: "linear-gradient(135deg, #6d7cff, #8d6bff)",
    color: "#fff",
    fontWeight: 800,
    cursor: "pointer",
    boxShadow: "0 0 24px rgba(109,124,255,0.3)",
  },
  contentWrap: {
    maxWidth: 1100,
    margin: "0 auto",
    padding: "0 24px 64px 24px",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
    gap: 24,
    marginTop: -40,
    position: "relative",
    zIndex: 3,
  },
  card: {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 24,
    padding: 24,
    backdropFilter: "blur(12px)",
  },
  cardTitle: {
    marginTop: 0,
    fontSize: 24,
  },
  cardText: {
    color: "#b8c3f2",
    lineHeight: 1.7,
  },
  metaList: {
    marginTop: 18,
    display: "grid",
    gap: 10,
    color: "#d6ddff",
  },
  form: {
    display: "grid",
    gap: 14,
  },
  input: {
    height: 50,
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "#0d1027",
    color: "#fff",
    padding: "0 14px",
    outline: "none",
  },
  submitButton: {
    height: 50,
    borderRadius: 14,
    border: "none",
    background: "#6d7cff",
    color: "#fff",
    fontWeight: 800,
    cursor: "pointer",
  },
  successBox: {
    borderRadius: 16,
    padding: 16,
    background: "rgba(80,200,120,0.08)",
    border: "1px solid rgba(80,200,120,0.24)",
    color: "#c9ffd8",
  },
};