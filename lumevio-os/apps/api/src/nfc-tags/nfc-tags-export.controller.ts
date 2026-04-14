import {
  Body,
  Controller,
  NotFoundException,
  Post,
  Res,
} from "@nestjs/common";
import type { Response } from "express";
import JSZip from "jszip";
import { NfcTagsService } from "./nfc-tags.service";
import { QrService } from "../common/qr/qr.service";

type NfcTagRecord = {
  id: string;
  uid?: string | null;
  serialNumber?: string | null;
  label?: string | null;
  tagType?: string | null;
  status?: string | null;
  redirectLink?: {
    id?: string | null;
    slug?: string | null;
    title?: string | null;
  } | null;
  organization?: {
    id?: string | null;
    name?: string | null;
  } | null;
  store?: {
    id?: string | null;
    name?: string | null;
  } | null;
  campaign?: {
    id?: string | null;
    name?: string | null;
    slug?: string | null;
  } | null;
};

type BatchExportBody = {
  ids: string[];
  format?: "png" | "svg";
  size?: number;
  margin?: number;
};

@Controller("nfc-tags")
export class NfcTagsExportController {
  constructor(
    private readonly nfcTagsService: NfcTagsService,
    private readonly qrService: QrService,
  ) {}

  @Post("export/qr-zip")
  async exportQrZip(@Body() body: BatchExportBody, @Res() res: Response) {
    const ids = Array.isArray(body?.ids) ? body.ids.filter(Boolean) : [];
    const format = body?.format === "svg" ? "svg" : "png";
    const size = Number.isFinite(body?.size) ? Number(body.size) : 1024;
    const margin = Number.isFinite(body?.margin) ? Number(body.margin) : 2;

    if (ids.length === 0) {
      throw new NotFoundException("No NFC tag IDs provided");
    }

    const zip = new JSZip();
    const manifest: Array<{
      id: string;
      uid: string | null;
      label: string | null;
      qrValue: string;
      fileName: string;
      redirectSlug: string | null;
      organization: string | null;
      store: string | null;
      campaign: string | null;
    }> = [];

    for (const id of ids) {
      const tag = (await this.nfcTagsService.findById(id)) as NfcTagRecord | null;

      if (!tag) {
        continue;
      }

      const qrValue = this.buildTapUrl(tag);
      const generated = await this.qrService.generate(qrValue, {
        format,
        size,
        margin,
      });

      const fileBase =
        this.safeFileName(tag.label) ||
        this.safeFileName(tag.uid) ||
        this.safeFileName(tag.serialNumber) ||
        `nfc-tag-${tag.id}`;

      const fileName = `${fileBase}.${generated.extension}`;
      zip.file(fileName, generated.payload);

      manifest.push({
        id: tag.id,
        uid: tag.uid ?? null,
        label: tag.label ?? null,
        qrValue,
        fileName,
        redirectSlug: tag.redirectLink?.slug ?? null,
        organization: tag.organization?.name ?? null,
        store: tag.store?.name ?? null,
        campaign: tag.campaign?.name ?? null,
      });
    }

    zip.file("manifest.json", JSON.stringify(manifest, null, 2), {
      binary: false,
    });

    zip.file("README.txt", this.buildReadme(manifest), {
      binary: false,
    });

    const content = await zip.generateAsync({ type: "nodebuffer" });

    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Disposition", 'attachment; filename="nfc-tags-qr-export.zip"');
    res.send(content);
  }

  @Post("export/print-sheet")
  async exportPrintSheet(@Body() body: BatchExportBody, @Res() res: Response) {
    const ids = Array.isArray(body?.ids) ? body.ids.filter(Boolean) : [];
    const size = 512;
    const margin = Number.isFinite(body?.margin) ? Number(body.margin) : 2;

    if (ids.length === 0) {
      throw new NotFoundException("No NFC tag IDs provided");
    }

    const rows: Array<{
      title: string;
      uid: string;
      qrValue: string;
      redirectSlug: string;
      organization: string;
      store: string;
      campaign: string;
      dataUrl: string;
    }> = [];

    for (const id of ids.slice(0, 24)) {
      const tag = (await this.nfcTagsService.findById(id)) as NfcTagRecord | null;

      if (!tag) {
        continue;
      }

      const qrValue = this.buildTapUrl(tag);
      const dataUrlResult = await this.qrService.generate(qrValue, {
        format: "data-url",
        size,
        margin,
      });

      rows.push({
        title: tag.label || tag.uid || tag.id,
        uid: tag.uid || "—",
        qrValue,
        redirectSlug: tag.redirectLink?.slug || "—",
        organization: tag.organization?.name || "—",
        store: tag.store?.name || "—",
        campaign: tag.campaign?.name || "—",
        dataUrl: dataUrlResult.payload.toString("utf-8"),
      });
    }

    const html = this.buildPrintHtml(rows);

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.send(html);
  }

