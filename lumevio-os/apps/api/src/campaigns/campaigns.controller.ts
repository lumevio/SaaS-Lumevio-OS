import { Body, Controller, Delete, Get, Param, Patch, Post, Req } from "@nestjs/common";
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

  @Roles("SUPERADMIN")
  @Patch(":id")
  update(
    @Param("id") id: string,
    @Body()
    dto: {
      name?: string;
      type?: string;
      objective?: string;
      status?: string;
      storeId?: string | null;
    }
  ) {
    return this.campaignsService.update(id, dto);
  }

  @Roles("SUPERADMIN")
  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.campaignsService.remove(id);
  }
}