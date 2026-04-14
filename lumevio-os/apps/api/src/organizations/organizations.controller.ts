import { Body, Controller, Delete, Get, Param, Patch, Post, Req } from "@nestjs/common";
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

  @Roles("SUPERADMIN")
  @Patch(":id")
  update(
    @Param("id") id: string,
    @Body()
    dto: {
      name?: string;
      industry?: string;
      plan?: string;
      status?: string;
      syncEnabled?: boolean;
    }
  ) {
    return this.organizationsService.update(id, dto);
  }

  @Roles("SUPERADMIN")
  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.organizationsService.remove(id);
  }
}