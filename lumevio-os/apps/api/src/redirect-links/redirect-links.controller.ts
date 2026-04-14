import { Body, Controller, Get, Post, Req } from "@nestjs/common";
import { Roles } from "../auth/roles.decorator";
import { RedirectLinksService } from "./redirect-links.service";

@Controller("redirect-links")
export class RedirectLinksController {
  constructor(private readonly redirectLinksService: RedirectLinksService) {}

  @Get()
  findAll(@Req() req: any) {
    return this.redirectLinksService.findAll(req.user);
  }

  @Roles("SUPERADMIN")
  @Post()
  create(
    @Body()
    dto: {
      organizationId: string;
      campaignId?: string;
      title?: string;
      slug?: string;
      destinationUrl: string;
      fallbackUrl?: string;
    }
  ) {
    return this.redirectLinksService.create(dto);
  }
}