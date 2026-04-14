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
import { RedirectLinksService } from "./redirect-links.service";
import { QrService, type QrOutputFormat } from "../common/qr/qr.service";

type RedirectLinkRecord = {
  id: string;
  slug?: string | null;
  destinationUrl?: string | null;
  fallbackUrl?: string | null;
  title?: string | null;
};

@Controller("redirect-links")
export class RedirectLinksQrController {
  constructor(
    private readonly redirectLinksService: RedirectLinksService,
    private readonly qrService: QrService,
  ) {}

  @Get(":id/qr")
  async getRedirectLinkQr(
    @Param("id") id: string,
    @Query("format") format: QrOutputFormat = "png",
    @Query("size", new ParseIntPipe({ optional: true })) size = 768,
    @Query("margin", new ParseIntPipe({ optional: true })) margin = 2,
    @Query("download") download = "0",
    @Res() res: Response,
  ) {
    const redirectLink =
      (await this.redirectLinksService.findById(id)) as RedirectLinkRecord | null;

    if (!redirectLink) {
      throw new NotFoundException("Redirect link not found");
    }

    const qrValue = this.buildRedirectUrl(redirectLink);
    const result = await this.qrService.generate(qrValue, { format, size, margin });

    const filenameBase =
      this.safeFileName(redirectLink.slug) ||
      this.safeFileName(redirectLink.title) ||
      `redirect-link-${redirectLink.id}`;

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
  async getRedirectLinkQrMeta(@Param("id") id: string) {
    const redirectLink =
      (await this.redirectLinksService.findById(id)) as RedirectLinkRecord | null;

    if (!redirectLink) {
      throw new NotFoundException("Redirect link not found");
    }

    const qrValue = this.buildRedirectUrl(redirectLink);

    return {
      id: redirectLink.id,
      slug: redirectLink.slug ?? null,
      name: redirectLink.title ?? null,
      qrValue,
      previewPngUrl: `/redirect-links/${redirectLink.id}/qr?format=png&size=512`,
      downloadPngUrl: `/redirect-links/${redirectLink.id}/qr?format=png&size=1024&download=1`,
      downloadSvgUrl: `/redirect-links/${redirectLink.id}/qr?format=svg&size=1024&download=1`,
    };
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