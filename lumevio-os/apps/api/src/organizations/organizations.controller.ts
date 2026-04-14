import { Body, Controller, Get, Param, Post, Req } from "@nestjs/common";
import { Roles } from "../auth/roles.decorator";
import { OrganizationsService } from "./organizations.service";

@Controller("organizations")
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Get()
  findAll(@Req() req: any) {
    return this.organizationsService.findAll(req.user);
  }

  @Get(":id")
  findOne(@Param("id") id: string, @Req() req: any) {
    return this.organizationsService.findOne(id, req.user);
  }

  @Roles("SUPERADMIN")
  @Post()
  create(
    @Body()
    dto: {
      name: string;
      industry?: string;
    }
  ) {
    return this.organizationsService.create(dto);
  }
}