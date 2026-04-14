import { Body, Controller, Get, Post } from "@nestjs/common";
import { Public } from "./public.decorator";
import { AuthService } from "./auth.service";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post("login")
  login(@Body() dto: { email: string; password: string }) {
    return this.authService.login(dto.email, dto.password);
  }

  @Public()
  @Get("seed-admin")
  seedAdmin() {
    return this.authService.seedAdmin();
  }
}