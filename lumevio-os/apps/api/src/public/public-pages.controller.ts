import { Controller, Get, Param, Query, Req, Res } from "@nestjs/common";
import type { Request, Response } from "express";
import { PrismaService } from "../prisma/prisma.service";
import { EventsService } from "../events/events.service";

@Controller("public/page")
export class PublicPagesController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventsService: EventsService
  ) {}

  private appendTrackingParams(
    destinationUrl: string,
    extra: Record<string, string | undefined>
  ) {
    const url = new URL(destinationUrl);

    Object.entries(extra).forEach(([key, value]) => {
      if (!value) return;
      url.searchParams.set(key, value);
    });

    return url.toString();
  }

  @Get(":slug")
  async openPage(
    @Param("slug") slug: string,
    @Req() req: Request,
    @Res() res: Response,
    @Query("session_id") sessionIdFromQuery?: string
  ) {
    const page = await this.prisma.campaignPage.findUnique({
      where: { slug },
      select: {
        id: true,
        slug: true,
        status: true,
        pageMode: true,
        externalUrl: true,
        organizationId: true,
        campaignId: true,
      },
    });

    if (!page || page.status !== "published") {
      return res.status(404).send("Page not found");
    }

    const sessionId =
      sessionIdFromQuery ||
      `sess_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;

    if (page.pageMode === "external_redirect" && page.externalUrl) {
      const destinationUrl = this.appendTrackingParams(page.externalUrl, {
        utm_source: "lumevio",
        utm_medium: "campaign_page",
        utm_campaign: page.slug,
        lumevio_slug: page.slug,
        session_id: sessionId,
      });

      await this.eventsService.track({
        type: "redirect_open",
        organizationId: page.organizationId,
        campaignId: page.campaignId,
        sessionId,
        payload: {
          slug: page.slug,
          target: page.externalUrl,
          finalDestinationUrl: destinationUrl,
          source: "campaign_page_redirect",
          userAgent: req.headers["user-agent"] || "",
          referer: req.headers.referer || "",
          ip:
            (req.headers["x-forwarded-for"] as string) ||
            req.socket.remoteAddress ||
            "",
        },
      });

      return res.redirect(destinationUrl);
    }

    const hostedUrl = new URL(`http://localhost:3002/${page.slug}`);
    hostedUrl.searchParams.set("session_id", sessionId);

    return res.redirect(hostedUrl.toString());
  }
}