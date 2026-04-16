import { Controller, Get, Param, Query, Res } from "@nestjs/common";
import type { Response } from "express";
import { QrService } from "../common/qr/qr.service";
import { NfcTagsService } from "./nfc-tags.service";

@Controller("/api/nfc-tags")
export class NfcTagsQrController {
  constructor(
    private readonly nfcTagsService: NfcTagsService,
    private readonly qrService: QrService,
  ) {}

  @Get(":id/qr")
  async getQr(
    @Param("id") id: string,
    @Query("format") format: "png" | "svg" | "data-url" | undefined,
    @Res() res: Response,
  ) {
    const tag = await this.nfcTagsService.findById(id);
    const publicUrl = this.nfcTagsService.getPublicUrl(tag);

    const qr = await this.qrService.generate(publicUrl, {
      format: format === "svg" ? "svg" : "png",
      size: 900,
      margin: 2,
    });

    if (qr.extension === "svg") {
      res.setHeader("Content-Type", qr.contentType || "image/svg+xml");
      res.setHeader(
        "Content-Disposition",
        `inline; filename="nfc-tag-${tag.uid || tag.id}.svg"`,
      );
      return res.send(qr.payload);
    }

    res.setHeader("Content-Type", qr.contentType || "image/png");
    res.setHeader(
      "Content-Disposition",
      `inline; filename="nfc-tag-${tag.uid || tag.id}.png"`,
    );
    return res.send(qr.payload);
  }

  @Get(":id/qr/meta")
  async getQrMeta(@Param("id") id: string) {
    const tag = await this.nfcTagsService.findById(id);
    const publicUrl = this.nfcTagsService.getPublicUrl(tag);

    return {
      id: tag.id,
      uid: tag.uid,
      name: tag.label ?? tag.uid,
      qrValue: publicUrl,
      previewPngUrl: `/api/nfc-tags/${tag.id}/qr`,
      downloadPngUrl: `/api/nfc-tags/${tag.id}/qr`,
      downloadSvgUrl: `/api/nfc-tags/${tag.id}/qr?format=svg`,
    };
  }
}