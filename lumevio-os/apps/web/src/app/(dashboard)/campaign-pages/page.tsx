"use client";

import { FormEvent, useEffect, useMemo, useState, type CSSProperties } from "react";
import { apiClient } from "@/lib/api-client";
import { useAuth } from "@/hooks/use-auth";

type OrganizationOption = {
  id: string;
  name: string;
  slug: string;
};

type CampaignOption = {
  id: string;
  name: string;
  slug: string;
  organization: {
    id: string;
    name: string;
    slug: string;
  };
};

type CampaignPageItem = {
  id: string;
  organizationId: string;
  campaignId: string;
  slug: string;
  title: string;
  templateType: string;
  status: string;
  pageMode: string;
  externalUrl?: string | null;
  customDomain?: string | null;
  jsonConfig?: Record<string, unknown> | null;
  publishedAt?: string | null;
  createdAt: string;
  organization?: {
    id: string;
    name: string;
    slug: string;
  } | null;
  campaign?: {
    id: string;
    name: string;
    slug: string;
  } | null;
};

type BuilderConfig = {
  builderPreset: string;
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
};

const DEFAULT_PRESET_CONFIGS: Record<string, BuilderConfig> = {
  landing: {
    builderPreset: "landing",
    heroTitle: "Poznaj kampanię",
    heroDescription: "Opis kampanii",
    ctaLabel: "Sprawdź więcej",
    ctaUrl: "",
  },
  contest: {
    builderPreset: "contest",
    heroTitle: "Weź udział w konkursie",
    heroDescription: "Dołącz do aktywacji i wygraj nagrodę",
    rewardTitle: "Voucher 100 zł",
    ctaLabel: "Dołącz",
    ctaUrl: "",
  },
  coupon: {
    builderPreset: "coupon",
    heroTitle: "Odbierz rabat",
    heroDescription: "Pokaż kod przy kasie lub użyj online",
    couponCode: "LUMEVIO10",
    discountValue: "10% OFF",
  },
  quiz: {
    builderPreset: "quiz",
    heroTitle: "Quiz produktowy",
    heroDescription: "Wybierz najlepszą odpowiedź",
    quizQuestion: "Który wariant wybierasz?",
    quizAnswers: ["Opcja A", "Opcja B", "Opcja C"],
  },
  lead_form: {
    builderPreset: "lead_form",
    heroTitle: "Zostaw kontakt",
    heroDescription: "Otrzymaj ofertę i materiały",
    formTitle: "Formularz kontaktowy",
    ctaLabel: "Wyślij",
  },
};

const INITIAL_FORM = {
  organizationId: "",
  campaignId: "",
  slug: "",
  title: "",
  templateType: "landing",
  status: "draft",
  pageMode: "hosted",
  externalUrl: "",
  customDomain: "",
};

