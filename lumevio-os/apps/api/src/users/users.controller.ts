import { Body, Controller, Get, Post } from "@nestjs/common";
import { Roles } from "../auth/roles.decorator";
import { UsersService } from "./users.service";

@Controller("users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Roles("SUPERADMIN")
  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Roles("SUPERADMIN")
  @Post()
  create(
    @Body()
    dto: {
      email: string;
      password: string;
      firstName?: string;
      lastName?: string;
      organizationId: string;
    }
  ) {
    return this.usersService.create(dto);
  }
}