  private buildTapUrl(tag: NfcTagRecord) {
    const publicBaseUrl =
      process.env.PUBLIC_GO_BASE_URL?.trim() ||
      process.env.PUBLIC_APP_BASE_URL?.trim() ||
      "http://localhost:3001";

    if (tag.redirectLink?.slug) {
      return `${publicBaseUrl.replace(/\/+$/, "")}/r/${encodeURIComponent(
        tag.redirectLink.slug,
      )}?nfc_tag_id=${encodeURIComponent(tag.id)}`;
    }

    return `${publicBaseUrl.replace(/\/+$/, "")}/tap/${encodeURIComponent(tag.id)}`;
  }

  private buildReadme(
    manifest: Array<{
      id: string;
      uid: string | null;
      label: string | null;
      qrValue: string;
      fileName: string;
      redirectSlug: string | null;
      organization: string | null;
      store: string | null;
      campaign: string | null;
    }>,
  ) {
    return [
      "LUMEVIO NFC Tags QR Export",
      "",
      `Items: ${manifest.length}`,
      "",
      ...manifest.map(
        (item, index) =>
          `${index + 1}. ${item.label || item.uid || item.id}\n` +
          `   UID: ${item.uid || "—"}\n` +
          `   Redirect: ${item.redirectSlug || "—"}\n` +
          `   Organization: ${item.organization || "—"}\n` +
          `   Store: ${item.store || "—"}\n` +
          `   Campaign: ${item.campaign || "—"}\n` +
          `   URL: ${item.qrValue}\n` +
          `   File: ${item.fileName}`,
      ),
      "",
    ].join("\n");
  }

  private buildPrintHtml(
    rows: Array<{
      title: string;
      uid: string;
      qrValue: string;
      redirectSlug: string;
      organization: string;
      store: string;
      campaign: string;
      dataUrl: string;
    }>,
  ) {
    const cards = rows
      .map(
        (row) => `
          <div class="card">
            <div class="qr-wrap">
              <img src="${row.dataUrl}" alt="${this.escapeHtml(row.title)}" />
            </div>
            <div class="title">${this.escapeHtml(row.title)}</div>
            <div class="meta">UID: ${this.escapeHtml(row.uid)}</div>
            <div class="meta">Redirect: ${this.escapeHtml(row.redirectSlug)}</div>
            <div class="meta">Org: ${this.escapeHtml(row.organization)}</div>
            <div class="meta">Store: ${this.escapeHtml(row.store)}</div>
            <div class="meta">Campaign: ${this.escapeHtml(row.campaign)}</div>
            <div class="url">${this.escapeHtml(row.qrValue)}</div>
          </div>
        `,
      )
      .join("");

    return `
      <!doctype html>
      <html lang="pl">
        <head>
          <meta charset="utf-8" />
          <title>LUMEVIO NFC Tags Print Sheet</title>
          <style>
            * { box-sizing: border-box; }
            body {
              margin: 0;
              font-family: Arial, sans-serif;
              background: #f3f4f6;
              color: #111827;
            }
            .page {
              width: 210mm;
              min-height: 297mm;
              margin: 0 auto;
              background: #ffffff;
              padding: 12mm;
            }
            .header {
              margin-bottom: 10mm;
            }
            .brand {
              font-size: 20px;
              font-weight: 800;
              margin-bottom: 4px;
            }
            .sub {
              font-size: 12px;
              color: #4b5563;
            }
            .grid {
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 8mm;
            }
            .card {
              border: 1px solid #d1d5db;
              border-radius: 4mm;
              padding: 4mm;
              display: grid;
              gap: 2mm;
              break-inside: avoid;
            }
            .qr-wrap {
              aspect-ratio: 1 / 1;
              border: 1px solid #e5e7eb;
              border-radius: 3mm;
              padding: 3mm;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            .qr-wrap img {
              width: 100%;
              height: auto;
              display: block;
            }
            .title {
              font-size: 12px;
              font-weight: 700;
              word-break: break-word;
            }
            .meta {
              font-size: 9px;
              color: #374151;
              word-break: break-word;
            }
            .url {
              font-size: 8px;
              color: #6b7280;
              word-break: break-word;
              margin-top: 2px;
            }
            @media print {
              body { background: #fff; }
              .page {
                width: auto;
                min-height: auto;
                margin: 0;
                padding: 0;
              }
            }
          </style>
        </head>
        <body>
          <div class="page">
            <div class="header">
              <div class="brand">LUMEVIO — NFC Tags QR Print Sheet</div>
              <div class="sub">Arkusz A4 do wdrożeń, etykietowania, testów i operacji retail.</div>
            </div>
            <div class="grid">
              ${cards}
            </div>
          </div>
        </body>
      </html>
    `;
  }

  private safeFileName(value?: string | null) {
    if (!value) return "";
    return value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-_]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
  }

  private escapeHtml(value: string) {
    return value
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }
}