export default function CampaignPagesPage() {
  const { isPlatformAdmin } = useAuth();

  const [organizations, setOrganizations] = useState<OrganizationOption[]>([]);
  const [campaigns, setCampaigns] = useState<CampaignOption[]>([]);
  const [items, setItems] = useState<CampaignPageItem[]>([]);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<CampaignPageItem | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [organizationId, setOrganizationId] = useState(INITIAL_FORM.organizationId);
  const [campaignId, setCampaignId] = useState(INITIAL_FORM.campaignId);
  const [slug, setSlug] = useState(INITIAL_FORM.slug);
  const [title, setTitle] = useState(INITIAL_FORM.title);
  const [templateType, setTemplateType] = useState(INITIAL_FORM.templateType);
  const [status, setStatus] = useState(INITIAL_FORM.status);
  const [pageMode, setPageMode] = useState(INITIAL_FORM.pageMode);
  const [externalUrl, setExternalUrl] = useState(INITIAL_FORM.externalUrl);
  const [customDomain, setCustomDomain] = useState(INITIAL_FORM.customDomain);

  const [builderConfig, setBuilderConfig] = useState<BuilderConfig>(
    DEFAULT_PRESET_CONFIGS.landing,
  );
  const [rawJsonMode, setRawJsonMode] = useState(false);
  const [jsonConfigText, setJsonConfigText] = useState(
    JSON.stringify(DEFAULT_PRESET_CONFIGS.landing, null, 2),
  );

  function syncTextFromConfig(config: BuilderConfig) {
    setJsonConfigText(JSON.stringify(config, null, 2));
  }

  function resetForm() {
    setEditingItem(null);
    setOrganizationId(INITIAL_FORM.organizationId);
    setCampaignId(INITIAL_FORM.campaignId);
    setSlug(INITIAL_FORM.slug);
    setTitle(INITIAL_FORM.title);
    setTemplateType(INITIAL_FORM.templateType);
    setStatus(INITIAL_FORM.status);
    setPageMode(INITIAL_FORM.pageMode);
    setExternalUrl(INITIAL_FORM.externalUrl);
    setCustomDomain(INITIAL_FORM.customDomain);
    setBuilderConfig(DEFAULT_PRESET_CONFIGS.landing);
    setRawJsonMode(false);
    syncTextFromConfig(DEFAULT_PRESET_CONFIGS.landing);
    setError(null);
  }

  function updateBuilderField<K extends keyof BuilderConfig>(key: K, value: BuilderConfig[K]) {
    setBuilderConfig((prev) => {
      const next = { ...prev, [key]: value };
      syncTextFromConfig(next);
      return next;
    });
  }

  function startEdit(item: CampaignPageItem) {
    const existingConfig = (item.jsonConfig ?? {}) as BuilderConfig;
    const preset = item.templateType || "landing";
    const mergedConfig = {
      ...(DEFAULT_PRESET_CONFIGS[preset] ?? DEFAULT_PRESET_CONFIGS.landing),
      ...existingConfig,
      builderPreset: existingConfig.builderPreset || preset,
    };

    setEditingItem(item);
    setOrganizationId(item.organization?.id ?? item.organizationId ?? "");
    setCampaignId(item.campaign?.id ?? item.campaignId ?? "");
    setSlug(item.slug ?? "");
    setTitle(item.title ?? "");
    setTemplateType(item.templateType ?? "landing");
    setStatus(item.status ?? "draft");
    setPageMode(item.pageMode ?? "hosted");
    setExternalUrl(item.externalUrl ?? "");
    setCustomDomain(item.customDomain ?? "");
    setBuilderConfig(mergedConfig);
    setRawJsonMode(false);
    syncTextFromConfig(mergedConfig);
    setError(null);

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function loadPage() {
    try {
      setLoading(true);
      setError(null);

      const [pagesData, orgsData, campaignsData] = await Promise.all([
        apiClient<CampaignPageItem[]>("/campaign-pages"),
        apiClient<OrganizationOption[]>("/organizations"),
        apiClient<CampaignOption[]>("/campaigns"),
      ]);

      setItems(pagesData);
      setOrganizations(orgsData);
      setCampaigns(campaignsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Błąd ładowania danych");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadPage();
  }, [isPlatformAdmin]);

  const filteredCampaigns = useMemo(() => {
    if (!organizationId) return [];
    return campaigns.filter((campaign) => campaign.organization.id === organizationId);
  }, [campaigns, organizationId]);

  useEffect(() => {
    if (editingItem) return;
    const next = DEFAULT_PRESET_CONFIGS[templateType] ?? DEFAULT_PRESET_CONFIGS.landing;
    setBuilderConfig(next);
    syncTextFromConfig(next);
  }, [templateType, editingItem]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    if (!organizationId || !campaignId || !slug.trim() || !title.trim()) {
      setError("Wybierz organizację, kampanię oraz podaj slug i tytuł");
      return;
    }

    let parsedJsonConfig: BuilderConfig;
    if (rawJsonMode) {
      try {
        parsedJsonConfig = JSON.parse(jsonConfigText) as BuilderConfig;
      } catch {
        setError("jsonConfig musi być poprawnym JSON");
        return;
      }
    } else {
      parsedJsonConfig = {
        ...builderConfig,
        builderPreset: templateType,
      };
    }

    try {
      setSubmitting(true);
      setError(null);

      const payload = {
        organizationId,
        campaignId,
        slug: slug.trim(),
        title: title.trim(),
        templateType,
        status,
        pageMode,
        externalUrl:
          pageMode === "external_redirect"
            ? externalUrl.trim() || undefined
            : undefined,
        customDomain: customDomain.trim() || undefined,
        jsonConfig: parsedJsonConfig,
      };

      if (editingItem) {
        await apiClient(`/campaign-pages/${editingItem.id}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
      } else {
        await apiClient("/campaign-pages", {
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
            ? "Nie udało się zaktualizować strony"
            : "Nie udało się utworzyć strony",
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    const ok = window.confirm("Czy na pewno chcesz usunąć campaign page?");
    if (!ok) return;

    try {
      setDeletingId(id);
      setError(null);

      await apiClient(`/campaign-pages/${id}`, {
        method: "DELETE",
      });

      setItems((prev) => prev.filter((item) => item.id !== id));

      if (editingItem?.id === id) {
        resetForm();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Błąd usuwania strony");
    } finally {
      setDeletingId(null);
    }
  }

  async function handlePublish(id: string) {
    try {
      setError(null);

      await apiClient(`/campaign-pages/${id}/publish`, {
        method: "POST",
      });

      await loadPage();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nie udało się opublikować strony");
    }
  }

  async function handleUnpublish(id: string) {
    try {
      setError(null);

      await apiClient(`/campaign-pages/${id}/unpublish`, {
        method: "POST",
      });

      await loadPage();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nie udało się cofnąć publikacji");
    }
  }

  async function handleArchive(id: string) {
    try {
      setError(null);

      await apiClient(`/campaign-pages/${id}/archive`, {
        method: "POST",
      });

      await loadPage();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nie udało się zarchiwizować strony");
    }
  }

  function getPublicUrl(slugValue: string) {
    return `http://localhost:3002/p/${slugValue}`;
  }

  function renderPresetFields() {
    return (
      <div style={styles.builderSection}>
        <div style={styles.builderTitle}>Builder 2.0</div>

        <div style={styles.grid}>
          <input
            value={builderConfig.heroTitle ?? ""}
            onChange={(e) => updateBuilderField("heroTitle", e.target.value)}
            placeholder="Hero title"
            style={styles.input}
          />

          <input
            value={builderConfig.heroDescription ?? ""}
            onChange={(e) => updateBuilderField("heroDescription", e.target.value)}
            placeholder="Hero description"
            style={styles.input}
          />

          {(templateType === "landing" ||
            templateType === "contest" ||
            templateType === "lead_form") && (
            <>
              <input
                value={builderConfig.ctaLabel ?? ""}
                onChange={(e) => updateBuilderField("ctaLabel", e.target.value)}
                placeholder="CTA label"
                style={styles.input}
              />
              <input
                value={builderConfig.ctaUrl ?? ""}
                onChange={(e) => updateBuilderField("ctaUrl", e.target.value)}
                placeholder="CTA URL"
                style={styles.input}
              />
            </>
          )}

          {templateType === "lead_form" && (
            <input
              value={builderConfig.formTitle ?? ""}
              onChange={(e) => updateBuilderField("formTitle", e.target.value)}
              placeholder="Form title"
              style={styles.input}
            />
          )}

          {templateType === "contest" && (
            <input
              value={builderConfig.rewardTitle ?? ""}
              onChange={(e) => updateBuilderField("rewardTitle", e.target.value)}
              placeholder="Reward title"
              style={styles.input}
            />
          )}

          {templateType === "coupon" && (
            <>
              <input
                value={builderConfig.couponCode ?? ""}
                onChange={(e) => updateBuilderField("couponCode", e.target.value)}
                placeholder="Coupon code"
                style={styles.input}
              />
              <input
                value={builderConfig.discountValue ?? ""}
                onChange={(e) => updateBuilderField("discountValue", e.target.value)}
                placeholder="Discount value"
                style={styles.input}
              />
            </>
          )}

          {templateType === "quiz" && (
            <>
              <input
                value={builderConfig.quizQuestion ?? ""}
                onChange={(e) => updateBuilderField("quizQuestion", e.target.value)}
                placeholder="Quiz question"
                style={styles.input}
              />
              <textarea
                value={(builderConfig.quizAnswers ?? []).join("\n")}
                onChange={(e) =>
                  updateBuilderField(
                    "quizAnswers",
                    e.target.value
                      .split("\n")
                      .map((item) => item.trim())
                      .filter(Boolean),
                  )
                }
                placeholder="Quiz answers — one per line"
                style={styles.textareaSmall}
              />
            </>
          )}

          <input
            value={builderConfig.backgroundImage ?? ""}
            onChange={(e) => updateBuilderField("backgroundImage", e.target.value)}
            placeholder="Background image URL"
            style={styles.input}
          />
        </div>
      </div>
    );
  }

  return (
    <main style={styles.page}>
      <div style={styles.header}>
        <h1 style={styles.title}>Campaign Pages</h1>
        <p style={styles.subtitle}>
          Zarządzasz hostowanymi stronami kampanii, builderem presetów i publikacją.
        </p>
      </div>

      {isPlatformAdmin ? (
        <section style={styles.card}>
          <div style={styles.sectionHeader}>
            <div>
              <h2 style={styles.sectionTitle}>
                {editingItem ? "Edytuj campaign page" : "Dodaj campaign page"}
              </h2>
              <p style={styles.muted}>
                {editingItem
                  ? "Aktualizujesz istniejącą stronę kampanii."
                  : "Tworzysz nową stronę kampanii dla wybranej organizacji i kampanii."}
              </p>
            </div>

            {editingItem ? (
              <button type="button" onClick={resetForm} style={styles.secondaryButton}>
                Anuluj edycję
              </button>
            ) : null}
          </div>

          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.grid}>
              <select
                value={organizationId}
                onChange={(e) => {
                  setOrganizationId(e.target.value);
                  setCampaignId("");
                }}
                style={styles.input}
              >
                <option value="">Wybierz organizację</option>
                {organizations.map((org) => (
                  <option key={org.id} value={org.id}>
                    {org.name}
                  </option>
                ))}
              </select>

              <select
                value={campaignId}
                onChange={(e) => setCampaignId(e.target.value)}
                style={styles.input}
                disabled={!organizationId}
              >
                <option value="">Wybierz kampanię</option>
                {filteredCampaigns.map((campaign) => (
                  <option key={campaign.id} value={campaign.id}>
                    {campaign.name}
                  </option>
                ))}
              </select>

              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Tytuł strony"
                style={styles.input}
              />

              <input
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="Slug strony"
                style={styles.input}
              />

              <select
                value={templateType}
                onChange={(e) => setTemplateType(e.target.value)}
                style={styles.input}
              >
                <option value="landing">landing</option>
                <option value="contest">contest</option>
                <option value="coupon">coupon</option>
                <option value="quiz">quiz</option>
                <option value="lead_form">lead_form</option>
              </select>

              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                style={styles.input}
              >
                <option value="draft">draft</option>
                <option value="published">published</option>
                <option value="archived">archived</option>
              </select>

              <select
                value={pageMode}
                onChange={(e) => setPageMode(e.target.value)}
                style={styles.input}
              >
                <option value="hosted">hosted</option>
                <option value="external_redirect">external_redirect</option>
              </select>

              <input
                value={externalUrl}
                onChange={(e) => setExternalUrl(e.target.value)}
                placeholder="External URL"
                style={styles.input}
                disabled={pageMode !== "external_redirect"}
              />

              <input
                value={customDomain}
                onChange={(e) => setCustomDomain(e.target.value)}
                placeholder="Custom domain"
                style={styles.input}
              />
            </div>

            {slug.trim() ? (
              <div style={styles.previewBox}>
                <div style={styles.previewTitle}>Publiczny URL</div>
                <a
                  href={getPublicUrl(slug.trim())}
                  target="_blank"
                  rel="noreferrer"
                  style={styles.inlineLink}
                >
                  {getPublicUrl(slug.trim())}
                </a>
              </div>
            ) : null}

            {renderPresetFields()}

            <div style={styles.toggleRow}>
              <label style={styles.toggleLabel}>
                <input
                  type="checkbox"
                  checked={rawJsonMode}
                  onChange={(e) => setRawJsonMode(e.target.checked)}
                />
                Tryb surowego JSON
              </label>
            </div>

            {rawJsonMode ? (
              <textarea
                value={jsonConfigText}
                onChange={(e) => setJsonConfigText(e.target.value)}
                placeholder="JSON config"
                style={styles.textarea}
              />
            ) : (
              <div style={styles.previewBox}>
                <div style={styles.previewTitle}>Preview JSON</div>
                <pre style={styles.pre}>{jsonConfigText}</pre>
              </div>
            )}

            <div style={styles.previewSection}>
              <div style={styles.previewHeader}>
                <h3 style={styles.previewHeading}>Podgląd strony</h3>
                <p style={styles.previewSubheading}>
                  Render na żywo na podstawie aktualnych ustawień buildera.
                </p>
              </div>

              <CampaignPagePreview
                title={title}
                templateType={templateType}
                config={builderConfig}
              />
            </div>

            <div style={styles.actionsRow}>
              <button type="submit" disabled={submitting} style={styles.button}>
                {submitting
                  ? editingItem
                    ? "Zapisywanie..."
                    : "Tworzenie..."
                  : editingItem
                    ? "Zapisz zmiany"
                    : "Utwórz stronę"}
              </button>

              {editingItem ? (
                <button type="button" onClick={resetForm} style={styles.secondaryButton}>
                  Wyczyść formularz
                </button>
              ) : null}
            </div>

            {error ? <p style={styles.error}>{error}</p> : null}
          </form>
        </section>
      ) : (
        <section style={styles.card}>
          <h2 style={styles.sectionTitle}>Campaign pages organizacji</h2>
          <p style={styles.muted}>Tylko superadmin może zarządzać stronami kampanii.</p>
          {error ? <p style={styles.error}>{error}</p> : null}
        </section>
      )}

      <section style={styles.card}>
        <div style={styles.sectionHeader}>
          <h2 style={styles.sectionTitle}>Lista stron</h2>
          <button onClick={() => void loadPage()} style={styles.secondaryButton}>
            Odśwież
          </button>
        </div>

        {loading ? (
          <p style={styles.muted}>Ładowanie...</p>
        ) : items.length === 0 ? (
          <p style={styles.muted}>Brak stron kampanii.</p>
        ) : (
          <div style={styles.list}>
            {items.map((item) => {
              const config = (item.jsonConfig ?? {}) as BuilderConfig;

              return (
                <article key={item.id} style={styles.itemCard}>
                  <div style={styles.itemTop}>
                    <div>
                      <h3 style={styles.itemName}>{item.title}</h3>
                      <p style={styles.itemMeta}>
                        {item.organization?.name || "—"}
                        {item.campaign ? ` · ${item.campaign.name}` : ""}
                      </p>
                    </div>

                    <div style={styles.badges}>
                      <span style={styles.badge}>{item.status}</span>
                      <span style={styles.badgeSecondary}>{item.pageMode}</span>
                      <span style={styles.badgeMuted}>
                        {config.builderPreset || item.templateType}
                      </span>
                    </div>
                  </div>

                  <div style={styles.infoGrid}>
                    <div>
                      <span style={styles.label}>Slug</span>
                      <div style={styles.value}>{item.slug}</div>
                    </div>

                    <div>
                      <span style={styles.label}>Template</span>
                      <div style={styles.value}>{item.templateType}</div>
                    </div>

                    <div>
                      <span style={styles.label}>Hero title</span>
                      <div style={styles.value}>{config.heroTitle || "—"}</div>
                    </div>

                    <div>
                      <span style={styles.label}>CTA</span>
                      <div style={styles.value}>{config.ctaLabel || "—"}</div>
                    </div>

                    <div>
                      <span style={styles.label}>Public URL</span>
                      <a
                        href={getPublicUrl(item.slug)}
                        target="_blank"
                        rel="noreferrer"
                        style={styles.inlineLink}
                      >
                        {getPublicUrl(item.slug)}
                      </a>
                    </div>

                    <div>
                      <span style={styles.label}>Published at</span>
                      <div style={styles.value}>
                        {item.publishedAt
                          ? new Date(item.publishedAt).toLocaleString("pl-PL")
                          : "—"}
                      </div>
                    </div>
                  </div>

                  {isPlatformAdmin ? (
                    <div style={styles.itemActions}>
                      <button
                        type="button"
                        onClick={() => startEdit(item)}
                        style={styles.secondaryButtonSmall}
                      >
                        Edytuj
                      </button>

                      {item.status !== "published" ? (
                        <button
                          type="button"
                          onClick={() => void handlePublish(item.id)}
                          style={styles.publishButtonSmall}
                        >
                          Opublikuj
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => void handleUnpublish(item.id)}
                          style={styles.secondaryButtonSmall}
                        >
                          Cofnij do draft
                        </button>
                      )}

                      {item.status !== "archived" ? (
                        <button
                          type="button"
                          onClick={() => void handleArchive(item.id)}
                          style={styles.archiveButtonSmall}
                        >
                          Archiwizuj
                        </button>
                      ) : null}

                      <button
                        type="button"
                        onClick={() => void handleDelete(item.id)}
                        disabled={deletingId === item.id}
                        style={styles.dangerButtonSmall}
                      >
                        {deletingId === item.id ? "Usuwanie..." : "Usuń"}
                      </button>
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}

function CampaignPagePreview({
  title,
  templateType,
  config,
}: {
  title: string;
  templateType: string;
  config: BuilderConfig;
}) {
  const heroTitle = config.heroTitle || title || "Podgląd kampanii";
  const heroDescription =
    config.heroDescription || "Tutaj zobaczysz podgląd treści kampanii.";
  const ctaLabel = config.ctaLabel || "Sprawdź więcej";

  return (
    <div style={previewStyles.wrapper}>
      <div style={previewStyles.hero}>
        <div style={previewStyles.heroBadge}>LIVE PREVIEW</div>
        <h2 style={previewStyles.heroTitle}>{heroTitle}</h2>
        <p style={previewStyles.heroDescription}>{heroDescription}</p>

        {templateType !== "quiz" && templateType !== "coupon" ? (
          <button style={previewStyles.primaryButton}>{ctaLabel}</button>
        ) : null}
      </div>

      <div style={previewStyles.content}>
        {templateType === "landing" && (
          <div style={previewStyles.card}>
            <h3 style={previewStyles.cardTitle}>Landing</h3>
            <p style={previewStyles.cardText}>
              Standardowa strona kampanii z sekcją hero i CTA.
            </p>
          </div>
        )}

        {templateType === "contest" && (
          <div style={previewStyles.card}>
            <h3 style={previewStyles.cardTitle}>Contest</h3>
            <p style={previewStyles.cardText}>
              Nagroda główna: {config.rewardTitle || "Voucher / zestaw nagród"}
            </p>
            <button style={previewStyles.primaryButton}>
              {config.ctaLabel || "Dołącz"}
            </button>
          </div>
        )}

        {templateType === "coupon" && (
          <div style={previewStyles.card}>
            <h3 style={previewStyles.cardTitle}>Coupon</h3>
            <div style={previewStyles.couponBox}>
              <div style={previewStyles.couponValue}>
                {config.discountValue || "10% OFF"}
              </div>
              <div style={previewStyles.couponCode}>
                {config.couponCode || "LUMEVIO10"}
              </div>
            </div>
          </div>
        )}

        {templateType === "quiz" && (
          <div style={previewStyles.card}>
            <h3 style={previewStyles.cardTitle}>Quiz</h3>
            <p style={previewStyles.cardText}>
              {config.quizQuestion || "Który wariant wybierasz?"}
            </p>
            <div style={previewStyles.quizList}>
              {(config.quizAnswers?.length
                ? config.quizAnswers
                : ["Opcja A", "Opcja B", "Opcja C"]
              ).map((answer) => (
                <div key={answer} style={previewStyles.quizItem}>
                  {answer}
                </div>
              ))}
            </div>
          </div>
        )}

        {templateType === "lead_form" && (
          <div style={previewStyles.card}>
            <h3 style={previewStyles.cardTitle}>
              {config.formTitle || "Formularz kontaktowy"}
            </h3>
            <div style={previewStyles.fakeForm}>
              <input style={previewStyles.input} placeholder="Imię" disabled />
              <input style={previewStyles.input} placeholder="Email" disabled />
              <button style={previewStyles.primaryButton}>
                {config.ctaLabel || "Wyślij"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
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
  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 16,
    marginBottom: 16,
    flexWrap: "wrap",
  },
  sectionTitle: { margin: 0, fontSize: 22, fontWeight: 700 },
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
  builderSection: {
    borderRadius: 18,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.03)",
    padding: 18,
  },
  builderTitle: {
    fontSize: 14,
    fontWeight: 800,
    marginBottom: 14,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    color: "#9ea8d8",
  },
  toggleRow: {
    display: "flex",
    alignItems: "center",
    gap: 12,
  },
  toggleLabel: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    color: "#dce3ff",
  },
  textarea: {
    minHeight: 240,
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "#0d1027",
    color: "#fff",
    padding: 14,
    outline: "none",
    resize: "vertical",
    fontFamily: "monospace",
    fontSize: 13,
  },
  textareaSmall: {
    minHeight: 120,
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "#0d1027",
    color: "#fff",
    padding: 14,
    outline: "none",
    resize: "vertical",
    fontFamily: "inherit",
    fontSize: 14,
  },
  previewBox: {
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "#0b0e22",
    padding: 16,
  },
  previewTitle: {
    fontSize: 12,
    textTransform: "uppercase",
    color: "#92a0d8",
    marginBottom: 10,
  },
  pre: {
    margin: 0,
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
    color: "#e5e9ff",
    fontSize: 13,
    fontFamily: "monospace",
  },
  previewSection: {
    marginTop: 24,
    display: "grid",
    gap: 14,
  },
  previewHeader: {
    display: "grid",
    gap: 6,
  },
  previewHeading: {
    margin: 0,
    fontSize: 20,
    fontWeight: 800,
  },
  previewSubheading: {
    margin: 0,
    color: "#9ea8d8",
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
  publishButtonSmall: {
    height: 36,
    borderRadius: 12,
    border: "1px solid rgba(80,200,120,0.32)",
    padding: "0 12px",
    fontWeight: 700,
    cursor: "pointer",
    background: "rgba(80,200,120,0.10)",
    color: "#bff7cc",
  },
  archiveButtonSmall: {
    height: 36,
    borderRadius: 12,
    border: "1px solid rgba(255,190,80,0.28)",
    padding: "0 12px",
    fontWeight: 700,
    cursor: "pointer",
    background: "rgba(255,190,80,0.10)",
    color: "#ffe2a3",
  },
  inlineLink: {
    color: "#9ab0ff",
    textDecoration: "none",
    wordBreak: "break-word",
  },
  error: { margin: 0, color: "#ff8f8f" },
  muted: { color: "#9ea8d8", marginTop: 8 },
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
  itemName: { margin: 0, fontSize: 20 },
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
    fontSize: 12,
    fontWeight: 700,
  },
  badgeSecondary: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "6px 10px",
    borderRadius: 999,
    background: "rgba(255,255,255,0.08)",
    border: "1px solid rgba(255,255,255,0.16)",
    color: "#fff",
    fontSize: 12,
    fontWeight: 700,
  },
  badgeMuted: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "6px 10px",
    borderRadius: 999,
    background: "rgba(0,0,0,0.18)",
    border: "1px solid rgba(255,255,255,0.08)",
    color: "#bfc8f6",
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

const previewStyles: Record<string, CSSProperties> = {
  wrapper: {
    borderRadius: 20,
    overflow: "hidden",
    border: "1px solid rgba(255,255,255,0.08)",
    background: "#05081a",
  },
  hero: {
    padding: 24,
    background:
      "radial-gradient(circle at top, rgba(109,124,255,0.18), transparent 30%), #0b1026",
    borderBottom: "1px solid rgba(255,255,255,0.08)",
  },
  heroBadge: {
    display: "inline-flex",
    padding: "6px 10px",
    borderRadius: 999,
    background: "rgba(109,124,255,0.14)",
    border: "1px solid rgba(109,124,255,0.35)",
    color: "#dfe3ff",
    fontSize: 12,
    fontWeight: 800,
    marginBottom: 16,
  },
  heroTitle: {
    margin: 0,
    fontSize: 32,
    fontWeight: 900,
    lineHeight: 1.05,
    color: "#fff",
  },
  heroDescription: {
    marginTop: 14,
    marginBottom: 20,
    color: "#c5cef6",
    lineHeight: 1.6,
  },
  content: {
    padding: 24,
    display: "grid",
    gap: 16,
  },
  card: {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 18,
    padding: 20,
  },
  cardTitle: {
    marginTop: 0,
    marginBottom: 12,
    fontSize: 22,
    color: "#fff",
  },
  cardText: {
    color: "#c5cef6",
    lineHeight: 1.6,
    margin: 0,
  },
  primaryButton: {
    height: 46,
    padding: "0 18px",
    borderRadius: 14,
    border: "none",
    background: "linear-gradient(135deg, #6d7cff, #8d6bff)",
    color: "#fff",
    fontWeight: 800,
    cursor: "pointer",
  },
  couponBox: {
    borderRadius: 18,
    padding: 20,
    textAlign: "center",
    background: "rgba(255,255,255,0.03)",
    border: "1px dashed rgba(255,255,255,0.18)",
  },
  couponValue: {
    fontSize: 34,
    fontWeight: 900,
    color: "#fff",
    marginBottom: 10,
  },
  couponCode: {
    fontSize: 20,
    fontWeight: 700,
    letterSpacing: "0.08em",
    color: "#dfe3ff",
  },
  quizList: {
    display: "grid",
    gap: 10,
    marginTop: 16,
  },
  quizItem: {
    minHeight: 46,
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "#0d1027",
    color: "#fff",
    padding: "12px 14px",
  },
  fakeForm: {
    display: "grid",
    gap: 12,
  },
  input: {
    height: 46,
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "#0d1027",
    color: "#7f88b8",
    padding: "0 14px",
  },
};