import {
  Body,
  Controller,
  NotFoundException,
  Post,
  Res,
} from "@nestjs/common";
import type { Response } from "express";
import JSZip from "jszip";
import { RedirectLinksService } from "./redirect-links.service";
import { QrService } from "../common/qr/qr.service";

type RedirectLinkRecord = {
  id: string;
  slug?: string | null;
  destinationUrl?: string | null;
  fallbackUrl?: string | null;
  title?: string | null;
};

type BatchExportBody = {
  ids: string[];
  format?: "png" | "svg";
  size?: number;
  margin?: number;
};

@Controller("redirect-links")
export class RedirectLinksExportController {
  constructor(
    private readonly redirectLinksService: RedirectLinksService,
    private readonly qrService: QrService,
  ) {}

  @Post("export/qr-zip")
  async exportQrZip(@Body() body: BatchExportBody, @Res() res: Response) {
    const ids = Array.isArray(body?.ids) ? body.ids.filter(Boolean) : [];
    const format = body?.format === "svg" ? "svg" : "png";
    const size = Number.isFinite(body?.size) ? Number(body.size) : 1024;
    const margin = Number.isFinite(body?.margin) ? Number(body.margin) : 2;

    if (ids.length === 0) {
      throw new NotFoundException("No redirect link IDs provided");
    }

    const zip = new JSZip();
    const manifest: Array<{
      id: string;
      slug: string | null;
      title: string | null;
      qrValue: string;
      fileName: string;
    }> = [];

    for (const id of ids) {
      const link =
        (await this.redirectLinksService.findById(id)) as RedirectLinkRecord | null;

      if (!link) {
        continue;
      }

      const qrValue = this.buildRedirectUrl(link);
      const generated = await this.qrService.generate(qrValue, {
        format,
        size,
        margin,
      });

      const fileBase =
        this.safeFileName(link.slug) ||
        this.safeFileName(link.title) ||
        `redirect-link-${link.id}`;

      const fileName = `${fileBase}.${generated.extension}`;
      zip.file(fileName, generated.payload);

      manifest.push({
        id: link.id,
        slug: link.slug ?? null,
        title: link.title ?? null,
        qrValue,
        fileName,
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
    res.setHeader("Content-Disposition", 'attachment; filename="redirect-links-qr-export.zip"');
    res.send(content);
  }

  @Post("export/print-sheet")
  async exportPrintSheet(@Body() body: BatchExportBody, @Res() res: Response) {
    const ids = Array.isArray(body?.ids) ? body.ids.filter(Boolean) : [];
    const size = 512;
    const margin = Number.isFinite(body?.margin) ? Number(body.margin) : 2;

    if (ids.length === 0) {
      throw new NotFoundException("No redirect link IDs provided");
    }

    const rows: Array<{
      title: string;
      slug: string;
      qrValue: string;
      dataUrl: string;
    }> = [];

    for (const id of ids.slice(0, 24)) {
      const link =
        (await this.redirectLinksService.findById(id)) as RedirectLinkRecord | null;

      if (!link) {
        continue;
      }

      const qrValue = this.buildRedirectUrl(link);
      const dataUrlResult = await this.qrService.generate(qrValue, {
        format: "data-url",
        size,
        margin,
      });

      rows.push({
        title: link.title || link.slug || link.id,
        slug: link.slug || link.id,
        qrValue,
        dataUrl: dataUrlResult.payload.toString("utf-8"),
      });
    }

    const html = this.buildPrintHtml(rows);

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.send(html);
  }

  private buildRedirectUrl(link: RedirectLinkRecord) {
    const publicBaseUrl =
      process.env.PUBLIC_GO_BASE_URL?.trim() ||
      process.env.PUBLIC_APP_BASE_URL?.trim() ||
      "http://localhost:3001";

    if (link.slug) {
      return `${publicBaseUrl.replace(/\/+$/, "")}/r/${encodeURIComponent(link.slug)}`;
    }

    return link.destinationUrl || `${publicBaseUrl.replace(/\/+$/, "")}/r/${link.id}`;
  }

  private buildReadme(
    manifest: Array<{
      id: string;
      slug: string | null;
      title: string | null;
      qrValue: string;
      fileName: string;
    }>,
  ) {
    return [
      "LUMEVIO Redirect Links QR Export",
      "",
      `Items: ${manifest.length}`,
      "",
      ...manifest.map(
        (item, index) =>
          `${index + 1}. ${item.title || item.slug || item.id}\n   URL: ${item.qrValue}\n   File: ${item.fileName}`,
      ),
      "",
    ].join("\n");
  }

  private buildPrintHtml(
    rows: Array<{
      title: string;
      slug: string;
      qrValue: string;
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
            <div class="slug">/${this.escapeHtml(row.slug)}</div>
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
          <title>LUMEVIO Redirect Links Print Sheet</title>
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
              gap: 3mm;
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
            .slug {
              font-size: 11px;
              color: #4f46e5;
              word-break: break-word;
            }
            .url {
              font-size: 9px;
              color: #6b7280;
              word-break: break-word;
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
              <div class="brand">LUMEVIO — Redirect Links QR Print Sheet</div>
              <div class="sub">Arkusz do druku A4 dla kampanii, POS i wdrożeń retail.</div>
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