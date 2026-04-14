"use client";

import {
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type FormEvent,
} from "react";
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
    builderPreset?: string;
    heroTitle?: string;
    heroDescription?: string;
    ctaLabel?: string;
    ctaUrl?: string;
    formTitle?: string;
    backgroundImage?: string;
    rewardTitle?: string;
    couponCode?: string;
    discountValue?: string;
    quizQuestion?: string;
    quizAnswers?: string[];
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
  const [couponRevealed, setCouponRevealed] = useState(false);
  const [quizAnswer, setQuizAnswer] = useState<string | null>(null);

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
            href: typeof window !== "undefined" ? window.location.href : "",
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
          templateType: data.templateType,
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
          templateType: data.templateType,
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

  async function handleRevealCoupon() {
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
          templateType: data.templateType,
          action: "reveal_coupon",
        },
      });

      setCouponRevealed(true);
    } catch (err) {
      console.error(err);
    }
  }

  async function handleQuizAnswer(answer: string) {
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
          templateType: data.templateType,
          action: "quiz_answer",
          answer,
        },
      });

      setQuizAnswer(answer);
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

  const heroTitle = config.heroTitle || data.title || data.campaign.name;
  const heroDescription =
    config.heroDescription ||
    "Interaktywna kampania LUMEVIO. Odbierz ofertę, dołącz do aktywacji i wejdź w świat phygital.";
  const ctaLabel = config.ctaLabel || "Sprawdź więcej";
  const formTitle = config.formTitle || "Dołącz do kampanii";

  return (
    <main style={styles.page}>
      <section style={styles.hero}>
        <div style={styles.overlay} />
        <div style={styles.heroContent}>
          <div style={styles.brand}>{data.organization.name}</div>
          <h1 style={styles.heroTitle}>{heroTitle}</h1>
          <p style={styles.heroDescription}>{heroDescription}</p>

          {data.templateType !== "quiz" && data.templateType !== "coupon" ? (
            <div style={styles.heroActions}>
              <button onClick={handleCtaClick} style={styles.primaryButton}>
                {ctaLabel}
              </button>
            </div>
          ) : null}
        </div>
      </section>

      <section style={styles.contentWrap}>
        <div style={styles.grid}>
          <article style={styles.card}>
            {data.templateType === "landing" && (
              <LandingSection
                campaignName={data.campaign.name}
                slug={data.slug}
                templateType={data.templateType}
              />
            )}

            {data.templateType === "contest" && (
              <ContestSection rewardTitle={config.rewardTitle} />
            )}

            {data.templateType === "coupon" && (
              <CouponSection
                couponCode={config.couponCode}
                discountValue={config.discountValue}
                couponRevealed={couponRevealed}
                onReveal={handleRevealCoupon}
              />
            )}

            {data.templateType === "quiz" && (
              <QuizSection
                question={config.quizQuestion}
                answers={config.quizAnswers}
                selectedAnswer={quizAnswer}
                onAnswer={handleQuizAnswer}
              />
            )}

            {data.templateType === "lead_form" && (
              <LeadFormIntro campaignName={data.campaign.name} />
            )}
          </article>

          <article style={styles.card}>
            <h2 style={styles.cardTitle}>{formTitle}</h2>

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

function LandingSection({
  campaignName,
  slug,
  templateType,
}: {
  campaignName: string;
  slug: string;
  templateType: string;
}) {
  return (
    <>
      <h2 style={styles.cardTitle}>O kampanii</h2>
      <p style={styles.cardText}>
        To jest publiczna strona kampanii LUMEVIO. Możesz później podmieniać
        treści, grafikę, formularze, quizy, kupony i konkursy.
      </p>
      <div style={styles.metaList}>
        <div>
          <strong>Kampania:</strong> {campaignName}
        </div>
        <div>
          <strong>Slug:</strong> {slug}
        </div>
        <div>
          <strong>Typ:</strong> {templateType}
        </div>
      </div>
    </>
  );
}

function ContestSection({ rewardTitle }: { rewardTitle?: string }) {
  return (
    <>
      <h2 style={styles.cardTitle}>Konkurs</h2>
      <p style={styles.cardText}>
        Weź udział w aktywacji i zgłoś się do konkursu. Idealny format do retailu,
        ekspozycji produktowych i szybkich akcji promocyjnych.
      </p>
      <div style={styles.highlightBox}>
        Nagroda główna: {rewardTitle || "Voucher / zestaw nagród"}
      </div>
    </>
  );
}

function CouponSection({
  couponCode,
  discountValue,
  couponRevealed,
  onReveal,
}: {
  couponCode?: string;
  discountValue?: string;
  couponRevealed: boolean;
  onReveal: () => void;
}) {
  return (
    <>
      <h2 style={styles.cardTitle}>Kupon promocyjny</h2>
      <p style={styles.cardText}>
        Odbierz rabat i pokaż kod przy kasie lub wykorzystaj go online.
      </p>

      <div style={styles.couponBox}>
        {couponRevealed ? (
          <>
            <div style={styles.couponValue}>
              {discountValue || "10% OFF"}
            </div>
            <div style={styles.couponCode}>
              {couponCode || "LUMEVIO10"}
            </div>
          </>
        ) : (
          <button onClick={onReveal} style={styles.primaryButton}>
            Odkryj kupon
          </button>
        )}
      </div>
    </>
  );
}

function QuizSection({
  question,
  answers,
  selectedAnswer,
  onAnswer,
}: {
  question?: string;
  answers?: string[];
  selectedAnswer: string | null;
  onAnswer: (answer: string) => void;
}) {
  const safeAnswers =
    answers && answers.length > 0
      ? answers
      : ["Odpowiedź A", "Odpowiedź B", "Odpowiedź C"];

  return (
    <>
      <h2 style={styles.cardTitle}>Quiz</h2>
      <p style={styles.cardText}>
        {question || "Który wariant produktu wybierasz najchętniej?"}
      </p>

      <div style={styles.quizAnswers}>
        {safeAnswers.map((answer) => (
          <button
            key={answer}
            onClick={() => onAnswer(answer)}
            style={{
              ...styles.quizButton,
              ...(selectedAnswer === answer ? styles.quizButtonActive : {}),
            }}
          >
            {answer}
          </button>
        ))}
      </div>

      {selectedAnswer ? (
        <div style={styles.successBox}>Wybrana odpowiedź: {selectedAnswer}</div>
      ) : null}
    </>
  );
}

function LeadFormIntro({ campaignName }: { campaignName: string }) {
  return (
    <>
      <h2 style={styles.cardTitle}>Lead Form</h2>
      <p style={styles.cardText}>
        Zostaw kontakt, aby otrzymać ofertę, materiały lub dalsze informacje
        o kampanii {campaignName}.
      </p>
    </>
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
  highlightBox: {
    marginTop: 18,
    borderRadius: 16,
    padding: 18,
    background: "rgba(109,124,255,0.08)",
    border: "1px solid rgba(109,124,255,0.24)",
    color: "#dfe3ff",
    fontWeight: 700,
  },
  couponBox: {
    marginTop: 20,
    minHeight: 140,
    borderRadius: 20,
    display: "grid",
    placeItems: "center",
    border: "1px dashed rgba(255,255,255,0.18)",
    background: "rgba(255,255,255,0.02)",
    padding: 20,
  },
  couponValue: {
    fontSize: 36,
    fontWeight: 900,
    marginBottom: 10,
  },
  couponCode: {
    fontSize: 22,
    fontWeight: 700,
    letterSpacing: "0.08em",
    color: "#dfe3ff",
  },
  quizAnswers: {
    display: "grid",
    gap: 12,
    marginTop: 18,
  },
  quizButton: {
    minHeight: 50,
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "#0d1027",
    color: "#fff",
    padding: "0 16px",
    cursor: "pointer",
    textAlign: "left",
  },
  quizButtonActive: {
    border: "1px solid rgba(109,124,255,0.55)",
    background: "rgba(109,124,255,0.16)",
  },
};