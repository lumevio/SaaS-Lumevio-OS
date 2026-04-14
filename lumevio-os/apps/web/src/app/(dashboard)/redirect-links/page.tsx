"use client";

import {
  FormEvent,
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
} from "react";
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

type RedirectLinkItem = {
  id: string;
  slug: string;
  destinationUrl: string;
  fallbackUrl?: string | null;
  title?: string | null;
  isActive: boolean;
  validFrom?: string | null;
  validTo?: string | null;
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

type RedirectLinkCreateResponse = {
  success: boolean;
  publicUrl: string;
  link: RedirectLinkItem;
};

type RedirectLinkQrMeta = {
  id: string;
  slug?: string | null;
  name?: string | null;
  qrValue: string;
  previewPngUrl: string;
  downloadPngUrl: string;
  downloadSvgUrl: string;
};

const INITIAL_FORM = {
  organizationId: "",
  campaignId: "",
  title: "",
  slug: "",
  destinationUrl: "",
  fallbackUrl: "",
};

export default function RedirectLinksPage() {
  const { isPlatformAdmin } = useAuth();

  const [organizations, setOrganizations] = useState<OrganizationOption[]>([]);
  const [campaigns, setCampaigns] = useState<CampaignOption[]>([]);
  const [links, setLinks] = useState<RedirectLinkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingLink, setEditingLink] = useState<RedirectLinkItem | null>(null);

  const [organizationId, setOrganizationId] = useState(INITIAL_FORM.organizationId);
  const [campaignId, setCampaignId] = useState(INITIAL_FORM.campaignId);
  const [title, setTitle] = useState(INITIAL_FORM.title);
  const [slug, setSlug] = useState(INITIAL_FORM.slug);
  const [destinationUrl, setDestinationUrl] = useState(INITIAL_FORM.destinationUrl);
  const [fallbackUrl, setFallbackUrl] = useState(INITIAL_FORM.fallbackUrl);

  const [lastCreatedPublicUrl, setLastCreatedPublicUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [qrLoadingId, setQrLoadingId] = useState<string | null>(null);
  const [selectedQrLinkId, setSelectedQrLinkId] = useState<string | null>(null);
  const [qrMeta, setQrMeta] = useState<RedirectLinkQrMeta | null>(null);
  const [qrError, setQrError] = useState<string | null>(null);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [exportingZip, setExportingZip] = useState(false);
  const [exportingSheet, setExportingSheet] = useState(false);

  function resetForm() {
    setEditingLink(null);
    setOrganizationId(INITIAL_FORM.organizationId);
    setCampaignId(INITIAL_FORM.campaignId);
    setTitle(INITIAL_FORM.title);
    setSlug(INITIAL_FORM.slug);
    setDestinationUrl(INITIAL_FORM.destinationUrl);
    setFallbackUrl(INITIAL_FORM.fallbackUrl);
  }

  function startEdit(link: RedirectLinkItem) {
    setEditingLink(link);
    setOrganizationId(link.organization?.id ?? "");
    setCampaignId(link.campaign?.id ?? "");
    setTitle(link.title ?? "");
    setSlug(link.slug ?? "");
    setDestinationUrl(link.destinationUrl ?? "");
    setFallbackUrl(link.fallbackUrl ?? "");
    setLastCreatedPublicUrl(null);
    setError(null);

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function loadPage() {
    try {
      setLoading(true);
      setError(null);

      const linksPromise = apiClient<RedirectLinkItem[]>("/redirect-links");
      const orgsPromise = isPlatformAdmin
        ? apiClient<OrganizationOption[]>("/organizations")
        : Promise.resolve<OrganizationOption[]>([]);
      const campaignsPromise = isPlatformAdmin
        ? apiClient<CampaignOption[]>("/campaigns")
        : Promise.resolve<CampaignOption[]>([]);

      const [linksData, orgs, campaignsData] = await Promise.all([
        linksPromise,
        orgsPromise,
        campaignsPromise,
      ]);

      setLinks(linksData);
      setOrganizations(orgs);
      setCampaigns(campaignsData);

      setSelectedIds((prev) => prev.filter((id) => linksData.some((item) => item.id === id)));

      const currentSelectedId = selectedQrLinkId;
      if (!currentSelectedId && linksData.length > 0) {
        void openQrPreview(linksData[0]);
      } else if (currentSelectedId) {
        const stillExists = linksData.find((item) => item.id === currentSelectedId);
        if (stillExists) {
          void openQrPreview(stillExists);
        } else {
          setSelectedQrLinkId(null);
          setQrMeta(null);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Błąd ładowania danych");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadPage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlatformAdmin]);

  const filteredCampaigns = useMemo(() => {
    if (!organizationId) return [];
    return campaigns.filter((campaign) => campaign.organization.id === organizationId);
  }, [campaigns, organizationId]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    if (!organizationId || !destinationUrl.trim()) {
      setError("Wybierz organizację i podaj destination URL");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      setLastCreatedPublicUrl(null);

      const payload = {
        organizationId,
        campaignId: campaignId || undefined,
        title: title.trim() || undefined,
        slug: slug.trim() || undefined,
        destinationUrl: destinationUrl.trim(),
        fallbackUrl: fallbackUrl.trim() || undefined,
      };

      if (editingLink) {
        await apiClient(`/redirect-links/${editingLink.id}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });

        await loadPage();
        resetForm();
      } else {
        const response = await apiClient<RedirectLinkCreateResponse>("/redirect-links", {
          method: "POST",
          body: JSON.stringify(payload),
        });

        setLastCreatedPublicUrl(response.publicUrl);
        setLinks((prev) => [response.link, ...prev]);
        resetForm();
        void openQrPreview(response.link);
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : editingLink
            ? "Nie udało się zaktualizować linku"
            : "Nie udało się utworzyć linku",
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    const ok = window.confirm("Czy na pewno chcesz usunąć redirect link?");
    if (!ok) return;

    try {
      setDeletingId(id);
      setError(null);

      await apiClient(`/redirect-links/${id}`, {
        method: "DELETE",
      });

      const updatedLinks = links.filter((item) => item.id !== id);
      setLinks(updatedLinks);
      setSelectedIds((prev) => prev.filter((itemId) => itemId !== id));

      if (editingLink?.id === id) {
        resetForm();
      }

      if (selectedQrLinkId === id) {
        if (updatedLinks.length > 0) {
          void openQrPreview(updatedLinks[0]);
        } else {
          setSelectedQrLinkId(null);
          setQrMeta(null);
          setQrError(null);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Błąd usuwania linku");
    } finally {
      setDeletingId(null);
    }
  }

  async function openQrPreview(link: RedirectLinkItem) {
    try {
      setQrLoadingId(link.id);
      setSelectedQrLinkId(link.id);
      setQrError(null);

      const meta = await apiClient<RedirectLinkQrMeta>(`/redirect-links/${link.id}/qr/meta`);
      setQrMeta(meta);
    } catch (err) {
      setQrMeta(null);
      setQrError(err instanceof Error ? err.message : "Nie udało się pobrać QR");
    } finally {
      setQrLoadingId(null);
    }
  }

  async function handleCopy(text: string, successMessage?: string) {
    try {
      await navigator.clipboard.writeText(text);
      if (successMessage) {
        window.alert(successMessage);
      }
    } catch {
      window.alert("Nie udało się skopiować do schowka");
    }
  }

  function getPublicUrl(link: RedirectLinkItem) {
    if (typeof window !== "undefined") {
      return `${window.location.origin}/r/${link.slug}`;
    }

    return `http://localhost:3001/r/${link.slug}`;
  }

  function getAbsoluteApiUrl(path: string) {
    if (!path) return "";

    if (path.startsWith("http://") || path.startsWith("https://")) {
      return path;
    }

    const apiBase =
      (process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || "").replace(
        /\/$/,
        "",
      );

    if (apiBase) {
      return `${apiBase}${path.startsWith("/") ? path : `/${path}`}`;
    }

    return path;
  }

  function toggleSelected(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  }

  function toggleSelectAll() {
    if (selectedIds.length === links.length) {
      setSelectedIds([]);
      return;
    }

    setSelectedIds(links.map((item) => item.id));
  }

  async function exportZip(format: "png" | "svg" = "png") {
    if (selectedIds.length === 0) {
      window.alert("Wybierz przynajmniej jeden redirect link.");
      return;
    }

    try {
      setExportingZip(true);

      const apiBase =
        (process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || "").replace(
          /\/$/,
          "",
        );

      const response = await fetch(`${apiBase}/redirect-links/export/qr-zip`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ids: selectedIds,
          format,
          size: 1024,
          margin: 2,
        }),
      });

      if (!response.ok) {
        throw new Error(`Eksport ZIP nieudany (${response.status})`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `redirect-links-qr-${format}.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Nie udało się wyeksportować ZIP");
    } finally {
      setExportingZip(false);
    }
  }

  async function exportPrintSheet() {
    if (selectedIds.length === 0) {
      window.alert("Wybierz przynajmniej jeden redirect link.");
      return;
    }

    try {
      setExportingSheet(true);

      const apiBase =
        (process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || "").replace(
          /\/$/,
          "",
        );

      const response = await fetch(`${apiBase}/redirect-links/export/print-sheet`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ids: selectedIds,
          margin: 2,
        }),
      });

      if (!response.ok) {
        throw new Error(`Eksport print sheet nieudany (${response.status})`);
      }

      const html = await response.text();
      const newWindow = window.open("", "_blank", "noopener,noreferrer");
      if (!newWindow) {
        throw new Error("Przeglądarka zablokowała nowe okno.");
      }

      newWindow.document.open();
      newWindow.document.write(html);
      newWindow.document.close();
      newWindow.focus();
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Nie udało się wygenerować arkusza");
    } finally {
      setExportingSheet(false);
    }
  }

  const selectedLink = links.find((item) => item.id === selectedQrLinkId) ?? null;

  return (
    <main style={styles.page}>
      <div style={styles.header}>
        <h1 style={styles.title}>Redirect Links</h1>
        <p style={styles.subtitle}>
          Publiczne linki dla kampanii, aktywacji NFC i ścieżek użytkownika.
        </p>
      </div>

      {isPlatformAdmin ? (
        <section style={styles.card}>
          <div style={styles.sectionHeader}>
            <div>
              <h2 style={styles.sectionTitle}>
                {editingLink ? "Edytuj redirect link" : "Dodaj redirect link"}
              </h2>
              <p style={styles.muted}>
                {editingLink
                  ? "Aktualizujesz istniejący link publiczny."
                  : "Tworzysz nowy publiczny link do kampanii, redirectu lub aktywacji NFC."}
              </p>
            </div>

            {editingLink ? (
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
                <option value="">Opcjonalnie wybierz kampanię</option>
                {filteredCampaigns.map((campaign) => (
                  <option key={campaign.id} value={campaign.id}>
                    {campaign.name}
                  </option>
                ))}
              </select>

              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Tytuł linku"
                style={styles.input}
              />

              <input
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="Slug opcjonalny"
                style={styles.input}
              />

              <input
                value={destinationUrl}
                onChange={(e) => setDestinationUrl(e.target.value)}
                placeholder="Destination URL"
                style={styles.input}
              />

              <input
                value={fallbackUrl}
                onChange={(e) => setFallbackUrl(e.target.value)}
                placeholder="Fallback URL opcjonalny"
                style={styles.input}
              />
            </div>

            <div style={styles.actionsRow}>
              <button type="submit" disabled={submitting} style={styles.button}>
                {submitting
                  ? editingLink
                    ? "Zapisywanie..."
                    : "Tworzenie..."
                  : editingLink
                    ? "Zapisz zmiany"
                    : "Utwórz redirect link"}
              </button>

              {editingLink ? (
                <button type="button" onClick={resetForm} style={styles.secondaryButton}>
                  Wyczyść formularz
                </button>
              ) : null}
            </div>

            {lastCreatedPublicUrl ? (
              <div style={styles.successBox}>
                <div style={styles.successLabel}>Publiczny URL</div>
                <a
                  href={lastCreatedPublicUrl}
                  target="_blank"
                  rel="noreferrer"
                  style={styles.successLink}
                >
                  {lastCreatedPublicUrl}
                </a>
              </div>
            ) : null}

            {error ? <p style={styles.error}>{error}</p> : null}
          </form>
        </section>
      ) : (
        <section style={styles.card}>
          <h2 style={styles.sectionTitle}>Redirect links organizacji</h2>
          <p style={styles.muted}>Tylko superadmin może tworzyć nowe linki.</p>
          {error ? <p style={styles.error}>{error}</p> : null}
        </section>
      )}

      <section style={styles.card}>
        <div style={styles.sectionHeader}>
          <div>
            <h2 style={styles.sectionTitle}>Batch QR Export</h2>
            <p style={styles.muted}>Masowy eksport ZIP i arkusza A4 dla wybranych linków.</p>
          </div>

          <div style={styles.actionsRow}>
            <button type="button" onClick={toggleSelectAll} style={styles.secondaryButton}>
              {selectedIds.length === links.length && links.length > 0
                ? "Odznacz wszystko"
                : "Zaznacz wszystko"}
            </button>

            <button
              type="button"
              onClick={() => void exportZip("png")}
              disabled={exportingZip || selectedIds.length === 0}
              style={styles.secondaryButton}
            >
              {exportingZip ? "Eksport ZIP..." : "ZIP PNG"}
            </button>

            <button
              type="button"
              onClick={() => void exportZip("svg")}
              disabled={exportingZip || selectedIds.length === 0}
              style={styles.secondaryButton}
            >
              {exportingZip ? "Eksport ZIP..." : "ZIP SVG"}
            </button>

            <button
              type="button"
              onClick={() => void exportPrintSheet()}
              disabled={exportingSheet || selectedIds.length === 0}
              style={styles.secondaryButton}
            >
              {exportingSheet ? "Generowanie..." : "Arkusz A4"}
            </button>
          </div>
        </div>

        <div style={styles.exportInfo}>
          Wybrano: <strong>{selectedIds.length}</strong>
        </div>
      </section>

      <section style={styles.qrLayout}>
        <div style={styles.qrLeftColumn}>
          <section style={styles.card}>
            <div style={styles.sectionHeader}>
              <h2 style={styles.sectionTitle}>Lista linków</h2>
              <button onClick={() => void loadPage()} style={styles.secondaryButton}>
                Odśwież
              </button>
            </div>

            {loading ? (
              <p style={styles.muted}>Ładowanie...</p>
            ) : links.length === 0 ? (
              <p style={styles.muted}>Brak linków.</p>
            ) : (
              <div style={styles.list}>
                {links.map((link) => {
                  const publicUrl = getPublicUrl(link);
                  const isSelectedQr = selectedQrLinkId === link.id;
                  const isChecked = selectedIds.includes(link.id);

                  return (
                    <article
                      key={link.id}
                      style={{
                        ...styles.linkCard,
                        ...(isSelectedQr ? styles.linkCardActive : {}),
                      }}
                    >
                      <div style={styles.checkboxRow}>
                        <label style={styles.checkboxLabel}>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleSelected(link.id)}
                          />
                          <span>Zaznacz do eksportu</span>
                        </label>
                      </div>

                      <div style={styles.linkTop}>
                        <div>
                          <h3 style={styles.linkName}>{link.title || link.slug}</h3>
                          <p style={styles.linkMeta}>
                            {link.organization?.name || "Brak organizacji"}
                            {link.campaign ? ` · ${link.campaign.name}` : ""}
                          </p>
                        </div>

                        <div style={styles.badges}>
                          <span style={styles.badge}>
                            {link.isActive ? "ACTIVE" : "INACTIVE"}
                          </span>
                        </div>
                      </div>

                      <div style={styles.infoGrid}>
                        <div>
                          <span style={styles.label}>Slug</span>
                          <div style={styles.value}>{link.slug}</div>
                        </div>

                        <div>
                          <span style={styles.label}>Destination</span>
                          <div style={styles.value}>{link.destinationUrl}</div>
                        </div>

                        <div>
                          <span style={styles.label}>Fallback</span>
                          <div style={styles.value}>{link.fallbackUrl || "—"}</div>
                        </div>

                        <div>
                          <span style={styles.label}>Public URL</span>
                          <a
                            href={publicUrl}
                            target="_blank"
                            rel="noreferrer"
                            style={styles.inlineLink}
                          >
                            {publicUrl}
                          </a>
                        </div>
                      </div>

                      <div style={styles.itemActions}>
                        <button
                          type="button"
                          onClick={() => void openQrPreview(link)}
                          style={styles.secondaryButtonSmall}
                        >
                          {qrLoadingId === link.id ? "Ładowanie QR..." : "Pokaż QR"}
                        </button>

                        <button
                          type="button"
                          onClick={() => void handleCopy(publicUrl, "Skopiowano publiczny URL")}
                          style={styles.secondaryButtonSmall}
                        >
                          Kopiuj URL
                        </button>

                        {isPlatformAdmin ? (
                          <>
                            <button
                              type="button"
                              onClick={() => startEdit(link)}
                              style={styles.secondaryButtonSmall}
                            >
                              Edytuj
                            </button>

                            <button
                              type="button"
                              onClick={() => void handleDelete(link.id)}
                              disabled={deletingId === link.id}
                              style={styles.dangerButtonSmall}
                            >
                              {deletingId === link.id ? "Usuwanie..." : "Usuń"}
                            </button>
                          </>
                        ) : null}
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        <div style={styles.qrRightColumn}>
          <section style={styles.cardSticky}>
            <div style={styles.sectionHeader}>
              <div>
                <h2 style={styles.sectionTitle}>QR Tools</h2>
                <p style={styles.muted}>
                  Podgląd, kopiowanie i pobieranie kodu QR dla wybranego redirect linku.
                </p>
              </div>
            </div>

            {!selectedLink ? (
              <p style={styles.muted}>Wybierz link z listy, aby zobaczyć QR.</p>
            ) : qrLoadingId === selectedLink.id ? (
              <p style={styles.muted}>Ładowanie QR...</p>
            ) : qrError ? (
              <p style={styles.error}>{qrError}</p>
            ) : !qrMeta ? (
              <p style={styles.muted}>Brak danych QR.</p>
            ) : (
              <div style={styles.qrPanel}>
                <div style={styles.qrPreviewBox}>
                  <img
                    src={getAbsoluteApiUrl(qrMeta.previewPngUrl)}
                    alt={`QR ${selectedLink.slug}`}
                    style={styles.qrImage}
                  />
                </div>

                <div style={styles.qrInfoBox}>
                  <div>
                    <span style={styles.label}>Wybrany link</span>
                    <div style={styles.value}>{selectedLink.title || selectedLink.slug}</div>
                  </div>

                  <div>
                    <span style={styles.label}>QR value</span>
                    <div style={styles.valueBreak}>{qrMeta.qrValue}</div>
                  </div>
                </div>

                <div style={styles.qrActions}>
                  <button
                    type="button"
                    onClick={() => void handleCopy(qrMeta.qrValue, "Skopiowano QR URL")}
                    style={styles.button}
                  >
                    Kopiuj QR URL
                  </button>

                  <a
                    href={getAbsoluteApiUrl(qrMeta.downloadPngUrl)}
                    style={styles.secondaryActionLink}
                  >
                    Pobierz PNG
                  </a>

                  <a
                    href={getAbsoluteApiUrl(qrMeta.downloadSvgUrl)}
                    style={styles.secondaryActionLink}
                  >
                    Pobierz SVG
                  </a>

                  <a
                    href={qrMeta.qrValue}
                    target="_blank"
                    rel="noreferrer"
                    style={styles.secondaryActionLink}
                  >
                    Otwórz URL
                  </a>
                </div>
              </div>
            )}
          </section>
        </div>
      </section>
    </main>
  );
}

const styles: Record<string, CSSProperties> = {
  page: { color: "#fff" },
  header: { marginBottom: 24 },
  title: { margin: 0, fontSize: 32, fontWeight: 800 },
  subtitle: { marginTop: 8, color: "#9ea8d8" },

  qrLayout: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1.25fr) minmax(320px, 0.75fr)",
    gap: 24,
    alignItems: "start",
  },
  qrLeftColumn: {
    minWidth: 0,
  },
  qrRightColumn: {
    minWidth: 0,
  },

  card: {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
  },
  cardSticky: {
    position: "sticky",
    top: 24,
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 20,
    padding: 24,
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
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    textDecoration: "none",
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
  secondaryActionLink: {
    height: 46,
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.1)",
    padding: "0 18px",
    fontWeight: 700,
    cursor: "pointer",
    background: "transparent",
    color: "#fff",
    textDecoration: "none",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
  },
  successBox: {
    background: "rgba(80,200,120,0.08)",
    border: "1px solid rgba(80,200,120,0.24)",
    borderRadius: 14,
    padding: 14,
  },
  successLabel: {
    fontSize: 12,
    color: "#98e2ae",
    marginBottom: 8,
    textTransform: "uppercase",
  },
  successLink: {
    color: "#fff",
    textDecoration: "none",
    wordBreak: "break-word",
  },
  error: { margin: 0, color: "#ff8f8f" },
  muted: { color: "#9ea8d8", marginTop: 8 },
  exportInfo: {
    color: "#d7dcff",
    fontSize: 14,
  },
  list: { display: "grid", gap: 16 },
  linkCard: {
    background: "#0d1027",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 16,
    padding: 18,
  },
  linkCardActive: {
    border: "1px solid rgba(109,124,255,0.55)",
    boxShadow: "0 0 0 1px rgba(109,124,255,0.18) inset",
  },
  checkboxRow: {
    marginBottom: 12,
  },
  checkboxLabel: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    color: "#c9d2ff",
    fontSize: 14,
    cursor: "pointer",
  },
  linkTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 16,
    marginBottom: 14,
  },
  linkName: { margin: 0, fontSize: 20 },
  linkMeta: { margin: "6px 0 0 0", color: "#9ea8d8" },
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
  valueBreak: {
    color: "#fff",
    wordBreak: "break-word",
    lineHeight: 1.5,
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 12,
    padding: 12,
  },
  inlineLink: {
    color: "#9ab0ff",
    textDecoration: "none",
    wordBreak: "break-word",
  },
  itemActions: {
    display: "flex",
    gap: 10,
    marginTop: 18,
    flexWrap: "wrap",
  },
  qrPanel: {
    display: "grid",
    gap: 18,
  },
  qrPreviewBox: {
    background: "#ffffff",
    borderRadius: 18,
    padding: 16,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: 280,
  },
  qrImage: {
    width: "100%",
    maxWidth: 320,
    height: "auto",
    objectFit: "contain",
    display: "block",
  },
  qrInfoBox: {
    display: "grid",
    gap: 16,
  },
  qrActions: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: 12,
  },
};