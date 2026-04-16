import { Body, Controller, NotFoundException, Post, Res } from "@nestjs/common";
import type { Response } from "express";
import { NfcTagsService } from "./nfc-tags.service";
import { QrService } from "../common/qr/qr.service";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const PDFDocument = require("pdfkit");

type NfcTagRecord = {
  id: string;
  uid?: string | null;
  label?: string | null;
  serialNumber?: string | null;
  redirectLink?: {
    slug?: string | null;
    title?: string | null;
  } | null;
  organization?: {
    name?: string | null;
  } | null;
  store?: {
    name?: string | null;
  } | null;
  campaign?: {
    name?: string | null;
  } | null;
};

type PdfAssetType = "sticker" | "shelf_talker" | "pos_card";

type PdfAssetsBody = {
  ids: string[];
  assetType?: PdfAssetType;
  margin?: number;
};

@Controller("nfc-tags")
export class NfcTagsPdfAssetsController {
  constructor(
    private readonly nfcTagsService: NfcTagsService,
    private readonly qrService: QrService,
  ) {}

  @Post("export/pdf-assets")
  async exportPdfAssets(@Body() body: PdfAssetsBody, @Res() res: Response) {
    const ids = Array.isArray(body?.ids) ? body.ids.filter(Boolean) : [];
    const assetType = this.normalizeAssetType(body?.assetType);
    const qrMargin = Number.isFinite(body?.margin) ? Number(body.margin) : 2;

    if (ids.length === 0) {
      throw new NotFoundException("No NFC tag IDs provided");
    }

    const items: Array<{
      id: string;
      title: string;
      uid: string;
      qrValue: string;
      qrBuffer: Buffer;
      redirectSlug: string;
      organization: string;
      store: string;
      campaign: string;
    }> = [];

    for (const id of ids.slice(0, 50)) {
      const tag = (await this.nfcTagsService.findById(id)) as NfcTagRecord | null;
      if (!tag) continue;

      const qrValue = this.buildTapUrl(tag);
      const qr = await this.qrService.generate(qrValue, {
        format: "png",
        size: 900,
        margin: qrMargin,
      });

      items.push({
        id: tag.id,
        title: tag.label || tag.uid || tag.id,
        uid: tag.uid || "-",
        qrValue,
        qrBuffer: qr.payload,
        redirectSlug: tag.redirectLink?.slug || "-",
        organization: tag.organization?.name || "-",
        store: tag.store?.name || "-",
        campaign: tag.campaign?.name || "-",
      });
    }

    const doc = new PDFDocument({
      size: "A4",
      margin: 36,
      info: {
        Title: `LUMEVIO NFC Tags ${assetType} PDF`,
        Author: "LUMEVIO",
        Subject: "NFC Tags PDF Assets",
      },
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="nfc-tags-${assetType}.pdf"`,
    );

    doc.pipe(res);

    this.drawHeader(doc, "LUMEVIO NFC Tags", `PDF Asset Builder - ${assetType}`);

    if (assetType === "shelf_talker") {
      this.drawNfcShelfTalker(doc, items);
    } else if (assetType === "pos_card") {
      this.drawNfcPosCards(doc, items);
    } else {
      this.drawNfcStickers(doc, items);
    }

    doc.end();
  }

  private normalizeAssetType(assetType?: string): PdfAssetType {
    if (assetType === "shelf_talker") return "shelf_talker";
    if (assetType === "pos_card") return "pos_card";
    return "sticker";
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

  private drawHeader(doc: typeof PDFDocument.prototype, title: string, subtitle: string) {
    doc.font("Helvetica-Bold").fontSize(21).fillColor("#111827").text(title, 36, 30);
    doc.font("Helvetica").fontSize(10).fillColor("#6B7280").text(subtitle, 36, 56);
    doc.moveTo(36, 74).lineTo(559, 74).strokeColor("#E5E7EB").lineWidth(1).stroke();
  }

  private drawNfcStickers(
    doc: typeof PDFDocument.prototype,
    items: Array<{
      title: string;
      uid: string;
      qrBuffer: Buffer;
    }>,
  ) {
    const startY = 96;
    const cols = 3;
    const cardW = 160;
    const cardH = 200;
    const gapX = 18;
    const gapY = 18;
    const left = 46;

    items.forEach((item, index) => {
      const row = Math.floor(index / cols);
      const col = index % cols;
      let x = left + col * (cardW + gapX);
      let y = startY + row * (cardH + gapY);

      if (y + cardH > 790) {
        doc.addPage();
        this.drawHeader(doc, "LUMEVIO NFC Tags", "PDF Asset Builder - sticker");
        const newIndex = index - row * cols;
        const newRow = Math.floor(newIndex / cols);
        const newCol = newIndex % cols;
        x = left + newCol * (cardW + gapX);
        y = startY + newRow * (cardH + gapY);
      }

      doc.roundedRect(x, y, cardW, cardH, 14).fillAndStroke("#FFFFFF", "#D1D5DB");

      doc.font("Helvetica-Bold").fontSize(9).fillColor("#4F46E5").text("LUMEVIO NFC", x, y + 12, {
        width: cardW,
        align: "center",
      });

      doc.roundedRect(x + 18, y + 30, 124, 124, 10).fillAndStroke("#FFFFFF", "#E5E7EB");
      doc.image(item.qrBuffer, x + 24, y + 36, { fit: [112, 112] });

      doc.font("Helvetica-Bold").fontSize(11).fillColor("#111827").text(item.title, x + 10, y + 160, {
        width: cardW - 20,
        align: "center",
      });

      doc.font("Helvetica").fontSize(8).fillColor("#6B7280").text(item.uid, x + 10, y + 180, {
        width: cardW - 20,
        align: "center",
      });
    });
  }

  private drawNfcShelfTalker(
    doc: typeof PDFDocument.prototype,
    items: Array<{
      title: string;
      uid: string;
      qrBuffer: Buffer;
      redirectSlug: string;
      store: string;
      campaign: string;
    }>,
  ) {
    let y = 96;

    items.forEach((item) => {
      if (y + 180 > 790) {
        doc.addPage();
        this.drawHeader(doc, "LUMEVIO NFC Tags", "PDF Asset Builder - shelf_talker");
        y = 96;
      }

      const x = 40;
      const w = 515;
      const h = 160;

      doc.roundedRect(x, y, w, h, 16).fillAndStroke("#FFFFFF", "#D1D5DB");

      doc.font("Helvetica-Bold").fontSize(9).fillColor("#4F46E5").text("NFC ACTIVATION", x + 20, y + 18);
      doc.font("Helvetica-Bold").fontSize(20).fillColor("#111827").text(item.title, x + 20, y + 34, {
        width: 300,
      });
      doc.font("Helvetica").fontSize(11).fillColor("#374151").text(
        "Zeskanuj lub zbliz telefon, aby otworzyc aktywacje tagu.",
        x + 20,
        y + 64,
        { width: 290 },
      );

      doc.font("Helvetica").fontSize(9).fillColor("#4B5563")
        .text(`UID: ${item.uid}`, x + 20, y + 98)
        .text(`Redirect: ${item.redirectSlug}`, x + 20, y + 112)
        .text(`Store: ${item.store}`, x + 20, y + 126)
        .text(`Campaign: ${item.campaign}`, x + 20, y + 140);

      doc.roundedRect(x + 372, y + 20, 120, 120, 10).fillAndStroke("#FFFFFF", "#E5E7EB");
      doc.image(item.qrBuffer, x + 380, y + 28, { fit: [104, 104] });

      y += h + 16;
    });
  }

  private drawNfcPosCards(
    doc: typeof PDFDocument.prototype,
    items: Array<{
      title: string;
      uid: string;
      qrBuffer: Buffer;
      organization: string;
      store: string;
      campaign: string;
    }>,
  ) {
    const startY = 96;
    const cols = 2;
    const cardW = 248;
    const cardH = 280;
    const gapX = 18;
    const gapY = 18;
    const left = 40;

    items.forEach((item, index) => {
      const row = Math.floor(index / cols);
      const col = index % cols;
      let x = left + col * (cardW + gapX);
      let y = startY + row * (cardH + gapY);

      if (y + cardH > 790) {
        doc.addPage();
        this.drawHeader(doc, "LUMEVIO NFC Tags", "PDF Asset Builder - pos_card");
        const newIndex = index - row * cols;
        const newRow = Math.floor(newIndex / cols);
        const newCol = newIndex % cols;
        x = left + newCol * (cardW + gapX);
        y = startY + newRow * (cardH + gapY);
      }

      doc.roundedRect(x, y, cardW, cardH, 16).fillAndStroke("#F8FAFC", "#D1D5DB");

      doc.font("Helvetica-Bold").fontSize(10).fillColor("#4F46E5").text("LUMEVIO NFC", x + 16, y + 16);
      doc.font("Helvetica-Bold").fontSize(10).fillColor("#111827").text("SCAN / TAP", x + cardW - 82, y + 16);

      doc.font("Helvetica-Bold").fontSize(18).fillColor("#111827").text(item.title, x + 16, y + 38, {
        width: cardW - 32,
      });

      doc.roundedRect(x + 36, y + 88, 176, 176, 12).fillAndStroke("#FFFFFF", "#E5E7EB");
      doc.image(item.qrBuffer, x + 48, y + 100, { fit: [152, 152] });

      doc.font("Helvetica-Bold").fontSize(11).fillColor("#111827").text(
        "Aktywuj doswiadczenie cyfrowe",
        x + 16,
        y + 236,
        { width: cardW - 32, align: "center" },
      );

      doc.font("Helvetica").fontSize(9).fillColor("#6B7280").text(
        `${item.organization} - ${item.store} - ${item.campaign}`,
        x + 16,
        y + 254,
        { width: cardW - 32, align: "center" },
      );

      doc.font("Helvetica").fontSize(8).fillColor("#6B7280").text(
        `UID: ${item.uid}`,
        x + 16,
        y + 268,
        { width: cardW - 32, align: "center" },
      );
    });
  }
}