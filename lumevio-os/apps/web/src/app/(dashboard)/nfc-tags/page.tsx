"use client";

import { FormEvent, useEffect, useMemo, useState, type CSSProperties } from "react";
import { apiClient } from "@/lib/api-client";
import { useAuth } from "@/hooks/use-auth";

type OrganizationOption = {
  id: string;
  name: string;
  slug: string;
};

type StoreOption = {
  id: string;
  name: string;
  organization?: {
    id: string;
    name: string;
    slug: string;
  } | null;
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

type RedirectLinkOption = {
  id: string;
  slug: string;
  title?: string | null;
  destinationUrl?: string;
  organization?: {
    id: string;
    name: string;
    slug: string;
  } | null;
};

type NfcTagItem = {
  id: string;
  organizationId: string;
  storeId?: string | null;
  campaignId?: string | null;
  redirectLinkId?: string | null;
  uid: string;
  serialNumber?: string | null;
  tagType?: string | null;
  label?: string | null;
  status: string;
  assignedAt?: string | null;
  createdAt: string;
  organization?: {
    id: string;
    name: string;
    slug: string;
  } | null;
  store?: {
    id: string;
    name: string;
  } | null;
  campaign?: {
    id: string;
    name: string;
    slug: string;
  } | null;
  redirectLink?: {
    id: string;
    slug: string;
    title?: string | null;
    destinationUrl?: string;
  } | null;
};

type NfcTagQrMeta = {
  id: string;
  uid?: string | null;
  slug?: string | null;
  name?: string | null;
  qrValue: string;
  previewPngUrl: string;
  downloadPngUrl: string;
  downloadSvgUrl: string;
};

const INITIAL_FORM = {
  organizationId: "",
  storeId: "",
  campaignId: "",
  redirectLinkId: "",
  uid: "",
  serialNumber: "",
  tagType: "",
  label: "",
  status: "ACTIVE",
};

const API_PUBLIC_BASE =
  process.env.NEXT_PUBLIC_PUBLIC_BASE_URL ||
  process.env.NEXT_PUBLIC_APP_URL ||
  "http://localhost:3001";

export default function NfcTagsPage() {
  const { isPlatformAdmin } = useAuth();

  const [organizations, setOrganizations] = useState<OrganizationOption[]>([]);
  const [stores, setStores] = useState<StoreOption[]>([]);
  const [campaigns, setCampaigns] = useState<CampaignOption[]>([]);
  const [redirectLinks, setRedirectLinks] = useState<RedirectLinkOption[]>([]);
  const [items, setItems] = useState<NfcTagItem[]>([]);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<NfcTagItem | null>(null);
  const [copiedValue, setCopiedValue] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [organizationId, setOrganizationId] = useState(INITIAL_FORM.organizationId);
  const [storeId, setStoreId] = useState(INITIAL_FORM.storeId);
  const [campaignId, setCampaignId] = useState(INITIAL_FORM.campaignId);
  const [redirectLinkId, setRedirectLinkId] = useState(INITIAL_FORM.redirectLinkId);
  const [uid, setUid] = useState(INITIAL_FORM.uid);
  const [serialNumber, setSerialNumber] = useState(INITIAL_FORM.serialNumber);
  const [tagType, setTagType] = useState(INITIAL_FORM.tagType);
  const [label, setLabel] = useState(INITIAL_FORM.label);
  const [status, setStatus] = useState(INITIAL_FORM.status);

  const [selectedQrTagId, setSelectedQrTagId] = useState<string | null>(null);
  const [qrMeta, setQrMeta] = useState<NfcTagQrMeta | null>(null);
  const [qrLoadingId, setQrLoadingId] = useState<string | null>(null);
  const [qrError, setQrError] = useState<string | null>(null);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [exportingZip, setExportingZip] = useState(false);
  const [exportingSheet, setExportingSheet] = useState(false);

  function resetForm() {
    setEditingItem(null);
    setOrganizationId(INITIAL_FORM.organizationId);
    setStoreId(INITIAL_FORM.storeId);
    setCampaignId(INITIAL_FORM.campaignId);
    setRedirectLinkId(INITIAL_FORM.redirectLinkId);
    setUid(INITIAL_FORM.uid);
    setSerialNumber(INITIAL_FORM.serialNumber);
    setTagType(INITIAL_FORM.tagType);
    setLabel(INITIAL_FORM.label);
    setStatus(INITIAL_FORM.status);
    setError(null);
  }

  function startEdit(item: NfcTagItem) {
    setEditingItem(item);
    setOrganizationId(item.organization?.id ?? item.organizationId ?? "");
    setStoreId(item.store?.id ?? item.storeId ?? "");
    setCampaignId(item.campaign?.id ?? item.campaignId ?? "");
    setRedirectLinkId(item.redirectLink?.id ?? item.redirectLinkId ?? "");
    setUid(item.uid ?? "");
    setSerialNumber(item.serialNumber ?? "");
    setTagType(item.tagType ?? "");
    setLabel(item.label ?? "");
    setStatus(item.status ?? "ACTIVE");
    setError(null);

    void openQrPreview(item);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function loadPage() {
    try {
      setLoading(true);
      setError(null);

      const [tagsData, orgsData, storesData, campaignsData, redirectLinksData] =
        await Promise.all([
          apiClient<NfcTagItem[]>("/nfc-tags"),
          apiClient<OrganizationOption[]>("/organizations"),
          apiClient<StoreOption[]>("/stores"),
          apiClient<CampaignOption[]>("/campaigns"),
          apiClient<RedirectLinkOption[]>("/redirect-links"),
        ]);

      setItems(tagsData);
      setOrganizations(orgsData);
      setStores(storesData);
      setCampaigns(campaignsData);
      setRedirectLinks(redirectLinksData);

      setSelectedIds((prev) => prev.filter((id) => tagsData.some((item) => item.id === id)));

      const currentSelectedId = selectedQrTagId;

      if (!currentSelectedId && tagsData.length > 0) {
        void openQrPreview(tagsData[0]);
      } else if (currentSelectedId) {
        const stillExists = tagsData.find((item) => item.id === currentSelectedId);
        if (stillExists) {
          void openQrPreview(stillExists);
        } else {
          setSelectedQrTagId(null);
          setQrMeta(null);
          setQrError(null);
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

  const filteredStores = useMemo(() => {
    if (!organizationId) return [];
    return stores.filter((store) => store.organization?.id === organizationId);
  }, [stores, organizationId]);

  const filteredCampaigns = useMemo(() => {
    if (!organizationId) return [];
    return campaigns.filter((campaign) => campaign.organization.id === organizationId);
  }, [campaigns, organizationId]);

  const filteredRedirectLinks = useMemo(() => {
    if (!organizationId) return [];
    return redirectLinks.filter((link) => link.organization?.id === organizationId);
  }, [redirectLinks, organizationId]);

  const selectedRedirectLink = useMemo(() => {
    return filteredRedirectLinks.find((link) => link.id === redirectLinkId) ?? null;
  }, [filteredRedirectLinks, redirectLinkId]);

  const selectedQrItem = useMemo(() => {
    return items.find((item) => item.id === selectedQrTagId) ?? null;
  }, [items, selectedQrTagId]);

  function getTapUrl(tagId: string, redirectSlug?: string | null) {
    if (!redirectSlug) return "";
    return `${API_PUBLIC_BASE.replace(/\/$/, "")}/r/${redirectSlug}?nfc_tag_id=${encodeURIComponent(
      tagId,
    )}`;
  }

  function getPreviewTapUrl() {
    if (!editingItem || !selectedRedirectLink?.slug) return "";
    return getTapUrl(editingItem.id, selectedRedirectLink.slug);
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

  async function copyToClipboard(value: string, key: string) {
    if (!value) return;

    try {
      await navigator.clipboard.writeText(value);
      setCopiedValue(key);
      window.setTimeout(() => {
        setCopiedValue((prev) => (prev === key ? null : prev));
      }, 1800);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nie udało się skopiować");
    }
  }

  async function openQrPreview(item: NfcTagItem) {
    try {
      setSelectedQrTagId(item.id);
      setQrLoadingId(item.id);
      setQrError(null);

      const meta = await apiClient<NfcTagQrMeta>(`/nfc-tags/${item.id}/qr/meta`);
      setQrMeta(meta);
    } catch (err) {
      setQrMeta(null);
      setQrError(err instanceof Error ? err.message : "Nie udało się pobrać QR");
    } finally {
      setQrLoadingId(null);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    if (!organizationId || !uid.trim()) {
      setError("Wybierz organizację i podaj UID tagu");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const payload = {
        organizationId,
        storeId: storeId || undefined,
        campaignId: campaignId || undefined,
        redirectLinkId: redirectLinkId || undefined,
        uid: uid.trim(),
        serialNumber: serialNumber.trim() || undefined,
        tagType: tagType.trim() || undefined,
        label: label.trim() || undefined,
        status: status || undefined,
      };

      if (editingItem) {
        await apiClient(`/nfc-tags/${editingItem.id}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });

        await loadPage();
        resetForm();
      } else {
        await apiClient("/nfc-tags", {
          method: "POST",
          body: JSON.stringify(payload),
        });

        resetForm();
        await loadPage();
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : editingItem
            ? "Nie udało się zaktualizować tagu"
            : "Nie udało się utworzyć tagu",
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    const ok = window.confirm("Czy na pewno chcesz usunąć tag NFC?");
    if (!ok) return;

    try {
      setDeletingId(id);
      setError(null);

      await apiClient(`/nfc-tags/${id}`, {
        method: "DELETE",
      });

      const updatedItems = items.filter((item) => item.id !== id);
      setItems(updatedItems);
      setSelectedIds((prev) => prev.filter((itemId) => itemId !== id));

      if (editingItem?.id === id) {
        resetForm();
      }

      if (selectedQrTagId === id) {
        if (updatedItems.length > 0) {
          void openQrPreview(updatedItems[0]);
        } else {
          setSelectedQrTagId(null);
          setQrMeta(null);
          setQrError(null);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Błąd usuwania tagu");
    } finally {
      setDeletingId(null);
    }
  }

  function toggleSelected(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  }

  function toggleSelectAll() {
    if (selectedIds.length === items.length) {
      setSelectedIds([]);
      return;
    }

    setSelectedIds(items.map((item) => item.id));
  }

  async function exportZip(format: "png" | "svg" = "png") {
    if (selectedIds.length === 0) {
      window.alert("Wybierz przynajmniej jeden tag NFC.");
      return;
    }

    try {
      setExportingZip(true);

      const apiBase =
        (process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || "").replace(
          /\/$/,
          "",
        );

      const response = await fetch(`${apiBase}/nfc-tags/export/qr-zip`, {
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
      a.download = `nfc-tags-qr-${format}.zip`;
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
      window.alert("Wybierz przynajmniej jeden tag NFC.");
      return;
    }

    try {
      setExportingSheet(true);

      const apiBase =
        (process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || "").replace(
          /\/$/,
          "",
        );

      const response = await fetch(`${apiBase}/nfc-tags/export/print-sheet`, {
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

  return (
    <main style={styles.page}>
      <div style={styles.header}>
        <h1 style={styles.title}>NFC Tags</h1>
        <p style={styles.subtitle}>
          Zarządzasz tagami NFC i przypisujesz je do organizacji, sklepów, kampanii oraz redirect linków.
        </p>
      </div>

      {isPlatformAdmin ? (
        <section style={styles.card}>
          <div style={styles.sectionHeader}>
            <div>
              <h2 style={styles.sectionTitle}>
                {editingItem ? "Edytuj tag NFC" : "Dodaj tag NFC"}
              </h2>
              <p style={styles.muted}>
                {editingItem
                  ? "Aktualizujesz istniejący tag NFC."
                  : "Tworzysz nowy fizyczny tag do wdrożenia w kampanii."}
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
                  setStoreId("");
                  setCampaignId("");
                  setRedirectLinkId("");
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
                value={storeId}
                onChange={(e) => setStoreId(e.target.value)}
                style={styles.input}
                disabled={!organizationId}
              >
                <option value="">Opcjonalnie wybierz sklep</option>
                {filteredStores.map((store) => (
                  <option key={store.id} value={store.id}>
                    {store.name}
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

              <select
                value={redirectLinkId}
                onChange={(e) => setRedirectLinkId(e.target.value)}
                style={styles.input}
                disabled={!organizationId}
              >
                <option value="">Opcjonalnie wybierz redirect link</option>
                {filteredRedirectLinks.map((link) => (
                  <option key={link.id} value={link.id}>
                    {link.title || link.slug}
                  </option>
                ))}
              </select>

              <input
                value={uid}
                onChange={(e) => setUid(e.target.value)}
                placeholder="UID tagu"
                style={styles.input}
              />

              <input
                value={serialNumber}
                onChange={(e) => setSerialNumber(e.target.value)}
                placeholder="Serial number"
                style={styles.input}
              />

              <input
                value={tagType}
                onChange={(e) => setTagType(e.target.value)}
                placeholder="Typ tagu"
                style={styles.input}
              />

              <input
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="Label / nazwa"
                style={styles.input}
              />

              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                style={styles.input}
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="INACTIVE">INACTIVE</option>
                <option value="ASSIGNED">ASSIGNED</option>
                <option value="DAMAGED">DAMAGED</option>
              </select>
            </div>

            {editingItem && selectedRedirectLink?.slug ? (
              <div style={styles.toolsBox}>
                <div style={styles.toolsHeader}>
                  <h3 style={styles.toolsTitle}>Narzędzia tagu</h3>
                  <p style={styles.toolsSubtitle}>
                    Gotowy link do tapnięcia telefonu lub testu tagu NFC.
                  </p>
                </div>

                <div style={styles.urlBox}>
                  <div style={styles.urlLabel}>Tap URL</div>
                  <div style={styles.urlValue}>{getPreviewTapUrl()}</div>
                </div>

                <div style={styles.actionsRow}>
                  <button
                    type="button"
                    onClick={() => void copyToClipboard(getPreviewTapUrl(), `tap-${editingItem.id}`)}
                    style={styles.copyButton}
                  >
                    {copiedValue === `tap-${editingItem.id}` ? "Skopiowano" : "Kopiuj link"}
                  </button>

                  <a
                    href={getPreviewTapUrl()}
                    target="_blank"
                    rel="noreferrer"
                    style={styles.openLinkButton}
                  >
                    Otwórz link
                  </a>
                </div>
              </div>
            ) : null}

            <div style={styles.actionsRow}>
              <button type="submit" disabled={submitting} style={styles.button}>
                {submitting
                  ? editingItem
                    ? "Zapisywanie..."
                    : "Tworzenie..."
                  : editingItem
                    ? "Zapisz zmiany"
                    : "Utwórz tag"}
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
          <h2 style={styles.sectionTitle}>Tagi NFC organizacji</h2>
          <p style={styles.muted}>Tylko superadmin może zarządzać tagami NFC.</p>
          {error ? <p style={styles.error}>{error}</p> : null}
        </section>
      )}

      <section style={styles.card}>
        <div style={styles.sectionHeader}>
          <div>
            <h2 style={styles.sectionTitle}>Batch QR Export</h2>
            <p style={styles.muted}>Masowy eksport ZIP i arkusza A4 dla wybranych tagów NFC.</p>
          </div>

          <div style={styles.actionsRow}>
            <button type="button" onClick={toggleSelectAll} style={styles.secondaryButton}>
              {selectedIds.length === items.length && items.length > 0
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
              <h2 style={styles.sectionTitle}>Lista tagów</h2>
              <button onClick={() => void loadPage()} style={styles.secondaryButton}>
                Odśwież
              </button>
            </div>

            {loading ? (
              <p style={styles.muted}>Ładowanie...</p>
            ) : items.length === 0 ? (
              <p style={styles.muted}>Brak tagów NFC.</p>
            ) : (
              <div style={styles.list}>
                {items.map((item) => {
                  const tapUrl = getTapUrl(item.id, item.redirectLink?.slug);
                  const isSelected = selectedQrTagId === item.id;
                  const isChecked = selectedIds.includes(item.id);

                  return (
                    <article
                      key={item.id}
                      style={{
                        ...styles.itemCard,
                        ...(isSelected ? styles.itemCardActive : {}),
                      }}
                    >
                      <div style={styles.checkboxRow}>
                        <label style={styles.checkboxLabel}>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleSelected(item.id)}
                          />
                          <span>Zaznacz do eksportu</span>
                        </label>
                      </div>

                      <div style={styles.itemTop}>
                        <div>
                          <h3 style={styles.itemName}>{item.label || item.uid}</h3>
                          <p style={styles.itemMeta}>{item.uid}</p>
                        </div>

                        <div style={styles.badges}>
                          <span style={styles.badge}>{item.status || "ACTIVE"}</span>
                        </div>
                      </div>

                      <div style={styles.infoGrid}>
                        <div>
                          <span style={styles.label}>Organizacja</span>
                          <div style={styles.value}>{item.organization?.name || "—"}</div>
                        </div>

                        <div>
                          <span style={styles.label}>Sklep</span>
                          <div style={styles.value}>{item.store?.name || "—"}</div>
                        </div>

                        <div>
                          <span style={styles.label}>Campaign</span>
                          <div style={styles.value}>{item.campaign?.name || "—"}</div>
                        </div>

                        <div>
                          <span style={styles.label}>Redirect</span>
                          <div style={styles.value}>
                            {item.redirectLink?.title || item.redirectLink?.slug || "—"}
                          </div>
                        </div>

                        <div>
                          <span style={styles.label}>Typ tagu</span>
                          <div style={styles.value}>{item.tagType || "—"}</div>
                        </div>

                        <div>
                          <span style={styles.label}>Serial</span>
                          <div style={styles.value}>{item.serialNumber || "—"}</div>
                        </div>

                        <div>
                          <span style={styles.label}>Tap URL</span>
                          {tapUrl ? (
                            <a href={tapUrl} target="_blank" rel="noreferrer" style={styles.inlineLink}>
                              {tapUrl}
                            </a>
                          ) : (
                            <div style={styles.value}>Brak redirect linku</div>
                          )}
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

                          <button
                            type="button"
                            onClick={() => void openQrPreview(item)}
                            style={styles.secondaryButtonSmall}
                          >
                            {qrLoadingId === item.id ? "Ładowanie QR..." : "Pokaż QR"}
                          </button>

                          {tapUrl ? (
                            <button
                              type="button"
                              onClick={() => void copyToClipboard(tapUrl, `list-${item.id}`)}
                              style={styles.copyButtonSmall}
                            >
                              {copiedValue === `list-${item.id}` ? "Skopiowano" : "Kopiuj link"}
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
        </div>

        <div style={styles.qrRightColumn}>
          <section style={styles.cardSticky}>
            <div style={styles.sectionHeader}>
              <div>
                <h2 style={styles.sectionTitle}>QR Tools</h2>
                <p style={styles.muted}>
                  Podgląd, kopiowanie i pobieranie QR dla wybranego tagu NFC.
                </p>
              </div>
            </div>

            {!selectedQrItem ? (
              <p style={styles.muted}>Wybierz tag z listy, aby zobaczyć QR.</p>
            ) : qrLoadingId === selectedQrItem.id ? (
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
                    alt={`QR ${selectedQrItem.label || selectedQrItem.uid}`}
                    style={styles.qrImage}
                  />
                </div>

                <div style={styles.qrInfoBox}>
                  <div>
                    <span style={styles.label}>Wybrany tag</span>
                    <div style={styles.value}>
                      {selectedQrItem.label || selectedQrItem.uid}
                    </div>
                  </div>

                  <div>
                    <span style={styles.label}>UID</span>
                    <div style={styles.value}>{selectedQrItem.uid}</div>
                  </div>

                  <div>
                    <span style={styles.label}>QR value</span>
                    <div style={styles.valueBreak}>{qrMeta.qrValue}</div>
                  </div>
                </div>

                <div style={styles.qrActions}>
                  <button
                    type="button"
                    onClick={() => void copyToClipboard(qrMeta.qrValue, `qr-${selectedQrItem.id}`)}
                    style={styles.button}
                  >
                    {copiedValue === `qr-${selectedQrItem.id}` ? "Skopiowano" : "Kopiuj QR URL"}
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
                    style={styles.openLinkButtonLarge}
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
  copyButton: {
    height: 40,
    borderRadius: 12,
    border: "1px solid rgba(109,124,255,0.32)",
    padding: "0 14px",
    fontWeight: 700,
    cursor: "pointer",
    background: "rgba(109,124,255,0.10)",
    color: "#d7dcff",
  },
  copyButtonSmall: {
    height: 36,
    borderRadius: 12,
    border: "1px solid rgba(109,124,255,0.32)",
    padding: "0 12px",
    fontWeight: 700,
    cursor: "pointer",
    background: "rgba(109,124,255,0.10)",
    color: "#d7dcff",
  },
  openLinkButton: {
    height: 40,
    borderRadius: 12,
    border: "1px solid rgba(80,200,120,0.28)",
    padding: "0 14px",
    fontWeight: 700,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    background: "rgba(80,200,120,0.08)",
    color: "#c9ffd8",
    textDecoration: "none",
  },
  openLinkButtonLarge: {
    height: 46,
    borderRadius: 14,
    border: "1px solid rgba(80,200,120,0.28)",
    padding: "0 18px",
    fontWeight: 700,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    background: "rgba(80,200,120,0.08)",
    color: "#c9ffd8",
    textDecoration: "none",
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
  error: { margin: 0, color: "#ff8f8f" },
  muted: { color: "#9ea8d8", marginTop: 8 },
  exportInfo: {
    color: "#d7dcff",
    fontSize: 14,
  },
  list: { display: "grid", gap: 16 },
  itemCard: {
    background: "#0d1027",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 16,
    padding: 18,
  },
  itemCardActive: {
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
  toolsBox: {
    borderRadius: 18,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.03)",
    padding: 18,
    display: "grid",
    gap: 14,
  },
  toolsHeader: {
    display: "grid",
    gap: 4,
  },
  toolsTitle: {
    margin: 0,
    fontSize: 18,
    fontWeight: 800,
  },
  toolsSubtitle: {
    margin: 0,
    color: "#9ea8d8",
  },
  urlBox: {
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "#0b0e22",
    padding: 14,
  },
  urlLabel: {
    fontSize: 12,
    textTransform: "uppercase",
    color: "#92a0d8",
    marginBottom: 8,
  },
  urlValue: {
    color: "#e5e9ff",
    wordBreak: "break-word",
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