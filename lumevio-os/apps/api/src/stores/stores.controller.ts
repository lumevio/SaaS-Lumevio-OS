import { Body, Controller, Get, Post, Req } from "@nestjs/common";
import { Roles } from "../auth/roles.decorator";
import { StoresService } from "./stores.service";

@Controller("stores")
export class StoresController {
  constructor(private readonly storesService: StoresService) {}

  @Get()
  findAll(@Req() req: any) {
    return this.storesService.findAll(req.user);
  }

  @Roles("SUPERADMIN")
  @Post()
  create(
    @Body()
    dto: {
      organizationId: string;
      name: string;
      city?: string;
      address?: string;
      zone?: string;
    }
  ) {
    return this.storesService.create(dto);
  }
}