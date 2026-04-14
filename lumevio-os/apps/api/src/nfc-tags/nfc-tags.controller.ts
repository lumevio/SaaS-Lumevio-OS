import {
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Query,
  Res,
} from "@nestjs/common";
import type { Response } from "express";
import { NfcTagsService } from "./nfc-tags.service";
import { QrService, type QrOutputFormat } from "../common/qr/qr.service";

type NfcTagRecord = {
  id: string;
  uid?: string | null;
  serialNumber?: string | null;
  label?: string | null;
  redirectLink?: {
    slug?: string | null;
  } | null;
};

@Controller("nfc-tags")
export class NfcTagsQrController {
  constructor(
    private readonly nfcTagsService: NfcTagsService,
    private readonly qrService: QrService,
  ) {}

  @Get(":id/qr")
  async getNfcTagQr(
    @Param("id") id: string,
    @Query("format") format: QrOutputFormat = "png",
    @Query("size", new ParseIntPipe({ optional: true })) size = 768,
    @Query("margin", new ParseIntPipe({ optional: true })) margin = 2,
    @Query("download") download = "0",
    @Res() res: Response,
  ) {
    const nfcTag = (await this.nfcTagsService.findById(id)) as NfcTagRecord | null;

    if (!nfcTag) {
      throw new NotFoundException("NFC tag not found");
    }

    const qrValue = this.buildTapUrl(nfcTag);
    const result = await this.qrService.generate(qrValue, { format, size, margin });

    const filenameBase =
      this.safeFileName(nfcTag.uid) ||
      this.safeFileName(nfcTag.serialNumber) ||
      this.safeFileName(nfcTag.label) ||
      `nfc-tag-${nfcTag.id}`;

    if (download === "1") {
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${filenameBase}.${result.extension}"`,
      );
    }

    res.setHeader("Content-Type", result.contentType);
    res.send(result.payload);
  }

  @Get(":id/qr/meta")
  async getNfcTagQrMeta(@Param("id") id: string) {
    const nfcTag = (await this.nfcTagsService.findById(id)) as NfcTagRecord | null;

    if (!nfcTag) {
      throw new NotFoundException("NFC tag not found");
    }

    const qrValue = this.buildTapUrl(nfcTag);

    return {
      id: nfcTag.id,
      uid: nfcTag.uid ?? null,
      slug: null,
      name: nfcTag.label ?? null,
      qrValue,
      previewPngUrl: `/nfc-tags/${nfcTag.id}/qr?format=png&size=512`,
      downloadPngUrl: `/nfc-tags/${nfcTag.id}/qr?format=png&size=1024&download=1`,
      downloadSvgUrl: `/nfc-tags/${nfcTag.id}/qr?format=svg&size=1024&download=1`,
    };
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

  private safeFileName(value?: string | null) {
    if (!value) return "";
    return value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-_]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
  }
}