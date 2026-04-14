import { Body, Controller, Get, Param, Post, Query, Req } from "@nestjs/common";
import { Public } from "../auth/public.decorator";
import { EventsService } from "./events.service";

@Controller("events")
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Get()
  findAll(@Req() req: any) {
    return this.eventsService.findAll(req.user);
  }

  @Get("summary")
  getSummary(
    @Req() req: any,
    @Query("campaignId") campaignId?: string,
    @Query("organizationId") organizationId?: string
  ) {
    return this.eventsService.getSummary(req.user, {
      campaignId,
      organizationId,
    });
  }

  @Get("summary/campaign/:campaignId")
  getCampaignSummary(@Req() req: any, @Param("campaignId") campaignId: string) {
    return this.eventsService.getCampaignSummary(req.user, campaignId);
  }

  @Public()
  @Post("track")
  track(
    @Body()
    dto: {
      type: string;
      organizationId: string;
      campaignId?: string;
      redirectLinkId?: string;
      nfcTagId?: string;
      sessionId?: string;
      payload?: Record<string, unknown>;
    }
  ) {
    return this.eventsService.track(dto);
  }
}