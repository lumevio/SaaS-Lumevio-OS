import { Body, Controller, Post, Res } from "@nestjs/common";
import type { Response } from "express";
import { QrService } from "../common/qr/qr.service";
import { NfcTagsService } from "./nfc-tags.service";

type PrintAssetType = "sticker" | "shelf_talker" | "pos_card";

type RequestBody = {
  ids: string[];
  assetType?: PrintAssetType;
  margin?: number;
};

@Controller("/api/nfc-tags")
export class NfcTagsPrintAssetsController {
  constructor(
    private readonly nfcTagsService: NfcTagsService,
    private readonly qrService: QrService,
  ) {}

  @Post("print-assets")
  async buildPrintAssets(@Body() body: RequestBody, @Res() res: Response) {
    const ids = Array.isArray(body.ids) ? body.ids : [];
    const assetType = body.assetType ?? "sticker";
    const margin = body.margin ?? 2;

    const cards: string[] = [];

    for (const id of ids) {
      const tag = await this.nfcTagsService.findById(id);
      const qrValue = this.nfcTagsService.getPublicUrl(tag);

      const qr = await this.qrService.generate(qrValue, {
        format: "data-url",
        size: 700,
        margin,
      });

      const dataUrl = String(qr.payload ?? "");

      cards.push(`
        <div style="border:1px solid #ddd;border-radius:16px;padding:20px;margin:12px;display:inline-block;width:320px;vertical-align:top;font-family:Arial,sans-serif;">
          <div style="font-size:12px;color:#666;margin-bottom:8px;text-transform:uppercase;">${assetType}</div>
          <div style="font-size:20px;font-weight:700;margin-bottom:8px;">${tag.label ?? tag.uid}</div>
          <div style="font-size:13px;color:#444;margin-bottom:12px;">UID: ${tag.uid}</div>
          <img src="${dataUrl}" alt="QR ${tag.uid}" style="width:220px;height:220px;display:block;margin:0 auto 14px auto;" />
          <div style="font-size:12px;word-break:break-word;color:#222;">${qrValue}</div>
        </div>
      `);
    }

    const html = `
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>NFC Tags Print Assets</title>
        </head>
        <body style="margin:24px;background:#fff;">
          ${cards.join("")}
        </body>
      </html>
    `;

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.send(html);
  }
}