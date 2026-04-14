import { Controller, Get } from "@nestjs/common";

@Controller("drive")
export class DriveController {
  @Get("health")
  health() {
    return { ok: true };
  }
}
