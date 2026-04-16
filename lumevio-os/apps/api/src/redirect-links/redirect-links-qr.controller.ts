import { Controller, Get, Param, Res } from "@nestjs/common";
import type { Response } from "express";
import { QrService } from "../common/qr/qr.service";
import { RedirectLinksService } from "./redirect-links.service";

@Controller("/api/redirect-links")
export class RedirectLinksQrController {
  constructor(
    private readonly redirectLinksService: RedirectLinksService,
    private readonly qrService: QrService,
  ) {}

  @Get(":id/qr")
  async getQr(@Param("id") id: string, @Res() res: Response) {
    const link = await this.redirectLinksService.findById(id);
    const publicUrl = this.redirectLinksService.getPublicUrl(link);

    const generated = await this.qrService.generate(publicUrl, {
      format: "png",
      size: 900,
      margin: 2,
    });

    res.setHeader("Content-Type", generated.contentType || "image/png");
    res.setHeader(
      "Content-Disposition",
      `inline; filename="redirect-link-${link.slug || link.id}.${generated.extension || "png"}"`,
    );

    res.send(generated.payload);
  }

  @Get(":id/qr/meta")
  async getQrMeta(@Param("id") id: string) {
    const link = await this.redirectLinksService.findById(id);
    const publicUrl = this.redirectLinksService.getPublicUrl(link);

    return {
      id: link.id,
      slug: link.slug,
      name: link.title ?? link.slug,
      qrValue: publicUrl,
      previewPngUrl: `/api/redirect-links/${link.id}/qr`,
      downloadPngUrl: `/api/redirect-links/${link.id}/qr`,
      downloadSvgUrl: `/api/redirect-links/${link.id}/qr?format=svg`,
    };
  }
}