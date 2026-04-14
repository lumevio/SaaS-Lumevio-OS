import { Controller, Get, NotFoundException, Param, Req, Res } from "@nestjs/common";
import type { Request, Response } from "express";
import { RedirectLinksService } from "../redirect-links/redirect-links.service";
import { EventsService } from "../events/events.service";

@Controller("r")
export class PublicController {
  constructor(
    private readonly redirectLinksService: RedirectLinksService,
    private readonly eventsService: EventsService
  ) {}

  @Get(":slug")
  async redirect(
    @Param("slug") slug: string,
    @Req() req: Request,
    @Res() res: Response
  ) {
    const link = await this.redirectLinksService.resolveBySlug(slug);

    if (!link || !link.isActive) {
      throw new NotFoundException("Link nie istnieje");
    }

    await this.eventsService.trackRedirectOpen({
      redirectLinkId: link.id,
      organizationId: link.organizationId,
      campaignId: link.campaignId,
      payload: {
        ip:
          req.headers["x-forwarded-for"] ||
          req.socket.remoteAddress ||
          null,
        userAgent: req.headers["user-agent"] || null,
        referer: req.headers["referer"] || null,
      },
    });

    return res.redirect(link.destinationUrl);
  }
}