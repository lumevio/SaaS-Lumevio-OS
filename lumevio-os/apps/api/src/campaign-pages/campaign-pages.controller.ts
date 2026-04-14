import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
} from "@nestjs/common";
import { Roles } from "../auth/roles.decorator";
import { Public } from "../auth/public.decorator";
import { CampaignPagesService } from "./campaign-pages.service";

@Controller("campaign-pages")
export class CampaignPagesController {
  constructor(
    private readonly campaignPagesService: CampaignPagesService
  ) {}

  @Get()
  findAll(@Req() req: any) {
    return this.campaignPagesService.findAll(req.user);
  }

  @Public()
  @Get("public/:slug")
  findBySlug(@Param("slug") slug: string) {
    return this.campaignPagesService.findBySlug(slug);
  }

  @Roles("SUPERADMIN")
  @Post()
  create(
    @Body()
    dto: {
      organizationId: string;
      campaignId: string;
      title: string;
      slug?: string;
      templateType?: string;
      pageMode?: string;
      externalUrl?: string;
      customDomain?: string;
      jsonConfig?: Record<string, unknown>;
    }
  ) {
    return this.campaignPagesService.create(dto);
  }

  @Roles("SUPERADMIN")
  @Patch(":id/publish")
  publish(@Param("id") id: string) {
    return this.campaignPagesService.publish(id);
  }
}