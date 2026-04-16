import { Controller, Get, Post, Patch, Delete, Param, Body } from "@nestjs/common";
import { OrganizationsService } from "./organizations.service";
import { CreateOrganizationDto } from "./dto/create-organization.dto";
import { UpdateOrganizationDto } from "./dto/update-organization.dto";

@Controller("organizations")
export class OrganizationsController {
  constructor(private readonly service: OrganizationsService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.service.findOne(id);
  }

  @Get(":id/profile")
  getProfile(@Param("id") id: string) {
    return this.service.getClientProfile(id);
  }

  @Post()
  create(@Body() dto: CreateOrganizationDto) {
    return this.service.create(dto);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() dto: UpdateOrganizationDto) {
    return this.service.update(id, dto);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.service.remove(id);
  }

  // 🔥 PROVISION DRIVE
  @Post(":id/drive/provision")
  provision(@Param("id") id: string) {
    return this.service.reprovisionDrive(id);
  }

  // 🔥 SYNC PROFILE JSON DO DRIVE
  @Post(":id/drive/sync-profile")
  syncProfile(@Param("id") id: string) {
    return this.service.syncClientProfileToDrive(id);
  }
}