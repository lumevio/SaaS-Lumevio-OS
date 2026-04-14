import { Body, Controller, Get, Param, Post, Req } from "@nestjs/common";
import { Roles } from "../auth/roles.decorator";
import { CampaignsService } from "./campaigns.service";

@Controller("campaigns")
export class CampaignsController {
  constructor(private readonly campaignsService: CampaignsService) {}

  @Get()
  findAll(@Req() req: any) {
    return this.campaignsService.findAll(req.user);
  }

  @Get(":id")
  findOne(@Param("id") id: string, @Req() req: any) {
    return this.campaignsService.findOne(id, req.user);
  }

  @Roles("SUPERADMIN")
  @Post()
  create(
    @Body()
    dto: {
      organizationId: string;
      storeId?: string;
      name: string;
      type: string;
      objective?: string;
    }
  ) {
    return this.campaignsService.create(dto);
  }
}